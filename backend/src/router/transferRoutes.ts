import { Router } from 'express';
import { depositarDinheiro, obterExtrato, sacarDinheiro, transferirDinheiro } from '../controllers/transferController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';
import { transferLimiter } from '../middleware/rateLimiter.js';

const transferRouter = Router();

transferRouter.post('/transfer/pix', autenticarToken, transferLimiter, transferirDinheiro);
transferRouter.post('/transfer/deposito', autenticarToken, depositarDinheiro);
transferRouter.post('/transfer/saque', autenticarToken, transferLimiter, sacarDinheiro)
transferRouter.get('/transfer/extrato', autenticarToken, obterExtrato);

export default transferRouter;