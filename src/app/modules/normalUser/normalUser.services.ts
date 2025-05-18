import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { INormalUser } from './normalUser.interface';
import NormalUser from './normalUser.model';
import QueryBuilder from '../../builder/QueryBuilder';

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

const getAllUser = async (query: Record<string, unknown>) => {
    const userQuery = new QueryBuilder(
        NormalUser.find().select(
            'profile_image name dateOfBirth interests address'
        ),
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
};

// get single user
const getSingleUser = async (id: string) => {
    const result = await NormalUser.findById(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    return result;
};

const NormalUserServices = {
    updateUserProfile,
    getAllUser,
    getSingleUser,
};

export default NormalUserServices;
