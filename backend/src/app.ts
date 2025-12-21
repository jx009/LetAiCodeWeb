/**
 * Express 应用配置
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger.util';
import routes from './routes';
import { errorMiddleware, notFoundMiddleware } from './middlewares';

const app: Express = express();

// 基础中间件
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流已禁用
// const limiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 200,
//   message: '请求过于频繁，请稍后再试',
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api', routes);

// 404 处理
app.use(notFoundMiddleware);

// 错误处理
app.use(errorMiddleware);

export default app;
