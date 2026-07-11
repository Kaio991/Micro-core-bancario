import { Router } from 'express';
import { deletarUsuario, getProfile, login, register } from '../controllers/authController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const routerAuth = Router();


routerAuth.post('/auth/register', register);
routerAuth.post('/auth/login', login)

//rotas protegidas
routerAuth.get('/auth/me',autenticarToken, getProfile)
routerAuth.delete("/auth/deletar",autenticarToken,deletarUsuario)

export default routerAuth;