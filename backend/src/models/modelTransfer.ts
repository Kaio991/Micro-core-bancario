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
    public id!: string;
    public senderId!: string;
    public receiverId!: string;
    public amount!: number;
    public description!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
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