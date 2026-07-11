import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

export class ModelUser extends Model {
    public id!: string;
    public name!: string;
    public email!: string;
    public password!: string;
    public balance!: number;
    public transactionPi!: string;
    public pinAttempts!:number;
    public lockUntil!: Date
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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