import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { ModelUser } from '../models/modelUser.js';
import jwt from 'jsonwebtoken';
import { SECRET } from '../config/env.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, transactionPin } = req.body;

        if (!transactionPin || transactionPin.length !== 4 || isNaN(Number(transactionPin))) {
            res.status(400).json({ error: "A senha transacional deve ter exatamente 4 números." });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = await bcrypt.hash(transactionPin, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            transactionPin: hashedPin,
            balance: 0.00
        });

        res.status(201).json({ message: "Usuário criado com sucesso! 🚀" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao cadastrar usuário." });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const userInstance = await User.findOne({ where: { email } });
        if (!userInstance) {
            res.status(401).json({ error: 'E-mail ou senha inválidos.' });
            return;
        }

        const user = userInstance.get({ plain: true });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'E-mail ou senha inválidos.' });
            return;
        }

        // Antes: `(process.env.SECRET as string)` sem checagem, e sem
        // fallback (diferente do middleware, que tinha fallback hardcoded).
        // Agora: mesma fonte única usada no middleware, sempre validada no boot.
        const token = jwt.sign(
            { id: user.id },
            SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login realizado com sucesso! Seja bem-vindo 💸',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao tentar logar.' });
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Antes: const { userId } = req.body  -> rota GET não costuma ter
        // body, e o cliente podia mandar o id de qualquer outro usuário (IDOR).
        // Agora: o id vem só do token, já validado pelo middleware.
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        const userInstance = await User.findByPk(userId);
        if (!userInstance) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }

        const user = userInstance.get({ plain: true });

        res.status(200).json({
            message: 'Dados do perfil recebido com sucesso! 💳',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao buscar perfil.' });
    }
};

export const deletarUsuario = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.userId;
        if (!id) {
            res.status(401).json({ message: "Não autorizado" });
            return;
        }
        await User.destroy({ where: { id } });

        res.status(200).json({
            message: "Usuario deletado com sucesso"
        });
    } catch (error) {
        res.status(500).json({ message: "erro ao deletar usuario" });
    }
};