import { Router } from "express";

const todoRouter = Router();

todoRouter.get('/todos', getUserTodosController);
todoRouter.post('/todos', createUserTodosController);
todoRouter.put('/todos', updateUserTodosController);
todoRouter.delete('/todos/:id', deleteUserTodoController);

export default todoRouter;