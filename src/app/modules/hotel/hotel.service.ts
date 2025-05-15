import Hotel from './hotel.model';
import { IHotel } from './hotel.interface';
import QueryBuilder from '../../builder/QueryBuilder';
import AppError from '../../error/appError';
import httpStatus from 'http-status';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';

const createHotel = async (payload: IHotel): Promise<IHotel> => {
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
