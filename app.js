import express from 'express'
import { connectDB } from './utils/features.js';
import dotenv from 'dotenv'
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer, get } from 'http';
import { v4 as uuid } from 'uuid';

import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { createGroupChat, createMessageInChat, createMessages, createSingleChat, createUser } from './seeders/samples.js';
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from './constants/event.js';
import { getSockets } from './lib/helper.js';
import { Message } from './models/message.js';

dotenv.config({
    path: './.env'
});

const uri = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
export const adminSecretKey = process.env.ADMIN_SECRET_KEY;
export const userSocketIDs = new Map();

connectDB(uri);

// createUser(10)
// createSingleChat(10)
// createGroupChat(10)
// createMessages(10)
// createMessageInChat(10,'65f32761124c79b460a881dc')

const app = express();
const server = createServer(app);
const io = new Server(server, {});

app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the server!');
})

io.use((socket, next) => {});

io.on('connection', (socket) => {
    const user = {
        id: "frjen",
        name: "freounf"
    }
    userSocketIDs.set(user.id.toString(), socket.id);
    console.log(userSocketIDs);
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRT = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user.id,
                name: user.name
            },
            chat: chatId,
            createdAt: new Date().toISOString()
        }
        console.log('New Message', messageForRT);
        const messageForDB = {
            content: message,
            sender: user.id,
            chat: chatId,
        }
        const membersSocket = getSockets(members);
        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRT
        });
        io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId })
        try {
            await Message.create(messageForDB);
        } catch (err) {
            console.log(err);
        }
    })
    socket.on('disconnect', () => {
        console.log('user disconnected');
        userSocketIDs.delete(user.id.toString());
    });
});

app.use(errorMiddleware)

server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${envMode} mode.`);
})