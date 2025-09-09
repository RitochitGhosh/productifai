import { Router } from 'express';
import { 
    signinController, 
    signoutController, 
    signupController 
} from '../controllers/auth.controller.js';

const authRouter = Router();

authRouter.post('/signup', signupController);
authRouter.post('/signin', signinController);
authRouter.post('/sign-out', signoutController);

export default authRouter;