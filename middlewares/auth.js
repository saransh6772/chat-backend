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

export { isAuthenticated }