/* eslint-disable @typescript-eslint/no-explicit-any */
import Hotel from './hotel.model';
import { IHotel } from './hotel.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import httpStatus from 'http-status';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { isValidIpv4Cidr, isWifiFriendlyCidr } from '../../utilities/net.util';

// const isValidCIDR = (cidr: string): boolean => {
//     const parts = cidr.split('/');
//     if (parts.length !== 2) return false;

//     const [ip, prefix] = parts;

//     // Check IP format
//     const ipParts = ip.split('.');
//     if (ipParts.length !== 4) return false;

//     for (const part of ipParts) {
//         const num = Number(part);
//         if (isNaN(num) || num < 0 || num > 255) return false;
//     }

//     // Check prefix length
//     const prefixNum = Number(prefix);
//     if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) return false;

//     return true;
// };

const createHotel = async (payload: IHotel): Promise<IHotel> => {
    // if (!isValidCIDR(payload.wifiIp)) {
    //     throw new AppError(
    //         httpStatus.UNAVAILABLE_FOR_LEGAL_REASONS,
    //         'Invalid CIDR format'
    //     );
    // }
    if (!isValidIpv4Cidr(payload.wifiIp)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid CIDR (IPv4) notation. Use e.g. "192.168.10.0/24".'
        );
    }
    if (!isWifiFriendlyCidr(payload.wifiIp)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'CIDR must be a private (RFC1918) or CGNAT (100.64.0.0/10) range.'
        );
    }
    return await Hotel.create(payload);
};

const getAllHotels = async (query: Record<string, unknown> = {}) => {
    const resultQuery = new QueryBuilder(Hotel.find(), query)
        .search(['name'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();
    return {
        meta,
        result,
    };
};

const getSingleHotel = async (id: string) => {
    const result = await Hotel.findById(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    return result;
};

const deleteHotel = async (id: string): Promise<IHotel | null> => {
    return await Hotel.findByIdAndDelete(id);
};

const updateHotel = async (
    id: string,
    payload: Partial<IHotel>
): Promise<IHotel | null> => {
    const hotel = await Hotel.findById(id);
    if (!hotel) {
        throw new AppError(httpStatus.NOT_FOUND, 'Hotel not found');
    }
    const result = await Hotel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.hotel_image && hotel.hotel_image) {
        deleteFileFromS3(hotel.hotel_image);
    }

    return result;
};

const HotelService = {
    createHotel,
    getAllHotels,
    getSingleHotel,
    deleteHotel,
    updateHotel,
};

export default HotelService;
