import User from "../../models/user/userModel.js";

export const getAllUsersService = async (searchQuery, status, page, limit) => {
    const skip = (page - 1) * limit;
    let filter = {};

    if (searchQuery) {
        filter = {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } }
            ]
        };
    }

    if (status === "blocked") {
        filter.isBlocked = true;
    } else if (status === "active") {
        filter.isBlocked = false;
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    return { users, searchQuery, status, currentPage: page, totalPages, totalUsers };
};

export const toggleBlockUserService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return { success: false, statusCode: 404, message: "User not found" };

    user.isBlocked = !user.isBlocked;
    await user.save();

    return { 
        success: true, 
        statusCode: 200, 
        message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`, 
        isBlocked: user.isBlocked 
    };
};
