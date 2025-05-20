import { Types } from 'mongoose';
import { ENUM_CONNECTION_STATUS } from './connection.enum';

export interface IConnection {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    status: (typeof ENUM_CONNECTION_STATUS)[keyof typeof ENUM_CONNECTION_STATUS];
}
