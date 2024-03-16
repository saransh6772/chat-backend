import express from 'express'
import { getAdminData, getChats, getMessages, getStats, getUsers, login, logout } from '../controllers/admin.js'
import { adminValidator, validateHandler } from '../lib/validators.js'
import { isAdmin } from '../middlewares/auth.js'

const app = express.Router()

app.post('/login', adminValidator(), validateHandler, login)
app.get('/logout', logout)

app.use(isAdmin)
app.get('/', getAdminData)
app.get('/users', getUsers)
app.get('/chats', getChats)
app.get('/messages', getMessages)
app.get('/stats', getStats)

export default app