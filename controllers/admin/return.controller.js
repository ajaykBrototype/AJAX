import Return from "../../models/user/returnModel.js";

export const loadReturnManagement = async (req, res) => {
    try {
        const returns = await Return.find().populate("userId").populate("orderId").sort({ createdAt: -1 });

        const totalReturns = await Return.countDocuments();
        const pendingReturns = await Return.countDocuments({ status: "Requested" });
        const approvedReturns = await Return.countDocuments({ status: "Approved" });
        const rejectedReturns = await Return.countDocuments({ status: "Rejected" });

        res.render("admin/returnManagement", { 
            returns,
            totalReturns,
            pendingReturns,
            approvedReturns,
            rejectedReturns
        });
    } catch (err) {
        console.log("ADMIN RETURN MANAGEMENT ERROR:", err);
        res.redirect("/admin/orders");
    }
};

export const loadReturnDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const returnItem = await Return.findById(id)
            .populate("userId")
            .populate({
                path: "orderId",
                populate: { path: "userId" }
            });

        if (!returnItem) {
            return res.redirect("/admin/returns");
        }

        res.render("admin/returnDetails", {
            returnItem
        });
    } catch (err) {
        console.log("ADMIN RETURN DETAILS ERROR:", err);
        res.redirect("/admin/returns");
    }
};