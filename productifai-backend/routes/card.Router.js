import { Router } from "express";

import { 
    createCardController, 
    createCardsController, 
    createDeckController, 
    deleteAllCardsController, 
    deleteCardController, 
    generateCardController, 
    getAllCardsController, 
    getAllDecksController, 
    getUserCardsController, 
    updateCardController 
} from "../controllers/card.controller.js";
import { authenticateToken } from "../utils/auth.js";

const cardRouter = Router();


cardRouter.get('/', authenticateToken, getAllCardsController); // Tested
cardRouter.get('/cards/:user_id', authenticateToken, getUserCardsController); // Tested
cardRouter.post('/cards/create', authenticateToken, createCardController); // Tested
cardRouter.post('/cards/generate', authenticateToken, generateCardController); // Tested
cardRouter.put("/cards/:card_id/:user_id" , authenticateToken, updateCardController); // Tested
cardRouter.post("/cards/createCards" , authenticateToken, createCardsController); // Tested

cardRouter.get("/decks/:user_id", authenticateToken, getAllDecksController); // Tested
cardRouter.post("/decks/create" , authenticateToken, createDeckController); // Tested

cardRouter.delete('/deleteCard' , authenticateToken, deleteCardController); // Tested
cardRouter.delete('/deleteAllCards' , authenticateToken, deleteAllCardsController); // (Will test later)

export default cardRouter;