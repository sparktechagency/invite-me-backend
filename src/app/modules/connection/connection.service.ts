import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Connection from './connection.model';
import { ENUM_CONNECTION_STATUS } from './connection.enum';
import QueryBuilder from '../../builder/QueryBuilder';
type AcceptRejectStatus =
    | typeof ENUM_CONNECTION_STATUS.ACCEPTED
    | typeof ENUM_CONNECTION_STATUS.REJECTED;
const connectionAddRemove = async (profileId: string, id: string) => {
    const connection = await Connection.findOne({
        $or: [
            { sender: profileId, receiver: id },
            { sender: id, receiver: profileId },
        ],
    });

    if (!connection) {
        const result = await Connection.create({
            sender: profileId,
            receiver: id,
        });
        return {
            result,
            message: 'Connection request sent successfully',
        };
    }
    if (connection.sender.equals(profileId)) {
        const result = await Connection.findOneAndDelete({
            sender: profileId,
            receiver: id,
        });
        return {
            result,
            message:
                connection.status == ENUM_CONNECTION_STATUS.PENDING
                    ? 'Connection request withdraw successfully'
                    : 'Connection removed successfully',
        };
    } else {
        if (connection.status == ENUM_CONNECTION_STATUS.PENDING) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "You can't able to add or remove connection with this people because the user already sent you connection request , you should accept or reject"
            );
        } else if (connection.status == ENUM_CONNECTION_STATUS.ACCEPTED) {
            const result = await Connection.findOneAndDelete({
                sender: id,
                receiver: profileId,
            });
            return {
                result,
                message: 'Connection removed successfully',
            };
        }
    }
};

const acceptRejectConnectionRequest = async (
    profileId: string,
    id: string,
    status: AcceptRejectStatus
) => {
    const connection = await Connection.findOne({
        _id: id,
        receiver: profileId,
        status: ENUM_CONNECTION_STATUS.PENDING,
    });

    if (!connection) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            'No pending connection request found from this user.'
        );
    }

    if (status === ENUM_CONNECTION_STATUS.ACCEPTED) {
        connection.status = ENUM_CONNECTION_STATUS.ACCEPTED;
        await connection.save();
        return {
            result: connection,
            message: 'Connection request accepted successfully.',
        };
    } else if (status === ENUM_CONNECTION_STATUS.REJECTED) {
        await Connection.findByIdAndDelete(connection._id);
        return {
            message: 'Connection request rejected',
        };
    } else {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid status provided. Use ACCEPTED or REJECTED.'
        );
    }
};

const getAllConnectionRequest = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const connectionQuery = new QueryBuilder(
        Connection.find({
            status: ENUM_CONNECTION_STATUS.PENDING,
            receiver: profileId,
        }).populate({ path: 'sender', select: 'name profile_image' }),
        query
    )
        .search(['sender.name'])
        .fields()
        .filter()
        .paginate()
        .sort();
    const result = await connectionQuery.modelQuery;
    const meta = await connectionQuery.countTotal();

    return {
        meta,
        result,
    };
};

const ConnectionServices = {
    connectionAddRemove,
    acceptRejectConnectionRequest,
    getAllConnectionRequest,
};
export default ConnectionServices;
