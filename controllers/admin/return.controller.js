
import Return from "../../models/user/returnModel.js";

export const loadReturnManagement = async (req, res) => {
    try {
        const allReturns = await Return.find().populate("userId").populate("orderId").sort({ createdAt: -1 });
        
       
        const seenOrders = new Map();
        allReturns.forEach(r => {
            const oid = r.orderId?._id?.toString();
            if (!oid) return;
            if (!seenOrders.has(oid)) {
                seenOrders.set(oid, { ...r.toObject(), itemCount: 1 });
            } else {
                seenOrders.get(oid).itemCount += 1;
            }
        });
        const returns = Array.from(seenOrders.values());

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

        // Fetch all items that are part of this return request (same order)
        const allReturnsInOrder = await Return.find({ orderId: returnItem.orderId?._id })
            .populate("userId");

        res.render("admin/returnDetails", {
            returnItem,
            allReturnsInOrder
        });
    } catch (err) {
        console.log("ADMIN RETURN DETAILS ERROR:", err);
        res.redirect("/admin/returns");
    }
};


export const approveReturn =
async (req, res) => {

try {

    const returnId =
        req.params.id;



    const currentReturn =
    await Return.findById(returnId);

    if(!currentReturn){

        return res.status(404).json({
            success:false,
            message:"No return request"
        });

    }



    await Return.updateMany(
        {
            orderId:
            currentReturn.orderId
        },
        {
            $set:{
                status:"Approved",
                approvedAt:new Date()
            }
        }
    );



    return res.json({
        success:true
    });

} catch(err){

    console.log(err);

    res.status(500).json({
        success:false
    });

}
};


export const rejectReturn =
async (req, res) => {

try {

    const returnId =
        req.params.id;

    const { reason } =
        req.body;



    const currentReturn =
    await Return.findById(returnId);

    if(!currentReturn){

        return res.status(404).json({
            success:false
        });

    }



    await Return.updateMany(
        {
            orderId:
            currentReturn.orderId
        },
        {
            $set:{
                status:"Rejected",
                rejectionReason:reason,
                rejectedAt:new Date()
            }
        }
    );



    return res.json({
        success:true
    });

} catch(err){

    console.log(err);

    res.status(500).json({
        success:false
    });

}
};

export const schedulePickup =
async (req, res) => {

try {

    const returnId =
        req.params.id;

    const {
        pickupDate,
        pickupTime
    } = req.body;



    if(!pickupDate || !pickupTime){

        return res.status(400).json({
            success:false,
            message:
            "Pickup date and time required"
        });

    }



    const currentReturn =
    await Return.findById(returnId);

    if(!currentReturn){

        return res.status(404).json({
            success:false
        });

    }



    await Return.updateMany(
        {
            orderId:
            currentReturn.orderId
        },
        {
            $set:{
                pickupDate:
                    new Date(pickupDate),

                pickupTime,

                pickupStatus:
                    "Scheduled",

                status:
                    "Pickup Scheduled"
            }
        }
    );



    return res.json({
        success:true
    });

} catch(err){

    console.log(err);

    res.status(500).json({
        success:false
    });

}
};

export const markPickedUp =
async (req, res) => {

try {

    const returnId =
        req.params.id;



    const currentReturn =
    await Return.findById(returnId);

    if(!currentReturn){

        return res.status(404).json({
            success:false
        });

    }



    await Return.updateMany(
        {
            orderId:
            currentReturn.orderId
        },
        {
            $set:{
                pickupStatus:
                    "Picked Up",

                status:
                    "Picked Up",

                pickedUpAt:
                    new Date()
            }
        }
    );



    return res.json({
        success:true
    });

} catch(err){

    console.log(err);

    res.status(500).json({
        success:false
    });

}
};


