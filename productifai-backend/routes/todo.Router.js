import { Router } from "express";
import { 
    createUserTodosController, 
    deleteUserTodoController, 
    getUserTodosController, 
    updateUserTodosController 
} from "../controllers/todo.controller";

import { authenticateToken } from "../utils/auth";

const todoRouter = Router();

todoRouter.get('/todos', authenticateToken, getUserTodosController);
todoRouter.post('/todos', authenticateToken, createUserTodosController);
todoRouter.put('/todos', authenticateToken, updateUserTodosController);
todoRouter.delete('/todos/:id', authenticateToken, deleteUserTodoController);

export default todoRouter;