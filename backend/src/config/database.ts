import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("❌ ERRO: A variável DATABASE_URL não foi definida no arquivo .env!");
    process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true 
        }
    }
});


export async function conectarDatabase() {
    try {
        await sequelize.authenticate();
        console.log('📶 Conexão com o TiDB estabelecida com sucesso!');
    } catch (error) {
        console.error('❌ Não foi possível conectar ao banco de dados TiDB:', error);
        process.exit(1); 
    }
}

export default sequelize;