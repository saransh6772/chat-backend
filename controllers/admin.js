import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from 'jsonwebtoken'
import { cookieOptions } from "../utils/features.js";
import { adminSecretKey } from "../app.js";

const login = TryCatch(async (req, res, next) => {
    const { secretKey } = req.body
    const isMatch = secretKey === adminSecretKey
    if (!isMatch) {
        next(new ErrorHandler('Invalid Secret Key', 401))
    }
    const token = jwt.sign(secretKey, process.env.JWT_SECRET)
    return res.status(200).cookie('chat-app-admin-token', token, { ...cookieOptions, maxAge: 1000 * 60 * 15 }).json({
        success: true,
        message: 'Welcome Admin!'
    })
})

const logout = TryCatch(async (req, res, next) => {
    return res.status(200).cookie('chat-app-admin-token', "", { ...cookieOptions, maxAge: 0 }).json({
        success: true,
        message: 'Admin Logged Out Successfully'
    })
})

const getAdminData = TryCatch(async (req, res, next) => {
    return res.status(200).json({
        success: true,
        message: 'Welcome Admin!'
    })
})

const getUsers = TryCatch(async (req, res, next) => {
    const users = await User.find()
    const transformedUsers = await Promise.all(
        users.map(async ({ name, _id, username, avatar }) => {
            const [groups, friends] = await Promise.all([
                Chat.countDocuments({ groupChat: true, members: _id }),
                Chat.countDocuments({ groupChat: false, members: _id })
            ])
            return { name, _id, username, avatar: avatar.url, groups, friends }
        })
    )
    return res.status(200).json({
        success: true,
        users: transformedUsers
    })
})

const getChats = TryCatch(async (req, res, next) => {
    const chats = await Chat.find().populate('members', 'name avatar').populate('creator', 'name avatar')
    const transformedChats = await Promise.all(
        chats.map(async ({ _id, name, groupChat, members, creator }) => {
            const totalMessages = await Message.countDocuments({ chat: _id })
            return {
                _id,
                name,
                groupChat,
                avatar: members.slice(0, 3).map(member => member.avatar.url),
                members: members.map(({ name, _id, avatar }) => ({ name, avatar: avatar.url, _id })),
                creator: { name: creator?.name || "None", avatar: creator?.avatar.url || "" },
                totalMessages
            }
        })
    )
    return res.status(200).json({
        success: true,
        chats: transformedChats
    })
})

const getMessages = TryCatch(async (req, res, next) => {
    const messages = await Message.find().populate('sender', 'name avatar').populate('chat', 'groupChat')
    const transformedMessages = messages.map(({ _id, chat, sender, attachments, content, createdAt }) => ({
        _id,
        chat: chat._id,
        groupChat: chat.groupChat,
        sender: { name: sender.name, avatar: sender.avatar.url, _id: sender._id },
        content,
        createdAt,
        attachments
    }))
    return res.status(200).json({
        success: true,
        messages: transformedMessages
    })
})

const getStats = TryCatch(async (req, res, next) => {
    const [users, chats, messages, groupChats] = await Promise.all([
        User.countDocuments(),
        Chat.countDocuments(),
        Message.countDocuments(),
        Chat.countDocuments({ groupChat: true })
    ])
    const today = new Date()
    const last7Days = new Date().setDate(today.getDate() - 7)
    const last7DaysMessages = await Message.find({ createdAt: { $gte: last7Days, $lte: today } }).select('createdAt')
    const lastMessages = new Array(7).fill(0)
    last7DaysMessages.forEach(({ createdAt }) => {
        const i = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        lastMessages[6 - i]++
    })
    return res.status(200).json({
        success: true,
        stats: {
            users,
            chats,
            messages,
            groupChats,
            individualChats: chats - groupChats,
            lastMessages
        }
    })
})

export { getUsers, getChats, getMessages, getStats, login, logout, getAdminData}