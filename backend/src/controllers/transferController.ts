import { Response } from 'express';
import sequelize from '../config/database.js';
import User from '../models/modelUser.js';
import Transfer from '../models/modelTransfer.js';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const transferirDinheiro = async (req: AuthRequest, res: Response): Promise<void> => {
    const t = await sequelize.transaction();

    try {
        const { receiverEmail, amount, description, transactionPin } = req.body;
        const senderId = req.userId;

        if (!senderId) {
            await t.rollback();
            res.status(401).json({ error: "Não autorizado." });
            return;
        }

        if (!transactionPin) {
            await t.rollback();
            res.status(400).json({ error: "Senha transacional de 4 dígitos é obrigatória para fazer Pix." });
            return;
        }

        // Descobre o id do destinatário primeiro (sem lock ainda), só pra
        // saber quem é quem antes de decidir a ordem de travamento.
        const receiverLookup = await User.findOne({ where: { email: receiverEmail }, transaction: t });
        if (!receiverLookup) {
            await t.rollback();
            res.status(404).json({ error: 'Usuário destinatário não encontrado com este e-mail.' });
            return;
        }
        const receiverId = receiverLookup.get('id') as string;

        if (senderId === receiverId) {
            await t.rollback();
            res.status(400).json({ error: 'Você não pode transferir dinheiro para si mesmo.' });
            return;
        }

        // Trava as duas linhas SEMPRE na mesma ordem (pelo id, ordenado),
        // independente de quem é sender e quem é receiver nesta transação
        // específica. Isso elimina a possibilidade de deadlock quando dois
        // Pix cruzados (A->B e B->A) acontecem ao mesmo tempo: sem essa
        // ordenação, a transação 1 travaria A e esperaria B, enquanto a
        // transação 2 travaria B e esperaria A — deadlock. Com ordenação,
        // as duas disputam o lock na mesma sequência, então uma sempre
        // espera a outra terminar, em vez de travarem uma à outra.
        const idsOrdenados = [senderId, receiverId].sort();

        const instancia1 = await User.findByPk(idsOrdenados[0], { transaction: t, lock: t.LOCK.UPDATE });
        const instancia2 = await User.findByPk(idsOrdenados[1], { transaction: t, lock: t.LOCK.UPDATE });

        if (!instancia1 || !instancia2) {
            await t.rollback();
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }

        const senderInstance = instancia1.get('id') === senderId ? instancia1 : instancia2;
        const receiverInstance = instancia1.get('id') === senderId ? instancia2 : instancia1;

        const sender = senderInstance.get({ plain: true });
        const receiver = receiverInstance.get({ plain: true });


        if (sender.lockUntil && new Date(sender.lockUntil) > new Date()) {
            await t.rollback();
            res.status(403).json({
                error: `Conta bloqueada por excesso de tentativas. Tente novamente após ${new Date(sender.lockUntil).toLocaleTimeString()}`
            });
            return;
        }


        const pinValido = await bcrypt.compare(transactionPin, sender.transactionPin);
        if (!pinValido) {
            const novosErros = (sender.pinAttempts || 0) + 1;

            if (novosErros >= 3) {

                const dataBloqueio = new Date(Date.now() + 5 * 60 * 1000);
                await User.update({ pinAttempts: 0, lockUntil: dataBloqueio }, { where: { id: sender.id }, transaction: t });

                await t.commit();
                res.status(403).json({ error: "Senha incorreta! Limite de 3 tentativas excedido. Conta bloqueada por 5 minutos. ❌" });
                return;
            } else {

                await User.update({ pinAttempts: novosErros }, { where: { id: sender.id }, transaction: t });

                await t.commit();
                res.status(401).json({ error: `Senha transacional incorreta! Você tem mais ${3 - novosErros} tentativas. ❌` });
                return;
            }
        }

        if (sender.pinAttempts > 0) {
            await User.update({ pinAttempts: 0 }, { where: { id: sender.id }, transaction: t });
        }

        if (!amount || amount <= 0) {
            await t.rollback();
            res.status(400).json({ error: 'O valor da transferência deve ser maior que zero.' });
            return;
        }

        if (Number(sender.balance) < Number(amount)) {
            await t.rollback();
            res.status(400).json({ error: 'Saldo insuficiente para realizar esta transferência.' });
            return;
        }

        const novoSaldoSender = Number(sender.balance) - Number(amount);
        const novoSaldoReceiver = Number(receiver.balance) + Number(amount);

        await User.update({ balance: novoSaldoSender }, { where: { id: sender.id }, transaction: t });
        await User.update({ balance: novoSaldoReceiver }, { where: { id: receiver.id }, transaction: t });

        const novaTransferencia = await Transfer.create({
            senderId: sender.id,
            receiverId: receiver.id,
            amount: Number(amount),
            description: description || 'Transferência realizada'
        }, { transaction: t });

        await t.commit();

        res.status(200).json({
            message: 'Pix enviado com sucesso! 💸',
            transferencia: {
                id: novaTransferencia.id,
                de: sender.name,
                para: receiver.name,
                valor: amount,
                descricao: novaTransferencia.description,
                data: novaTransferencia.createdAt
            }
        });

    } catch (error) {
        await t.rollback();
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: 'Erro interno ao processar a transferência.' });
    }
};

export const depositarDinheiro = async (req: AuthRequest, res: Response): Promise<void> => {
    // Antes, essa função não usava transaction nenhuma — um depósito e um
    // saque simultâneos na mesma conta podiam se sobrescrever (lost update).
    // Agora entra numa transaction com lock, igual às outras operações
    // financeiras, por consistência.
    const t = await sequelize.transaction();

    try {

        const userId = req.userId;
        const amount = Number(req.body.amount);

        if (!userId) {
            await t.rollback();
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        if (!amount || amount <= 0) {
            await t.rollback();
            res.status(400).json({ error: 'O valor do depósito deve ser maior que zero.' });
            return;
        }


        const userInstance = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!userInstance) {
            await t.rollback();
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }
        const user = userInstance.get({ plain: true });


        const novoSaldo = Number(user.balance) + Number(amount);


        await User.update({ balance: novoSaldo }, { where: { id: user.id }, transaction: t });

        await t.commit();

        res.status(200).json({
            message: 'Depósito realizado com sucesso!',
            saldoAtualizado: novoSaldo
        });

    } catch (error) {
        await t.rollback();
        console.error('Erro ao realizar depósito:', error);
        res.status(500).json({ error: 'Erro interno ao processar o depósito.' });
    }
};

export const obterExtrato = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        const { tipo, limite, pagina } = req.query;

        const limit = Math.min(Number(limite) || 10, 50);
        const page = Math.max(Number(pagina) || 1, 1);
        const offset = (page - 1) * limit;

        let condicaoBusca: any = {};

        if (tipo === 'envios') {
            condicaoBusca = { senderId: userId };
        } else if (tipo === 'recebidos') {
            condicaoBusca = { receiverId: userId };
        } else {
            condicaoBusca = {
                [Op.or]: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            };
        }

        const { count, rows: transferencias } = await Transfer.findAndCountAll({
            where: condicaoBusca,
            include: [
                { model: User, as: 'Sender', attributes: ['name', 'email'] },
                { model: User, as: 'Receiver', attributes: ['name', 'email'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        });

        res.status(200).json({
            message: 'Extrato carregado com sucesso! ',
            paginacao: {
                totalTransacoes: count,
                paginaAtual: page,
                totalPaginas: Math.ceil(count / limit),
                itensPorPagina: limit
            },
            transacoes: transferencias
        });

    } catch (error) {
        console.error('Erro ao obter extrato:', error);
        res.status(500).json({ error: 'Erro interno ao processar o extrato.' });
    }
};

export const sacarDinheiro = async (req: AuthRequest, res: Response): Promise<void> => {

    const t = await sequelize.transaction();

    try {
        const { amount, transactionPin } = req.body;
        const userId = req.userId;

        if (!userId) {
            await t.rollback();
            res.status(401).json({ error: "Não autorizado." });
            return;
        }


        if (!transactionPin) {
            await t.rollback();
            res.status(400).json({ error: "Senha transacional de 4 dígitos é obrigatória para realizar o saque." });
            return;
        }

        if (!amount || amount <= 0) {
            await t.rollback();
            res.status(400).json({ error: "O valor do saque deve ser maior que zero." });
            return;
        }


        const userInstance = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!userInstance) {
            await t.rollback();
            res.status(404).json({ error: "Usuário não encontrado." });
            return;
        }
        const user = userInstance.get({ plain: true });


        const pinValido = await bcrypt.compare(transactionPin, user.transactionPin);
        if (!pinValido) {
            await t.rollback();
            res.status(401).json({ error: "Senha transacional incorreta! Saque cancelado. ❌" });
            return;
        }


        if (Number(user.balance) < Number(amount)) {
            await t.rollback();
            res.status(400).json({ error: "Saldo insuficiente para realizar este saque." });
            return;
        }

        const novoSaldo = Number(user.balance) - Number(amount);
        await User.update({ balance: novoSaldo }, { where: { id: user.id }, transaction: t });


        await t.commit();

        res.status(200).json({
            message: "Saque realizado com sucesso! Retire seu dinheiro. 💵",
            saldoAtualizado: novoSaldo
        });

    } catch (error) {
        await t.rollback();
        console.error("Erro ao realizar saque:", error);
        res.status(500).json({ error: "Erro interno ao processar o saque." });
    }
};