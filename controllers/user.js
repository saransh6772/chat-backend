import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { cookieOptions, sendToken } from '../utils/features.js'
import { ErrorHandler } from '../utils/utility.js';
import { TryCatch } from '../middlewares/error.js';

const newUser = TryCatch(async (req, res) => {
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

const getUser = TryCatch(async (req, res) => {
    const user = await User.findById(req.user)
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
    const { name } = req.query
    return res.status(200).json({
        success: true,
        message: `searching for ${name}`
    })
})

export { newUser, login, getUser, logout, searchUser }
