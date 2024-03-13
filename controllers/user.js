import { User } from '../models/user.js'


const newUser = async (req, res) => {
    const { name, username, password, bio } = req.body;
    await User.create({ name: 'chaman', username: "chaman", password: 'chaman', avatar })
    res.status(201).json({ message: 'user created' })
}

const login = async (req, res) => {
    res.send('login');
}

export { newUser, login }
