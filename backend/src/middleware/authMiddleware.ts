import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
    id: string;
}

export const autenticarToken = (req: Request, res: Response, next: NextFunction): void => {
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    
    if (!token) {
        res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
        return;
    }

    try {
       
        const secretKey = (process.env.SECRET as string) || 'chave_reserva_caso_env_falhe';
        const decoded = jwt.verify(token, secretKey) as TokenPayload;

        (req as any).userId = decoded.id
       
        next();
    } catch (error) {
        res.status(403).json({ error: 'Token inválido ou expirado.' });
        console.log(error);
        
    }
};