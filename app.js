import express from 'express'
import { connectDB } from './utils/features.js';
import dotenv from 'dotenv'
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/user.js';
import chatRoutes from './routes/chat.js';
import adminRoutes from './routes/admin.js';
import { createGroupChat, createMessageInChat, createMessages, createSingleChat, createUser } from './seeders/samples.js';

dotenv.config({
    path: './.env'
});

const uri = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
export const adminSecretKey = process.env.ADMIN_SECRET_KEY;

connectDB(uri);

// createUser(10)
// createSingleChat(10)
// createGroupChat(10)
// createMessages(10)
// createMessageInChat(10,'65f32761124c79b460a881dc')

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the server!');
})

app.use(errorMiddleware)

app.listen(port, () => {
    console.log(`Server is running on port ${port} in ${envMode} mode.`);
})