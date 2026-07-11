import "dotenv/config"
import express from 'express';
import sequelize, { conectarDatabase } from "./config/database.js"
import ModelUser from "./models/modelUser.js";
import Transfer from "./models/modelTransfer.js";
import cors from 'cors'
import routerAuth from "./router/authRoutes.js";
import transferRouter from "./router/transferRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());


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
        });
    } catch (error) {
        console.error("❌ Falha crítica ao iniciar o sistema:", error);
    }
}

iniciarSistema()