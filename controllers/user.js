import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { Chat } from '../models/chat.js'
import { Request } from '../models/request.js'
import { cookieOptions, emitEvent, sendToken } from '../utils/features.js'
import { ErrorHandler } from '../utils/utility.js';
import { TryCatch } from '../middlewares/error.js';
import { NEW_REQUEST, REFETCH_CHATS } from '../constants/event.js';
import { getOtherMember } from '../lib/helper.js';

const newUser = TryCatch(async (req, res, next) => {
    const { name, username, password, bio } = req.body;
    const avatar = {
        public_id: "uykfv",
        url: "kuyf"
    }
    const user = await User.create({
        name,
        bio,
        username,
        password,
        avatar
    })
    sendToken(res, user, 201, 'User created successfully')
})

const login = TryCatch(async (req, res, next) => {
    const { username, password } = req.body
    const user = await User.findOne({ username }).select('+password')
    if (!user) {
        return next(new ErrorHandler('Invalid username or password', 404))
    }
    const isMatch = await compare(password, user.password)
    if (!isMatch) {
        return next(new ErrorHandler('Invalid password or password', 404))
    }
    sendToken(res, user, 200, `Welcome ${user.name}!`)
})

const getUser = TryCatch(async (req, res, next) => {
    const user = await User.findById(req.user)
    if (!user) return next(new ErrorHandler('User not found', 404))
    res.status(200).json({
        success: true,
        data: user
    })
})

const logout = TryCatch(async (req, res) => {
    const { name } = req.query
    return res.status(200).json({
        success: true,
        message: name
    })
})

const searchUser = TryCatch(async (req, res) => {
    const { name = "" } = req.query
    const myChats = await Chat.find({ groupChat: false, members: req.user })
    const usersFromMyChats = myChats.flatMap(chat => chat.members)
    const usersExceptMeAndFriends = await User.find({
        _id: { $nin: usersFromMyChats },
        name: { $regex: name, $options: 'i' },
    })
    const users = usersExceptMeAndFriends.map(({ _id, name, avatar }) => ({ _id, name, avatar: avatar.url }))
    return res.status(200).json({
        success: true,
        users
    })
})

const sendRequest = TryCatch(async (req, res, next) => {
    const userId = req.body.userId
    const request = await Request.findOne({
        $or: [
            { sender: req.user, receiver: userId },
            { sender: userId, receiver: req.user }
        ]
    })
    if (request) {
        return next(new ErrorHandler('Request already sent', 400))
    }
    await Request.create({
        sender: req.user,
        receiver: userId
    })
    emitEvent(req, NEW_REQUEST, [userId])
    return res.status(200).json({
        success: true,
        message: 'Request sent'
    })
})

const acceptRequest = TryCatch(async (req, res, next) => {
    const { requestId, status } = req.body
    const request = await Request.findById(requestId).populate('sender', 'name').populate('receiver', 'name')
    if (!request) {
        return next(new ErrorHandler('Request not found', 404))
    }
    console.log(request)
    if (request.receiver._id.toString() !== req.user.toString()) {
        return next(new ErrorHandler('Unauthorized', 401))
    }
    if (!status) {
        await request.deleteOne()
        return res.status(200).json({
            success: true,
            message: 'Request rejected'
        })
    }
    const members = [request.sender._id, request.receiver._id]
    await Promise.all([
        Chat.create({ members, name: `${request.sender.name}, ${request.receiver.name}` }),
        request.deleteOne()
    ])
    emitEvent(req, REFETCH_CHATS, members)
    return res.status(200).json({
        success: true,
        message: 'Request accepted',
        senderId: request.sender._id
    })
})

const getNotifications = TryCatch(async (req, res) => {
    const requests = await Request.find({ receiver: req.user }).populate('sender', 'name avatar')
    const allRequests = requests.map(({ _id, sender }) => ({ _id, sender: { _id: sender._id, name: sender.name, avatar: sender.avatar.url } }))
    res.status(200).json({
        success: true,
        allRequests
    })
})

const getFriends = TryCatch(async (req, res) => {
    const chatId = req.query.chatId
    const chats = await Chat.find({ members: req.user, groupChat: false }).populate('members', 'name avatar')
    const friends = chats.map(({ members }) => {
        const friend = getOtherMember(members, req.user)
        return {
            _id: friend._id,
            name: friend.name,
            avatar: friend.avatar.url
        }
    })
    if (chatId) {
        const chat = await Chat.findById(chatId)
        const availableFriends = friends.filter(friend => !chat.members.includes(friend._id))
        return res.status(200).json({
            success: true,
            friends: availableFriends
        })
    } else {
        res.status(200).json({
            success: true,
            friends
        })
    }
})

export { newUser, login, getUser, logout, searchUser, sendRequest, acceptRequest, getNotifications, getFriends }
