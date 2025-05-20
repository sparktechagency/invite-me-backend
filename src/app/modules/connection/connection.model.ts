import { Schema, model } from 'mongoose';
import { ENUM_CONNECTION_STATUS } from './connection.enum';

const ConnectionSchema = new Schema(
    {
        sender: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'NormalUser',
        },
        receiver: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'NormalUser',
        },
        status: {
            type: String,
            enum: Object.values(ENUM_CONNECTION_STATUS),
            default: ENUM_CONNECTION_STATUS.PENDING,
        },
    },
    { timestamps: true }
);

const Connection = model('Connection', ConnectionSchema);

export default Connection;
