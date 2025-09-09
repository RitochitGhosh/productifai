import { Router } from "express";
import { 
  getUserCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} from '../controllers/category.controller.js';
import { authenticateToken } from "../utils/auth.js";

const categoryRouter = Router();

categoryRouter.get('/categories', authenticateToken, getUserCategoriesController);
categoryRouter.post('/categories', authenticateToken, createCategoryController);
categoryRouter.put('/categories/:id', authenticateToken, updateCategoryController);
categoryRouter.delete('/categories/:id', authenticateToken, deleteCategoryController);

export default categoryRouter;