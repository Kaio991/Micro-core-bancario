import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class ModelUser extends Model {
    //  JEITO CERTO (Usando 'declare')
    declare id: string;
    declare name: string;
    declare email: string;
    declare password?: string; 
    declare transactionPi: string;
    declare balance: number;
    declare pinAttempts: number;
    declare lockUntil: Date | null;
    declare createdAt: Date;
    declare updatedAt: Date;
}



ModelUser.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        balance: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        transactionPin: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pinAttempts: {
            type: DataTypes.INTEGER,
            defaultValue: 0, 
        },
        lockUntil: {
            type: DataTypes.DATE,
            allowNull: true, 
        }
    },
    {
        sequelize,
        tableName: 'users',
    }
);

export default ModelUser;