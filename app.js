import express from 'express'
import userRoutes from './routes/user.js';
import { connectDB } from './utils/features.js';
import dotenv from 'dotenv'
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser';

dotenv.config({
    path: './.env'
});

const uri = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

connectDB(uri);

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/user', userRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the server!');
})

app.use(errorMiddleware)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})