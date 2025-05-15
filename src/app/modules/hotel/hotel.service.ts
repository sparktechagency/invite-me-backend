import httpStatus from "http-status";
import AppError from "../../error/appError";
import { IHotel } from "./hotel.interface";
import hotelModel from "./hotel.model";

const updateUserProfile = async (id: string, payload: Partial<IHotel>) => {
    if (payload.email || payload.username) {
        throw new AppError(httpStatus.BAD_REQUEST, "You cannot change the email or username");
    }
    const user = await hotelModel.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }
    return await hotelModel.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
};

const HotelServices = { updateUserProfile };
export default HotelServices;