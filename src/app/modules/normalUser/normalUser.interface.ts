/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import { ENUM_GENDER } from '../user/user.enum';

export interface INormalUser {
    user: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    profile_image: string;
    gender: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
    dateOfBirth: Date;
    country: string;
}
