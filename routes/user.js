import express from 'express';
import { getUser, login, logout, newUser } from '../controllers/user.js';
import { singleAvatar } from '../middlewares/multer.js';
import { isAuthenticated } from '../middlewares/auth.js';

const app = express.Router();

app.post('/new', singleAvatar, newUser);
app.post('/login', login);

// Routes after these need authentication

app.use(isAuthenticated)

app.get('/me', getUser)
app.get('/logout', logout)

export default app;