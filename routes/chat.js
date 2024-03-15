import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { addNewMembers, deleteChat, getChatDetails, getMessage, getMyChats, getMyGroups, leaveGroup, newGroupchat, removeMember, renameGroup, sendAttachments } from '../controllers/chat.js';
import { attachmentMulter } from '../middlewares/multer.js';

const app = express.Router();

// Routes after these need authentication

app.use(isAuthenticated)

app.post('/new', newGroupchat);

app.get('/my', getMyChats)

app.get('/my/groups', getMyGroups)

app.put('/addmembers', addNewMembers)

app.put('/removemembers', removeMember)

app.delete('/leave/:id', leaveGroup)

app.post('/message', attachmentMulter, sendAttachments)

app.get('/message/:id', getMessage)

app.route('/:id').get(getChatDetails).put(renameGroup).delete(deleteChat)

export default app;