import express from 'express';

const app = express.Router();

app.get('/', (req, res) => {
    res.send('Hello from the user route!');
});

export default app;