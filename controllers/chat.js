import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Chat } from "../models/chat.js";
import { emitEvent } from "../utils/features.js";
import { ALERT, REFETCH_CHATS } from "../constants/event.js";

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

export { newGroupchat }