import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { INormalUser } from './normalUser.interface';
import NormalUser from './normalUser.model';
import QueryBuilder from '../../builder/QueryBuilder';
import mongoose from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLE } from '../user/user.constant';

const updateUserProfile = async (id: string, payload: Partial<INormalUser>) => {
    if (payload.email) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You can not change the email'
        );
    }
    const user = await NormalUser.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
    }

    if (payload.newPictures) {
        payload.pictures = [...user.pictures, ...payload.newPictures];
    } else {
        payload.pictures = [...user.pictures];
    }
    if (payload?.deletedPictures) {
        payload.pictures = payload.pictures.filter(
            (url) => !payload?.deletedPictures?.includes(url)
        );
    }

    const result = await NormalUser.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

const getAllUser = async (
    userData: JwtPayload,
    query: Record<string, unknown>
) => {
    if (
        userData.role == USER_ROLE.superAdmin ||
        userData.role == USER_ROLE.admin
    ) {
        const userQuery = new QueryBuilder(
            NormalUser.find({ isRegistrationCompleted: true })
                .select(
                    'name user email address checkInDate checkOutDate gender'
                )
                .populate({
                    path: 'user',
                    select: 'isBlocked',
                }),
            query
        )
            .search(['name'])
            .fields()
            .filter()
            .paginate()
            .sort();

        const result = await userQuery.modelQuery;
        const meta = await userQuery.countTotal();
        return {
            meta,
            result,
        };
    } else {
        return null;
    }
};

// get single user
const getSingleUser = async (id: string) => {
    const result = await NormalUser.findById(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    return result;
};

// send connection request
const connectionAddRemove = async (ownId: string, id: string) => {
    const profileId = new mongoose.Types.ObjectId(ownId);
    const user = await NormalUser.findById(id);
    if (user?.connections.includes(profileId)) {
        await NormalUser.findByIdAndUpdate(id, {
            $pull: { connections: profileId },
        });
        return 2;
    } else if (user?.connectionRequests?.includes(profileId)) {
        await NormalUser.findByIdAndUpdate(id, {
            $pull: { connectionRequests: profileId },
        });
        return 3;
    } else {
        await NormalUser.findByIdAndUpdate(id, {
            $addToSet: { connectionRequest: profileId },
        });
        return 1;
    }
};
// accept reject
const acceptRejectConnectionRequest = async (
    ownId: string,
    id: string,
    status: string
) => {
    const profileId = new mongoose.Types.ObjectId(ownId);
    const userId = new mongoose.Types.ObjectId(id);
    const me = await NormalUser.findById(profileId);
    if (!me?.connectionRequests.includes(userId)) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'This user is not in your connetion request list'
        );
    }
    if (status == 'accept') {
        const result = await NormalUser.findByIdAndUpdate(profileId, {
            $addToSet: { connections: userId },
        });
        await NormalUser.findByIdAndUpdate(profileId, {
            $pull: { connectionRequest: userId },
        });
        return result;
    } else if (status == 'reject') {
        const result = await NormalUser.findByIdAndUpdate(profileId, {
            $pull: { connectionRequest: userId },
        });
        return result;
    } else {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'You need to pass accept or reject in status'
        );
    }
};

const blockUnblockUser = async (ownId: string, id: string) => {
    const profileId = new mongoose.Types.ObjectId(ownId);
    const userId = new mongoose.Types.ObjectId(id);
    const me = await NormalUser.findById(profileId);
    if (!me) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'Your profile not found , plase try to login again'
        );
    }
    if (!me.blockedUsers.includes(userId)) {
        await NormalUser.findByIdAndUpdate(profileId, {
            $addToSet: { blockedUsers: userId },
        });
        return 1;
    } else {
        await NormalUser.findByIdAndUpdate(profileId, {
            $pull: { blockedUsers: userId },
        });
        return 0;
    }
};

const NormalUserServices = {
    updateUserProfile,
    getAllUser,
    getSingleUser,
    connectionAddRemove,
    acceptRejectConnectionRequest,
    blockUnblockUser,
};

export default NormalUserServices;
