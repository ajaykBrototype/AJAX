import Order from "../../models/user/orderModel.js";
import Cart from "../../models/user/cartModel.js";
import Wallet from "../../models/user/walletModel.js";
import Address from "../../models/user/addressModel.js";
import mongoose from "mongoose";
import User from "../../models/user/userModel.js";
import Variant from "../../models/admin/variantModel.js";
import Return from "../../models/user/returnModel.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import Coupon from "../../models/admin/couponModel.js";

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

export const loadPaymentFailure = async (req, res) => {
    try {
        const orderId = req.query.orderId;
        const message = req.query.message;
        const order = await Order.findById(orderId);

        res.render("user/paymentFailure", { order, message });

    } catch (err) {
        console.log("PAYMENT FAILURE PAGE ERROR:", err);
        res.redirect("/checkout");
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

        const { addressId, paymentMethod, couponCode } = req.body;

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

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        let discount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            const today = new Date();
            appliedCoupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                status: "active",
                startDate: { $lte: today },
                endDate: { $gte: today }
            });

            if (appliedCoupon && subtotal >= appliedCoupon.minOrder) {
                if (appliedCoupon.discountType === "flat") {
                    discount = appliedCoupon.discountAmount;
                } else {
                    discount = (subtotal * appliedCoupon.discountAmount) / 100;
                    if (appliedCoupon.maxDiscount > 0 && discount > appliedCoupon.maxDiscount) {
                        discount = appliedCoupon.maxDiscount;
                    }
                }
                
                // Check usage limits (treat 0 or null as unlimited)
                const globalLimitMet = !appliedCoupon.maxUsage || appliedCoupon.usageCount < appliedCoupon.maxUsage;
                
                const userUsage = await Order.countDocuments({
                    userId,
                    couponCode: appliedCoupon.code,
                    status: { $ne: "Cancelled" }
                });
                const userLimitMet = !appliedCoupon.userLimit || userUsage < appliedCoupon.userLimit;

                if (globalLimitMet && userLimitMet) {
                    appliedCoupon.usageCount += 1;
                    await appliedCoupon.save();
                } else {
                    discount = 0; // Usage limit reached
                    appliedCoupon = null;
                }
            }
        }

        const shipping = subtotal > 1000 ? 0 : 100;
        const total = subtotal + shipping - discount;

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
            discount: discount,
            couponCode: appliedCoupon ? appliedCoupon.code : null,
            status: normalizedPayment === "RAZORPAY" ? "Pending" : "Placed",
            statusHistory: [
                {
                    status: normalizedPayment === "RAZORPAY" ? "Pending" : "Placed",
                    updatedAt: new Date()
                }
            ]
        });

        if (normalizedPayment === "WALLET") {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < total) {
                throw new Error("Insufficient wallet balance");
            }
            wallet.balance -= total;
            wallet.transactions.push({
                transactionId: "PAY" + Date.now(),
                orderId: order._id,
                type: "debit",
                amount: total,
                description: "Payment for Order #" + order._id.toString().slice(-6),
                date: new Date()
            });
            await wallet.save();
        }

        if (normalizedPayment === "RAZORPAY") {
            const options = {
                amount: Math.round(total * 100),
                currency: "INR",
                receipt: "order_" + order._id.toString()
            };

            const rzpOrder = await razorpay.orders.create(options);

            return res.json({
                success: true,
                razorpayOrder: rzpOrder,
                orderId: order._id
            });
        }

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

export const verifyOrderPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        } = req.body;

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.json({
                success: false,
                message: "Order not found"
            });
        }

        order.status = "Placed";
        order.paymentStatus = "Paid"; // Adding a payment status if helpful
        await order.save();

        const userId = req.session.userId;
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json({
            success: true
        });

    } catch (err) {
        console.log("VERIFY PAYMENT ERROR:", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
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

   if (item.refunded) {

    return res.status(400).json({
        success: false,
        message: "Refund already processed"
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

if (order.paymentMethod !== "COD") {

    const refundAmount =item.price * item.quantity;



    let wallet =await Wallet.findOne({
        userId
    });



    if (!wallet) {

        wallet =await Wallet.create({
            userId,
            balance: 0,
            transactions: []
        });
    }



    wallet.balance += refundAmount;



    wallet.transactions.push({

        transactionId:"REF" + Date.now(),

        orderId: order._id,
        type: "credit",
        amount: refundAmount,
        description:"Refund for cancelled order",

        date: new Date()
    });

    item.refunded = true;

    await wallet.save();
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