import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { addNewMembers, deleteChat, getChatDetails, getMessage, getMyChats, getMyGroups, leaveGroup, newGroupchat, removeMember, renameGroup, sendAttachments } from '../controllers/chat.js';
import { attachmentMulter } from '../middlewares/multer.js';
import { addMembersValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from '../lib/validators.js';

const app = express.Router();

// Routes after these need authentication

app.use(isAuthenticated)

app.post('/new', newGroupValidator(), validateHandler, newGroupchat);

app.get('/my', getMyChats)

app.get('/my/groups', getMyGroups)

app.put('/addmembers', addMembersValidator(), validateHandler, addNewMembers)

app.put('/removemembers', removeMemberValidator(), validateHandler, removeMember)

app.delete('/leave/:id', chatIdValidator(), validateHandler, leaveGroup)

app.post('/message', attachmentMulter, sendAttachmentsValidator(), validateHandler, sendAttachments)

app.get('/message/:id', chatIdValidator(), validateHandler, getMessage)

app.route('/:id').get(chatIdValidator(), validateHandler, getChatDetails).put(renameGroupValidator(), validateHandler, renameGroup).delete(chatIdValidator(), validateHandler, deleteChat)

export default app;