import express from 'express';
import { acceptRequest, getFriends, getNotifications, getUser, login, logout, newUser, searchUser, sendRequest } from '../controllers/user.js';
import { singleAvatar } from '../middlewares/multer.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from '../lib/validators.js';

const app = express.Router();

app.post('/new', singleAvatar, registerValidator(), validateHandler, newUser);
app.post('/login', loginValidator(), validateHandler, login);

// Routes after these need authentication

app.use(isAuthenticated)

app.get('/me', getUser)
app.get('/logout', logout)
app.get('/search', searchUser)
app.put('/send-request', sendRequestValidator(), validateHandler, sendRequest)
app.put('/accept-request', acceptRequestValidator(), validateHandler, acceptRequest)
app.get('/notifications', getNotifications)
app.get('/friends', getFriends)

export default app;