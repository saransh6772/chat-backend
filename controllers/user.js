import { compare } from 'bcrypt';
import { User } from '../models/user.js'
import { sendToken } from '../utils/features.js'

const newUser = async (req, res) => {
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
}

const login = async (req, res) => {
    const { username, password } = req.body
    const user = await User.findOne({ username }).select('+password')
    if (!user) {
        return next(new Error('Invalid username'))
    }
    const isMatch = await compare(password, user.password)
    if (!isMatch) {
        return next(new Error('Invalid password'))
    }
    sendToken(res, user, 200, `Welcome ${user.name}!`)
}

const getMyProfile = async (req, res) => {
    const user = await User.findById(req.user._id)
    res.status(200).json(user)
}

export { newUser, login, getMyProfile }
