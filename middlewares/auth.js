import { ErrorHandler } from '../utils/utility.js'
import jwt from 'jsonwebtoken'

const isAuthenticated = (req, res, next) => {
    const token = req.cookies['chat-app-token']
    if (!token) {
        return next(new ErrorHandler('Login to access this route', 401))
    }
    const decodedData = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decodedData._id
    next()
}

const isAdmin = (req, res, next) => {
    const token = req.cookies['chat-app-admin-token']
    if (!token) {
        return next(new ErrorHandler('Only admin can access', 401))
    }
    const secretKey = jwt.verify(token, process.env.JWT_SECRET)
    const adminSecretKey = process.env.ADMIN_SECRET_KEY
    const isMatch = secretKey === adminSecretKey
    if (!isMatch) {
        next(new ErrorHandler('Invalid Secret Key', 401))
    }
    next()
}

export { isAuthenticated, isAdmin }