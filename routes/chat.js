import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { newGroupchat } from '../controllers/chat.js';

const app = express.Router();

// Routes after these need authentication

app.use(isAuthenticated)

app.post('/new', newGroupchat);

export default app;