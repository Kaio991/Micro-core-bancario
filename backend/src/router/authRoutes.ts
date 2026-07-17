import { Router } from 'express';
import { deletarUsuario, getProfile, login, register } from '../controllers/authController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.js';

const routerAuth = Router();

routerAuth.post('/auth/register', registerLimiter, register);
routerAuth.post('/auth/login', loginLimiter, login)

//rotas protegidas
routerAuth.get('/auth/me', autenticarToken, getProfile)
routerAuth.delete("/auth/deletar", autenticarToken, deletarUsuario)

export default routerAuth;