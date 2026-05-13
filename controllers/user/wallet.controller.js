import Wallet from "../../models/user/walletModel.js";
import User from "../../models/user/userModel.js";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";


export const loadWalletPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        const wallet = await Wallet.findOne({
            userId
        });
        res.render("user/wallet", {
            user,
            wallet
        });

    } catch (err) {

        console.log(err);

        res.redirect("/pageNotFound");
    }
};

export const addMoneyToWallet = async (req, res) => {

    try {

        const { amount } = req.body;

        const userId = req.session.userId;

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Please login again"
            });
        }

        if (!amount || Number(amount) < 100) {

            return res.status(400).json({

                success: false,

                message:
                    "Minimum amount is ₹100"
            });
        }

        let wallet = await Wallet.findOne({
            userId
        });


        if (!wallet) {
            wallet = await Wallet.create({
                userId,
                balance: 0,
                transactions: []
            });
        }


        wallet.balance += Number(amount);
        wallet.transactions.push({

            transactionId:
                "TXN" + Date.now(),

            type: "credit",

            amount: Number(amount),

            description:
                "Money added to wallet",

            date: new Date()
        });

        await wallet.save();

        return res.status(200).json({

            success: true,
            message:"Money added successfully",
            balance: wallet.balance
        });

    } catch (err) {

        console.log("WALLET ERROR:", err);



        return res.status(500).json({

            success: false,

            message:
                "Internal Server Error"
        });
    }
};




export const createWalletOrder = async (req, res) => {

    try {

        const { amount } = req.body;

        const options = {

            amount: Number(amount) * 100,

            currency: "INR",

            receipt: "wallet_" + Date.now()
        };



        const order =
            await razorpay.orders.create(options);



        res.json({

            success: true,

            order
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false
        });
    }
};

export const verifyWalletPayment = async (req, res) => {

    try {

        const {

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature,

            amount

        } = req.body;



        const generatedSignature =
            crypto
            .createHmac(

                "sha256",

                process.env.RAZORPAY_KEY_SECRET
            )

            .update(

                razorpay_order_id +
                "|" +
                razorpay_payment_id
            )

            .digest("hex");



        if (
            generatedSignature !==
            razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment verification failed"
            });
        }



        const userId =
            req.session.userId;



        let wallet =
            await Wallet.findOne({

            userId
        });



        if (!wallet) {

            wallet =
                await Wallet.create({

                userId
            });
        }



        wallet.balance += Number(amount);



        wallet.transactions.push({

            transactionId:
                razorpay_payment_id,

            type: "credit",

            amount: Number(amount),

            description:
                "Money added via Razorpay"
        });



        await wallet.save();



        res.json({

            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false
        });
    }
};