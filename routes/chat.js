import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { addNewMembers, getMyChats, getMyGroups, leaveGroup, newGroupchat, removeMember } from '../controllers/chat.js';

const app = express.Router();

// Routes after these need authentication

app.use(isAuthenticated)

app.post('/new', newGroupchat);

app.get('/my', getMyChats)

app.get('/my/groups', getMyGroups)

app.put('/addmembers', addNewMembers)

app.put('/removemembers', removeMember)

app.delete('/leave/:id', leaveGroup)

export default app;