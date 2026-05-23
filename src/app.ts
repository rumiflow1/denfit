import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import identityRoutes from './routes/identityRoutes.js';

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api', apiLimiter); // Apply security limit

// Master API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/campaign', campaignRoutes);
app.use('/api/identity', identityRoutes);

app.use(errorHandler);

export default app;