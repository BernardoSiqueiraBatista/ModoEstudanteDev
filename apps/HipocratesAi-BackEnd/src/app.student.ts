import express, { RequestHandler } from 'express';
import cors from 'cors';
import studentRouter from './studentMode/student.routes';

const app = express();

app.use(express.json({ limit: '10mb' }) as unknown as RequestHandler);
app.use(cors() as unknown as RequestHandler);

app.use("/student", studentRouter);

export { app };