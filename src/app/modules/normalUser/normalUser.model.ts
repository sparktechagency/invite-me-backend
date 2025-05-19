import { model, Schema } from 'mongoose';
import { INormalUser } from './normalUser.interface';
import { ENUM_GENDER } from '../user/user.enum';

const NormalUserSchema = new Schema<INormalUser>(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
        },
        email: {
            type: String,
            // required: true,
            // unique: true,
            default: '',
        },
        phone: {
            type: String,
        },
        profile_image: {
            type: String,
            default: '',
        },
        gender: {
            type: String,
            enum: Object.values(ENUM_GENDER),
        },
        dateOfBirth: {
            type: Date,
        },
        address: {
            type: String,
        },
        interests: {
            type: [String],
        },
        pictures: {
            type: [String],
        },
        language: {
            type: [String],
        },
        checkInDate: {
            type: Date,
        },
        checkOutDate: {
            type: Date,
        },
        connections: {
            type: [Schema.Types.ObjectId],
            ref: 'Normal User',
            default: [],
        },
        connectionRequests: {
            type: [Schema.Types.ObjectId],
            ref: 'Normal User',
            default: [],
        },
    },
    {
        timestamps: true,
    }
);
const NormalUser = model<INormalUser>('NormalUser', NormalUserSchema);

export default NormalUser;
