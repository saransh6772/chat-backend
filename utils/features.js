import mongoose from "mongoose"
import jwt from 'jsonwebtoken'

const cookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true,
    httpOnly: true
}

const connectDB = (uri) => {
    mongoose.connect(uri, { dbName: 'Chat_App' }).then((data) => {
        console.log(`Connected to the database ${data.connection.host}`)
    }).catch((err) => {
        console.log('Error:', err)
        throw err
    })
}

const sendToken = (res, user, code, message) => {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET)
    res.status(code).cookie('chat-app-token', token, cookieOptions).json({
        success: true,
        message,
    })
}

const emitEvent = (req, event, users, data) => {
    console.log('Emitting event', event)
}

const deleteFiles = async(files) => {
    console.log('Deleting files', files)
}

export { connectDB, sendToken, cookieOptions, emitEvent, deleteFiles}