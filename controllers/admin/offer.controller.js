import Offer from "../../models/admin/offerModel.js";
import Product from "../../models/admin/productModel.js";
import Category from "../../models/admin/categoryModel.js";

export const loadOffers=async (req,res)=>{
   try{
       const offers=await Offer.find().populate("targetProduct").populate("targetCategory").sort({createdAt:-1});
       const products = await Product.find({ isActive: true });
       const categories = await Category.find({ isActive: true });

       res.render("admin/offers",{
        offers,
        products,
        categories
       });
   }catch(err){
        console.log(err);
        res.redirect("/admin/pageerror");
   }
}

export const loadCreateOffer=async (req,res)=>{
       try {

        const products = await Product.find({
            isActive: true
        });

        const categories = await Category.find({
            isActive: true
        });

        res.render("admin/create-offer", {
            products,
            categories
        });

    } catch (error) {

        console.log(error);
        res.redirect("/admin/pageerror");
    }
};

export const createOffer = async (req, res) => {

    try {

        const {
            offerLabel,
            applicableTo,
            targetProduct,
            targetCategory,
            discountMode,
            discountValue,
            maxDiscountCap,
            minOrderValue,
            startDate,
            endDate
        } = req.body;


        if (!offerLabel?.trim()) {

            return res.status(400).json({
                success: false,
                message: "Offer label required"
            });
        }

        if (discountValue <= 0) {

            return res.status(400).json({
                success: false,
                message: "Invalid discount"
            });
        }
        if (!startDate || !endDate) {

    return res.status(400).json({

        success: false,

        message: "Please select dates"
    });
}

        if (new Date(startDate) > new Date(endDate)) {

            return res.status(400).json({
                success: false,
                message: "Invalid dates"
            });
        }

        const newOffer = new Offer({

            offerLabel,
            applicableTo,
            targetProduct:
                applicableTo === "product"
                    ? targetProduct
                    : null,

            targetCategory:
                applicableTo === "category"
                    ? targetCategory
                    : null,

            discountMode,
            discountValue,
            maxDiscountCap,
            minOrderValue,
            startDate,
            endDate
        });

        await newOffer.save();

        res.status(200).json({
            success: true,
            message: "Offer created successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};