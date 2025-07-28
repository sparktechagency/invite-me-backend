import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { Block } from './block.model';

const blockUnblockUser = async (profileId: string, userId: string) => {
    const isMeBlocked = await Block.findOne({
        blocked: profileId,
        blocker: userId,
    });
    if (!isMeBlocked) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "You can't block that user , becuase this user already blocked you"
        );
    }
    const isBlocked = await Block.findOne({
        blocker: profileId,
        blocked: userId,
    });
    if (isBlocked) {
        const result = await Block.findByIdAndDelete(isBlocked._id);
        return { result, message: 'User unblocked successfully' };
    }
    const result = await Block.create({ blocker: profileId, blocked: userId });
    return { result, message: 'User is blocked' };
};

const BlockServices = {
    blockUnblockUser,
};

export default BlockServices;
