import express from 'express'
import userRoutes from './routes/user.js';
import { connectDB } from './utils/features.js';
import dotenv from 'dotenv'

dotenv.config({
    path: './.env'
});

const uri = process.env.MONGO_URI;
const port = process.env.PORT || 3000;

connectDB(uri);

const app = express();

app.use(express.json());

app.use('/user', userRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the server!');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})