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
    address: string;
    interests: string[];
    language: string[];
    pictures: string[];
    checkInDate: Date;
    checkOutDate: Date;
    isRegistrationCompleted: boolean;
    bio: string;
    newPictures: string[];
    deletedPictures: string[];
    // connections: [Types.ObjectId];
    // connectionRequests: [Types.ObjectId];
    blockedUsers: [Types.ObjectId];
    hotel: Types.ObjectId;
}
