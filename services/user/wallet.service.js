import Wallet from "../../models/user/walletModel.js";
import User from "../../models/user/userModel.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";

export const getWalletPageDataService = async (userId) => {
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ userId });
    return { user, wallet };
};

export const addMoneyToWalletService = async (userId, amount) => {
    if (!userId) return { success: false, statusCode: 401, message: "Please login again" };
    if (!amount || Number(amount) < 100) return { success: false, statusCode: 400, message: "Minimum amount is ₹100" };

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0, transactions: [] });

    wallet.balance += Number(amount);
    wallet.transactions.push({
        transactionId: "TXN" + Date.now(), type: "credit", amount: Number(amount),
        description: "Money added to wallet", date: new Date()
    });

    await wallet.save();
    return { success: true, message: "Money added successfully", balance: wallet.balance };
};

export const createWalletOrderService = async (amount) => {
    const options = { amount: Number(amount) * 100, currency: "INR", receipt: "wallet_" + Date.now() };
    const order = await razorpay.orders.create(options);
    return { success: true, order };
};

export const verifyWalletPaymentService = async (userId, data) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = data;

    const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");

    if (generatedSignature !== razorpay_signature) return { success: false, message: "Payment verification failed" };

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    wallet.balance += Number(amount);
    wallet.transactions.push({
        transactionId: razorpay_payment_id, type: "credit", amount: Number(amount), description: "Money added via Razorpay"
    });

    await wallet.save();
    return { success: true };
};

export const getReferralDataService = async (userId) => {
    let user = await User.findById(userId);
    
    if (!user.referralCode) {
        user.referralCode = "AJX" + Math.random().toString(36).substring(2, 8).toUpperCase();
        await user.save();
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId, balance: 0 });

    const referralUsers = await User.find({ referredBy: userId });
    const referralCount = referralUsers.length;
    const referralEarnings = referralCount * 200;

    return { user, wallet, referralCount, referralEarnings };
};
