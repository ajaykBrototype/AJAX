import Coupon from "../../models/admin/couponModel.js";

export const loadCouponPage = async (req, res) => {
    try {
       const search=req.query.search || "";
      
       const page=parseInt(req.query.page)||1;
       const limit=5
       const skip=(page-1)*limit;

       const filter={
        code:{$regex:search,$options:"i"}
    };

    const coupons=await Coupon.find(filter).sort({createdAt:-1}).skip(skip).limit(limit);

    const totalCoupons=await Coupon.countDocuments(filter);
    const totalPage=Math.ceil(totalCoupons/limit);


        res.render("admin/coupons", {
            coupons,
            currentPath: "/admin/coupons",
            totalPage,
            currentPage: page,
            search
        });
    } catch (error) {
        console.error("Error loading coupon page:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const createCoupon=async (req,res)=>{
    try{
      const {
            code,
            discountType,
            discountAmount,
            minOrder,
            maxDiscount,
            maxUsage,
            userLimit,
            startDate,
            endDate,
            status
        } = req.body;

        const existingCoupon=await Coupon.find({code:code.toUpperCase()})
          if (existingCoupon) {
               return res.status(400).json({
                success: false,
                message: "Coupon already exists"
            });
        }

        if(new Date(endDate)<new Date(startDate)){
           return res.status(400).json({
                success: false,
                message: "End date must be after start date"
            });
        }
         if (discountType === "percentage" && discountAmount > 100) {
            return res.status(400).json({
                success: false,
                message: "Percentage cannot exceed 100"
            });
        }

        const newCoupon=new Coupon({
             code: code.toUpperCase(),

            discountType,

            discountAmount,

            minOrder,

            maxDiscount,

            maxUsage,

            userLimit,

            startDate,

            endDate,

            status: status || "active"

        });

        await newCoupon.save();
         res.status(201).json({
            success: true,
            message: "Coupon created successfully"
        });


    }catch(err){
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}


export const toggleCouponStatus =async(req,res)=>{
    try{
        const {id}=req.params;

        const coupon=await Coupon.find(id);

        if(!coupon){
            res.staus(404).json({
                success:false
            });
        }
        coupon.status=coupon.status==="active"?"inactive":"active";

        await coupon.save();

         res.json({
            success: true,
            status: coupon.status
        });
    }catch(err){
        console.log(error);

        res.status(500).json({
            success: false
    })
}
}

export const deleteCoupon = async (req, res) => {

    try {

        const { id } = req.params;

        await Coupon.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Coupon deleted successfully"
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });
    }
};