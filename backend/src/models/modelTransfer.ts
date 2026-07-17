import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js'; 
import User from './modelUser.js';


interface TransferAttributes {
    id: string;
    senderId: string;
    receiverId: string;
    amount: number;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}


interface TransferCreationAttributes extends Optional<TransferAttributes, 'id'> { }


class Transfer extends Model<TransferAttributes, TransferCreationAttributes> implements TransferAttributes {
    //  JEITO CERTO (Usando 'declare')
    declare id: string;
    declare senderId: string;
    declare receiverId: string;
    declare amount: number;
    declare description: string;
    declare createdAt: Date;
    declare updatedAt: Date;
    
    }


Transfer.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User, 
                key: 'id',
            },
        },
        receiverId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: User, 
                key: 'id',
            },
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2), 
            allowNull: false,
            validate: {
                min: 0.01, 
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Transfer',
        tableName: 'transfers', 
        timestamps: true, 
    }
);


Transfer.belongsTo(User, { as: 'Sender', foreignKey: 'senderId' });
Transfer.belongsTo(User, { as: 'Receiver', foreignKey: 'receiverId' });

export default Transfer;