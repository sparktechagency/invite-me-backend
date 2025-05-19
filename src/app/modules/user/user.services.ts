/* eslint-disable no-unused-vars */

import { User } from './user.model';
import AppError from '../../error/appError';
import httpStatus from 'http-status';
import { INormalUser } from '../normalUser/normalUser.interface';
import mongoose from 'mongoose';
import { USER_ROLE } from './user.constant';
import NormalUser from '../normalUser/normalUser.model';
import cron from 'node-cron';
import { JwtPayload } from 'jsonwebtoken';
import SuperAdmin from '../superAdmin/superAdmin.model';

//TODO: ata kono todo na mojar baper hossa akana thaka jdoi aii 2 ta line remove kora dai tahola multer-s3 kaj korba nah
import dotenv from 'dotenv';
import Admin from '../admin/admin.model';
dotenv.config();

const registerUser = async (userId: string, payload: INormalUser) => {
    if (payload.checkInDate && payload.checkOutDate) {
        if (new Date(payload.checkOutDate) <= new Date(payload.checkInDate)) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                'checkOutDate must be greater than checkInDate'
            );
        }
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await NormalUser.findByIdAndUpdate(
            userId,
            { ...payload, isRegistrationCompleted: true },
            {
                new: true,
                runValidators: true,
                session,
            }
        );
        if (!result) {
            throw new AppError(
                httpStatus.SERVICE_UNAVAILABLE,
                'Failed to registartion , please try again letter'
            );
        }

        await User.findByIdAndUpdate(
            result.user,
            { isRegistrationCompleted: true },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return result;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const deleteUserAccount = async (user: JwtPayload, password: string) => {
    const userData = await User.findById(user.id);

    if (!userData) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    if (!(await User.isPasswordMatched(password, userData?.password))) {
        throw new AppError(httpStatus.FORBIDDEN, 'Password do not match');
    }

    await NormalUser.findByIdAndDelete(user.profileId);
    await User.findByIdAndDelete(user.id);

    return null;
};

const getMyProfile = async (userData: JwtPayload) => {
    let result = null;
    if (userData.role === USER_ROLE.user) {
        result = await NormalUser.findById(userData.profileId);
    } else if (userData.role === USER_ROLE.superAdmin) {
        result = await SuperAdmin.findById(userData.profileId);
    } else if (userData.role === USER_ROLE.admin) {
        result = await Admin.findById(userData.profileId);
    }
    return result;
};

// all cron jobs for users

cron.schedule('*/2 * * * *', async () => {
    try {
        const now = new Date();

        // Find unverified users whose expiration time has passed
        const expiredUsers = await User.find({
            isVerified: false,
            codeExpireIn: { $lte: now },
        });

        if (expiredUsers.length > 0) {
            const expiredUserIds = expiredUsers.map((user) => user._id);

            // Delete corresponding NormalUser documents
            const normalUserDeleteResult = await NormalUser.deleteMany({
                user: { $in: expiredUserIds },
            });

            // Delete the expired User documents
            const userDeleteResult = await User.deleteMany({
                _id: { $in: expiredUserIds },
            });

            console.log(
                `Deleted ${userDeleteResult.deletedCount} expired inactive users`
            );
            console.log(
                `Deleted ${normalUserDeleteResult.deletedCount} associated NormalUser documents`
            );
        }
    } catch (error) {
        console.log('Error deleting expired users and associated data:', error);
    }
});

const changeUserStatus = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }
    const result = await User.findByIdAndUpdate(
        id,
        { isBlocked: !user.isBlocked },
        { new: true, runValidators: true }
    );
    return result;
};

const userServices = {
    registerUser,
    getMyProfile,
    changeUserStatus,
    deleteUserAccount,
};

export default userServices;
