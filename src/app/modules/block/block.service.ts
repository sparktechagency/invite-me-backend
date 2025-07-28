import { Block } from './block.model';

const blockUnblockUser = async (profileId: string, userId: string) => {
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
