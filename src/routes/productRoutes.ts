import express from 'express';
import { addProduct, getProducts, updateProduct } from '../controllers/productController.js';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.post('/add', isAdmin, addProduct);
router.put('/update/:id', isAdmin, updateProduct);

export default router;