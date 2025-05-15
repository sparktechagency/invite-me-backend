/* eslint-disable @typescript-eslint/no-explicit-any */

import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';
import AppError from '../../error/appError';
import httpStatus from 'http-status';
import { IAdmin } from './admin.interface';
import Admin from './admin.model';
import mongoose from 'mongoose';
import { TUser } from '../user/user.interface';
import { USER_ROLE } from '../user/user.constant';

// register Admin
const createAdmin = async (payload: IAdmin & { password: string }) => {
    const { password, ...adminData } = payload;
    const admin = await User.findOne({ email: payload.email });
    if (admin) {
        throw new AppError(httpStatus.BAD_REQUEST, 'This admin already exists');
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userData: Partial<TUser> = {
            email: payload?.email,
            password: password,
            role: USER_ROLE.admin,
            isActive: true,
            isVerified: true,
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const user = await User.create([userData], { session });

        const adminPayload = {
            ...adminData,
            user: user[0]._id,
        };
        const admin = await Admin.create([adminPayload], { session });

        await session.commitTransaction();
        session.endSession();

        return admin[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

const updateAdminProfile = async (userId: string, payload: Partial<IAdmin>) => {
    const result = await Admin.findOneAndUpdate({ user: userId }, payload, {
        new: true,
        runValidators: true,
    });
    return result;
};

const deleteAdminFromDB = async (id: string) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const admin = await Admin.findById(id).session(session);
        if (!admin) {
            throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');
        }

        // Delete associated User and Admin within the transaction
        await User.findByIdAndDelete(admin.user).session(session);
        await Admin.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        return null;
    } catch (error) {
        await session.abortTransaction();
        throw error; // re-throw the error for further handling
    } finally {
        session.endSession();
    }
};

// update Admin status
const updateAdminStatus = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Admin not found');
    }

    const result = await User.findByIdAndUpdate(
        id,
        { isActive: !user.isActive },
        { new: true, runValidators: true }
    );
    return result;
};

// get all Admin

const getAllAdminFromDB = async (query: Record<string, any>) => {
    const AdminQuery = new QueryBuilder(
        Admin.find().populate('user', 'isBlocked isActive'),
        query
    )
        .search(['storeName'])
        .fields()
        .filter()
        .paginate()
        .sort();
    const meta = await AdminQuery.countTotal();
    const result = await AdminQuery.modelQuery;

    return {
        meta,
        result,
    };
};

const AdminServices = {
    createAdmin,
    updateAdminProfile,
    updateAdminStatus,
    getAllAdminFromDB,
    deleteAdminFromDB,
};

export default AdminServices;
