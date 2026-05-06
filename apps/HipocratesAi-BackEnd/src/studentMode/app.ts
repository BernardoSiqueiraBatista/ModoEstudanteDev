import express from "express";
import performanceRoutes from './modules/performance/performance.routes';

const app = express();
app.use(express.json());

app.use('/student', performanceRoutes);