import { Router } from 'express';
import { depositarDinheiro, obterExtrato, sacarDinheiro, transferirDinheiro } from '../controllers/transferController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';


const transferRouter = Router();


transferRouter.post('/transfer/pix', autenticarToken, transferirDinheiro);
transferRouter.post('/transfer/deposito', autenticarToken, depositarDinheiro);
transferRouter.post('/transfer/saque',autenticarToken, sacarDinheiro)
transferRouter.get('/transfer/extrato', autenticarToken, obterExtrato);



export default transferRouter;