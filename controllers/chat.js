import { ALERT, NEW_ATTACHMENT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { deleteFiles, emitEvent } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import { Message } from "../models/message.js";

const newGroupchat = TryCatch(async (req, res, next) => {
    const { name, members } = req.body;
    const allMembers = [...members, req.user]
    await Chat.create({
        name,
        members: allMembers,
        groupChat: true,
        creator: req.user
    })
    emitEvent(req, ALERT, allMembers, `welcome to ${name} group chat!`)
    emitEvent(req, REFETCH_CHATS, members)
    return res.status(201).json({
        success: true,
        message: 'Group chat created successfully'
    })
})

const getMyChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user }).populate('members', 'name avatar')
    const transformedChats = chats.map(chat => {
        const { _id, name, members, groupChat } = chat
        const otherMember = getOtherMember(members, req.user)
        return {
            _id,
            name: groupChat ? name : otherMember.name,
            groupChat,
            avatar: groupChat ? members.slice(0, 3).map(({ avatar }) => avatar.url) : [otherMember.avatar.url],
            members: members.reduce((prev, curr) => {
                if (curr._id.toString() !== req.user.toString()) {
                    prev.push(curr._id)
                }
                return prev
            }, []),
        }
    })
    return res.status(200).json({
        success: true,
        chats: transformedChats
    })
})

const getMyGroups = TryCatch(async (req, res, next) => {
    const chats = await Chat.find({ members: req.user, groupChat: true, creator: req.user }).populate('members', 'name avatar')
    const groups = chats.map(({ members, _id, groupChat, name }) => ({
        _id,
        name,
        groupChat,
        avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
    }))
    return res.status(200).json({
        success: true,
        groups
    })
})

const addNewMembers = TryCatch(async (req, res, next) => {
    const { chatId, members } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    if (!chat.groupChat) {
        return next(new ErrorHandler('This is not a group chat', 400))
    }
    if (chat.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler('You are not authorized to add members', 403))
    }
    const allNewMembersPromise = members.map((i) => User.findById(i, 'name'))
    const allNewMembers = await Promise.all(allNewMembersPromise)
    const uniqueMembers = allNewMembers.filter(i => !chat.members.includes(i._id.toString())).map(i => i._id)
    chat.members.push(...uniqueMembers)
    if (chat.members.length > 50) {
        return next(new ErrorHandler('Members limit exceeded', 400))
    }
    await chat.save()
    const allMembers = allNewMembers.map(i => i.name).join(', ')
    emitEvent(req, ALERT, chat.members, `${allMembers} added to ${chat.name} group chat!`)
    emitEvent(req, REFETCH_CHATS, chat.members)
    res.status(200).json({
        success: true,
        message: 'Members added successfully'
    })
})

const removeMember = TryCatch(async (req, res, next) => {
    const { chatId, userId } = req.body;
    if (!userId) {
        return next(new ErrorHandler('User id is required', 400))
    }
    const [chat, user] = await Promise.all(
        Chat.findById(chatId),
        User.findById(userId, 'name')
    )
    if (!user) {
        return next(new ErrorHandler('User not found', 404))
    }
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    if (!chat.groupChat) {
        return next(new ErrorHandler('This is not a group chat', 400))
    }
    if (chat.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler('You are not authorized to remove members', 403))
    }
    if (chat.members.length <= 3) {
        return next(new ErrorHandler('Atleast 3 members are required in a group chat', 400))
    }
    chat.members = chat.members.filter(i => i.toString() !== userId.toString())
    await chat.save()
    emitEvent(req, ALERT, chat.members, `${user.name} removed from ${chat.name} group chat!`)
    emitEvent(req, REFETCH_CHATS, chat.members)
    res.status(200).json({
        success: true,
        message: 'Member removed successfully'
    })
})

const leaveGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    if (!chat.groupChat) {
        return next(new ErrorHandler('This is not a group chat', 400))
    }
    const remainingMembers = chat.members.filter(i => i.toString() !== req.user.toString())
    if (remainingMembers.length < 3) {
        return next(new ErrorHandler('Atleast 3 members are required in a group chat', 400))
    }
    if (chat.creator.toString() === req.user.toString()) {
        const newAdmin = remainingMembers[0];
        chat.creator = newAdmin;
    }
    chat.members = remainingMembers;
    const [user] = await Promise.all([User.findById(req.user, 'name'), chat.save()])
    emitEvent(req, ALERT, chat.members, `${user.name} left ${chat.name} group chat!`)
    res.status(200).json({
        success: true,
        message: 'Left group chat successfully'
    })
})

const sendAttachments = TryCatch(async (req, res, next) => {
    const { chatId } = req.body;
    const files = req.files || []
    if (files.length < 1) {
        return next(new ErrorHandler('Files are required', 400))
    }
    if(files.length > 5){
        return next(new ErrorHandler('Maximum 5 files are allowed', 400))
    }
    const [chat, user] = await Promise.all([Chat.findById(chatId), User.findById(req.user, 'name')])
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    const attachments = []
    const messageForRealTime = {
        chat: chatId,
        sender: {
            _id: user._id,
            name: user.name
        },
        attachments
    }
    const messageForDB = {
        content: '',
        attachments,
        sender: user._id,
        chat: chatId
    }
    const message = await Message.create(messageForDB)
    emitEvent(req, NEW_ATTACHMENT, chat.members, { message: messageForRealTime, chatId })
    emitEvent(req, REFETCH_CHATS, chat.members, { chatId })
    return res.status(200).json({
        success: true,
        message
    })
})

const getChatDetails = TryCatch(async (req, res, next) => {
    if (req.query.populate === 'true') {
        const chat = await Chat.findById(req.params.id).populate('members', 'name avatar').lean()
        if (!chat) {
            return next(new ErrorHandler('Chat not found', 404))
        }
        chat.members = chat.members.map(member => ({
            _id: member._id,
            name: member.name,
            avatar: member.avatar.url
        }))
        return res.status(200).json({
            success: true,
            chat
        })
    } else {
        const chat = await Chat.findById(req.params.id)
        if (!chat) {
            return next(new ErrorHandler('Chat not found', 404))
        }
        return res.status(200).json({
            success: true,
            chat
        })
    }
})

const renameGroup = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { name } = req.body;
    if (!name) {
        return next(new ErrorHandler('Name is required', 400))
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    if (!chat.groupChat) {
        return next(new ErrorHandler('This is not a group chat', 400))
    }
    if (chat.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler('You are not authorized to rename the group', 403))
    }
    chat.name = name;
    await chat.save()
    emitEvent(req, REFETCH_CHATS, chat.members)
    return res.status(200).json({
        success: true,
        message: 'Group chat renamed successfully'
    })
})

const deleteChat = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return next(new ErrorHandler('Chat not found', 404))
    }
    if (chat.groupChat && chat.creator.toString() !== req.user.toString()) {
        return next(new ErrorHandler('You are not authorized to delete the chat', 403))
    }
    if (!chat.groupChat && !chat.members.includes(req.user.toString())) {
        return next(new ErrorHandler('You are not authorized to delete the chat', 403))
    }
    const messageWithAttachments = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } })
    const public_ids = []
    messageWithAttachments.forEach(message => {
        message.attachments.forEach(attachment => {
            public_ids.push(attachment.public_id)
        })
    })
    await Promise.all([
        deleteFiles(public_ids),
        chat.deleteOne(),
        Message.deleteMany({ chat: chatId })
    ])
    emitEvent(req, REFETCH_CHATS, chat.members)
    return res.status(200).json({
        success: true,
        message: 'Chat deleted successfully'
    })
})

const getMessage = TryCatch(async (req, res, next) => {
    const chatId = req.params.id;
    const { page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    const [messages, totalMessages] = await Promise.all([
        Message.find({ chat: chatId }).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('sender', 'name').lean(),
        Message.countDocuments({ chat: chatId })
    ])
    const totalPages = Math.ceil(totalMessages / limit) || 0
    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages
    })
})

export { addNewMembers, getMyChats, getMyGroups, newGroupchat, removeMember, leaveGroup, sendAttachments, getChatDetails, renameGroup, deleteChat, getMessage };