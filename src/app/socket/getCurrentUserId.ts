import Admin from '../modules/admin/admin.model';
import SuperAdmin from '../modules/superAdmin/superAdmin.model';
import { USER_ROLE } from '../modules/user/user.constant';
import { User } from '../modules/user/user.model';

export const getCurrentUserId = async (userId: string, role: string) => {
    let id;
    if (role == USER_ROLE.admin) {
        const user = await Admin.findOne({ user: userId }).select('_id');
        id = user?._id;
    } else if (role == USER_ROLE.superAdmin) {
        const user = await SuperAdmin.findOne({ user: userId }).select('_id');
        id = user?._id;
    } else if (role == USER_ROLE.user) {
        const user = await User.findOne({ user: userId }).select('_id');
        id = user?._id;
    }
    return id;
};
