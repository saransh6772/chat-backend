import { ALERT, REFETCH_CHATS } from "../constants/event.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { emitEvent } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

const newGroupchat = TryCatch(async (req, res, next) => {
    const { name, members } = req.body;
    if (members.length < 2) {
        return next(new ErrorHandler('Chat must have atleast 3 members', 400))
    }
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
    if (!members || members.length < 1) {
        return next(new ErrorHandler('Members are required', 400))
    }
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

export { addNewMembers, getMyChats, getMyGroups, newGroupchat, removeMember, leaveGroup };
