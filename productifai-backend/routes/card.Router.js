import { Router } from "express";

const cardRouter = Router();

cardRouter.get('/', getAllCardsController);
cardRouter.get('/cards/:user_id', getUserCardsController);
cardRouter.post('/cards/create', createCardController);
cardRouter.post('/cards/generate', generateCardController);
cardRouter.put("/cards/:card_id/:user_id" , cardController.updateCard);
cardRouter.post("/createCards" , createCardsController);

cardRouter.get("/decks/:user_id", getAllDecksController);
cardRouter.post("/decks/create" , createDeckController);

cardRouter.delete('/deleteCard' , deleteCardController);
cardRouter.delete('/deleteAllCards' , deleteAllCardsController);

export default cardRouter;