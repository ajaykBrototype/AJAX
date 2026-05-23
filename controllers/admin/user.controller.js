import * as userService from "../../services/admin/user.service.js";

export const getAllUsers = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
        const status = req.query.status || "all";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const data = await userService.getAllUsersService(searchQuery, status, page, limit);

        res.render("admin/users", data);
    } catch (err) {
        console.error("Controller Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const toggleBlockUser = async (req, res) => {
    try {
        const result = await userService.toggleBlockUserService(req.params.id);
        if (!result.success) return res.status(result.statusCode).json(result);
        res.status(200).json(result);
    } catch (err) {
         res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
