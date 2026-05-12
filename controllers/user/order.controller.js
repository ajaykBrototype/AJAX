import Order from "../../models/user/orderModel.js";
import Cart from "../../models/user/cartModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";
import User from "../../models/user/userModel.js";
import Variant from "../../models/admin/variantModel.js";
import Return from "../../models/user/returnModel.js";
import { success } from "zod";

export const loadOrderPage = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        res.render("user/orderSuccess", { order });

    } catch (err) {

        console.log("ORDER PAGE ERROR:", err);
        res.redirect("/home");

    }
};

export const loadOrdersList = async (req, res) => {

    try {

        const userId = req.session.userId;

        const user = await User.findById(userId);

        const search = req.query.search || "";

        const sort = req.query.sort || "all";

        let filter = {
            userId
        };

        const now = new Date();

    if (sort === "30days") {

    const last30Days = new Date();

    last30Days.setDate(
        now.getDate() - 30
    );

    filter.createdAt = {
        $gte: last30Days
    };

}


     if (sort === "6months") {

    const last6Months = new Date();

    last6Months.setMonth(
        now.getMonth() - 6
    );

    filter.createdAt = {
        $gte: last6Months
    };

}


if (sort === "2025") {

    filter.createdAt = {
        $gte: new Date("2025-01-01"),
        $lte: new Date("2025-12-31")
    };

}

        if (search) {

            filter["items.name"] = {
                $regex: search,
                $options: "i"
            };

        }

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 });

        res.render("user/orders", {
            user,
            orders,
            activePage: "orders"
        });

    } catch (err) {

        console.log("LOAD ORDERS ERROR:", err);

        res.redirect("/menProductList");

    }
};

export const loadOrderDetails = async (req, res) => {
    try {

        const orderId = req.params.id;
        const userId = req.session.userId;

        const user = await User.findById(userId);

        const order = await Order.findOne({
            _id: orderId,
            userId
        });

        if (!order) {
            return res.redirect("/orders");
        }

        const returns = await Return.find({ orderId: order._id });
        
        res.render("user/orderDetails", {
            user,
            order,
            returns
        });

    } catch (err) {

        console.log("LOAD ORDER DETAILS ERROR:", err);
        res.redirect("/orders");

    }
};


export const placeOrder = async (req, res) => {

    try {

        const userId = new mongoose.Types.ObjectId(req.session.userId);

        const { addressId, paymentMethod } = req.body;

        const normalizedPayment = paymentMethod.toUpperCase();

        if (!addressId) {
            return res.json({
                success: false,
                message: "No address selected"
            });
        }

        if (!paymentMethod) {
            return res.json({
                success: false,
                message: "Payment method required"
            });
        }

        const cart = await Cart.findOne({ user: userId }).populate({
            path: "items.variant",
            populate: {
                path: "productId"
            }
        });

        if (!cart || cart.items.length === 0) {
            return res.json({
                success: false,
                message: "Cart is empty"
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            userId
        });

        if (!address) {
            return res.json({
                success: false,
                message: "Invalid address"
            });
        }

        const orderItems = [];

        for (const item of cart.items) {

            if (!item.variant || !item.variant.productId) {
                throw new Error("Invalid cart item");
            }

            if (item.variant.stock < item.quantity) {
                throw new Error(
                    `${item.variant.productId.name} is out of stock`
                );
            }

            item.variant.stock -= item.quantity;

            await item.variant.save();

            orderItems.push({
                productId: item.variant.productId._id,
                variantId: item.variant._id,
                name: item.variant.productId.name,
                price: item.variant.price,
                quantity: item.quantity,
                size: item.variant.size,
                image: item.variant.images[0],
                status: "Placed"
            });

        }

        let total = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        const shipping = total > 1000 ? 0 : 100;

        total += shipping;

        const order = await Order.create({

            userId,

            items: orderItems,

            address: {
                name: address.name,
                phone: address.phone,
                street: address.street,
                area: address.area,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country
            },

            paymentMethod: normalizedPayment,

            totalAmount: total,

            status: "Placed",

            statusHistory: [
                {
                    status: "Placed",
                    updatedAt: new Date()
                }
            ]

        });

        cart.items = [];

        await cart.save();

        res.json({
            success: true,
            orderId: order._id
        });

    } catch (err) {

        console.log("ORDER ERROR FULL:", err);

        res.json({
            success: false,
            message: err.message
        });

    }
};

export const cancelOrderItem=async(req,res)=>{

     try {
    const {orderId,itemId}=req.params;
    const {reason, note} = req.body;

    const userId=req.session.userId;

const order = await Order.findOne({
    _id: orderId,
     userId
});

if (!order) {

    return res.status(404).json({
        success: false,
        message: "Order not found"
    });

}

const item = order.items.find(
    item => item._id.toString() === itemId
);

if (!item) {

    return res.status(404).json({
        success: false,
        message: "Item not found"
    });

}

    if(item.status==="Cancelled"){
        return res.status(400).json({
            success:false,
            message:"Item already cancelled"
    })
}

   if (
   order.status === "Delivered" ||
   order.status === "Cancelled"
) {

   return res.status(400).json({
      success: false,
      message: "Cannot cancel this order"
   });

}

   const variant=await Variant.findById(item.variantId);

     if(variant){
        variant.stock+=item.quantity;

        await variant.save();
     }

     item.status="Cancelled";
     item.cancellationReason = reason;
     item.cancellationNote = note;
     order.markModified('items');

     const activeItems=order.items.filter(
        item=>item.status!=="Cancelled"
     )

     let newTotal=activeItems.reduce((sum,item)=>
      sum+(item.price*item.quantity),0
    );

    const shipping=newTotal>1000 || newTotal===0?0:100;

    order.totalAmount = newTotal + shipping;

     

     const allCancelled=order.items.every(
        item=>item.status==="Cancelled"
     )

     if(allCancelled){
        order.status="Cancelled"
        order.cancellationReason = reason;
        order.cancellationNote = note;

        order.statusHistory.push({
            status:"Cancelled",
            updatedAt:new Date(),
            reason,
            note
        });
     }
     
     await order.save();
         res.json({
         success: true

         })
}catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};


export const loadReturnRequest = async (req, res) => {
    try {
        const orderId = req.params.id;
        const itemId = req.query.itemId; 
        const userId = req.session.userId;

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) return res.redirect("/orders");

        res.render("user/returnRequest", { order, itemId });
    } catch (err) {
        console.log("LOAD RETURN REQUEST ERROR:", err);
        res.redirect("/orders");
    }
};


export const submitReturnRequest = async (req, res) => {

    try {

        const userId = req.session.userId;

        const {
            orderId,
            itemId,
            reason,
            condition,
            comment
        } = req.body;


        if (
            !orderId ||
            !reason ||
            !condition ||
            !comment
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }



        if (
            comment.trim().length < 20
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Comment must be at least 20 characters"
            });

        }

        const order = await Order.findOne({
            _id: orderId,
            userId
        });

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found"
            });

        }

        if (order.status !== "Delivered") {

            return res.status(400).json({
                success: false,
                message:
                    "Only delivered orders can be returned"
            });

        }


        let itemsToReturn = [];


        if (itemId) {

            const item = order.items.find(
                item =>
                    item._id.toString() === itemId
            );

            if (!item) {

                return res.status(404).json({
                    success: false,
                    message: "Item not found"
                });

            }

            itemsToReturn.push(item);

        }


        else {

            itemsToReturn = order.items.filter(
                item =>
                    item.status !== "Cancelled"
            );

        }

        const images = req.files
            ? req.files.map(
                file =>
                    `/uploads/${file.filename}`
              )
            : [];


        let createdCount = 0;



        for (const item of itemsToReturn) {

            if (
                item.status === "Cancelled"
            ) {
                continue;
            }



            const existingReturn =
            await Return.findOne({
                itemId: item._id
            });

            if (existingReturn) {
                continue;
            }



            await Return.create({

                orderId,

                itemId: item._id,

                userId,

                reason,

                condition,

                comment,

                images,

                refundAmount:
                    item.price * item.quantity

            });




            item.status =
                "Return Requested";



            createdCount++;

        }


        if (createdCount === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "Return already requested"
            });

        }


        order.markModified("items");

        await order.save();



        return res.status(200).json({
            success: true,
            message:
                "Return request submitted successfully"
        });



    } catch (err) {

        console.log(
            "RETURN REQUEST ERROR:",
            err
        );

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};