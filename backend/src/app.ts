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

// Necessário porque em produção a API roda atrás de um proxy reverso
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Headers de segurança HTTP padrão
app.use(helmet());

// Configuração otimizada do CORS para permitir requisições de qualquer front-end (como a Vercel)
app.use(cors({
    origin: true, // Reflete a origem da requisição automaticamente
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Libera explicitamente as requisições de pré-voo (preflight OPTIONS)
//app.options('*', cors());

app.use(express.json());

app.use(globalLimiter);

app.use(routerAuth);
app.use(transferRouter);

async function iniciarSistema() {
    try {
        await conectarDatabase();

        await sequelize.sync();
        console.log("📦 Tabelas sincronizadas com o TiDB!");

        await Transfer.sync();
        console.log("💸 Tabela de transferências criada/sincronizada com sucesso!");

        app.listen(PORT, () => {
            console.log(`🚀 Servidor voando baixo na porta ${PORT}`);
            console.log(`🔒 CORS liberado para conexões externas.`);
        });
    } catch (error) {
        console.error("❌ Falha crítica ao iniciar o sistema:", error);
    }
}

iniciarSistema();