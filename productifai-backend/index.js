import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.Router.js';
import cardRouter from './routes/card.Router.js';
import todoRouter from './routes/todo.Router.js';
import categoryRouter from './routes/category.Router.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.status(200).json({
        message: "ok"
    })
});

app.use("/auth", authRouter);
app.use("/api/revise", cardRouter);
app.use("/api/", todoRouter);
app.use("/api", categoryRouter)

app.listen(PORT, () => {
    console.log(`App listening on: http://localhost:${PORT}`);
});