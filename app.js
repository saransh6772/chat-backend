import express from 'express'
import userRoutes from './routes/user';

const app = express();

app.use('/user', userRoutes);

app.get('/', (req, res) => {
    res.send('Hello from the server!');
})

app.listen(3000, () => {
    console.log('Server is running on port 3000');
})