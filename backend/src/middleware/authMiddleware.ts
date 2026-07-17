import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SECRET } from '../config/env.js';

interface TokenPayload {
    id: string;
}

// Request tipado para rotas autenticadas: o userId nunca vem do
// corpo/query da requisição, apenas do token JWT já validado.
export interface AuthRequest extends Request {
    userId?: string;
}

export const autenticarToken = (req: AuthRequest, res: Response, next: NextFunction): void => {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, SECRET) as TokenPayload;

        req.userId = decoded.id;

        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido ou expirado.' });
        console.error('Erro ao validar token:', error);
    }
};