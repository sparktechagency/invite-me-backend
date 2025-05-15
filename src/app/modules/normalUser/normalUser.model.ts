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
        email: {
            type: String,
            required: true,
            unique: true,
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
        country: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
const NormalUser = model<INormalUser>('NormalUser', NormalUserSchema);

export default NormalUser;
