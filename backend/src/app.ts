import "dotenv/config"
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sequelize, { conectarDatabase } from "./config/database.js"
import ModelUser from "./models/modelUser.js";
import Transfer from "./models/modelTransfer.js";
import routerAuth from "./router/authRoutes.js";
import transferRouter from "./router/transferRoutes.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Necessário porque em produção (Railway) a API roda atrás de um proxy
// reverso. Sem isso, req.ip sempre retorna o IP do proxy, não do cliente
// real — o rate limiter trataria todo mundo como o mesmo "usuário".
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Headers de segurança HTTP padrão (X-Content-Type-Options, HSTS,
// desativa cache de respostas sensíveis, etc.). Não interfere em nada
// do funcionamento normal da API, só adiciona proteção.
app.use(helmet());

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origem "${origin}" não permitida pelo CORS.`));
        }
    },
    credentials: true
}));

app.use(express.json());

app.use(globalLimiter);

app.use(routerAuth)
app.use(transferRouter)

async function iniciarSistema() {
    try {

        await conectarDatabase();

        await sequelize.sync()
        console.log("📦 Tabelas sincronizadas com o TiDB!");

        await Transfer.sync();
        console.log("💸 Tabela de transferências criada/sincronizada com sucesso!");

        app.listen(PORT, () => {
            console.log(`🚀 Servidor voando baixo na porta ${PORT}`);
            console.log(`🔒 CORS liberado para: ${allowedOrigins.join(', ')}`);
        });
    } catch (error) {
        console.error("❌ Falha crítica ao iniciar o sistema:", error);
    }
}

iniciarSistema()