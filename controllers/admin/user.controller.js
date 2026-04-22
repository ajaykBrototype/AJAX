import User from "../../models/user/userModel.js";
export const getAllUsers = async (req, res) => {
    try {
        const searchQuery = req.query.search || "";
         const status = req.query.status || "all";
         
        const page=parseInt(req.query.page) ||1;
        const limit=5;
        const skip=(page-1)*limit;
        
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
        const totalUsers=await User.countDocuments(filter);
        const totalPages=Math.ceil(totalUsers/limit);
        res.render("admin/users", { 
            users, 
            searchQuery,
            status,
            currentPage:page,
            totalPages,
            totalUsers
        });

    } catch (err) {
        console.error("Controller Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export const toggleBlockUser=async(req,res)=>{
    try{
        const userId = req.params.id;
       const user=await User.findById(userId);

       if(!user){
        return res.status(404).json({
            success:false,
            message:"User not found"
        })
    }

        user.isBlocked=!user.isBlocked;
        await user.save();

        res.status(200).json({
            success:true,
            message:`User ${user.isBlocked?"blocked":"unblocked"} successfully`,
            isBlocked:user.isBlocked
        })
    }catch(err){
         res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}



