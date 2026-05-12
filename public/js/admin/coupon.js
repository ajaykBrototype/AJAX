function showError(id,message){
    const error=document.getElementById(id);
    error.textContent=message;
    error.classList.remove("hideen");
}

function clearError(){
    const error=document.querySelectorAll("[id$='Error']");\
    errors.array.forEach(error => {
        error.textContent="";
        error.classList.add("hidden");
    });
}

async function createCoupon(){

         const code = document.getElementById("code").value.trim();

        const discountType =document.getElementById("discountType").value;

        const discountAmount =document.getElementById("discountAmount").value;

        const minOrder =document.getElementById("minOrder").value;

        const maxDiscount =document.getElementById("maxDiscount").value;

        const maxUsage =document.getElementById("maxUsage").value;

        const userLimit =document.getElementById("userLimit").value;

        const startDate =document.getElementById("startDate").value;

        const endDate =document.getElementById("endDate").value;

         const status =document.getElementById("status").checked ? "active":"inactive";


          if (!code) {

        showError(
            "codeError",
            "Coupon code is required"
        );

        hasError = true;
    }

    else if (code.length < 4) {

        showError(
            "codeError",
            "Minimum 4 characters required"
        );

        hasError = true;
    }

     if (!discountAmount || discountAmount <= 0) {

        showError(
            "discountAmountError",
            "Enter valid discount amount"
        );

        hasError = true;
    }
     if (
        discountType === "percentage" &&
        discountAmount > 100
    ) {

        showError(
            "discountAmountError",
            "Percentage cannot exceed 100"
        );

        hasError = true;
    }

     if (!minOrder || minOrder <= 0) {

        showError(
            "minOrderError",
            "Enter valid minimum order"
        );

        hasError = true;
    }
     if (maxDiscount && maxDiscount < 0) {

        showError(
            "maxDiscountError",
            "Invalid max discount"
        );

        hasError = true;
    }
     if (maxUsage && maxUsage <= 0) {

        showError(
            "maxUsageError",
            "Usage limit must be greater than 0"
        );

        hasError = true;
    }
    if (userLimit && userLimit <= 0) {

        showError(
            "userLimitError",
            "Invalid user limit"
        );

        hasError = true;
    }

     if (!startDate || !endDate) {

        showError(
            "dateError",
            "Select start and end dates"
        );

        hasError = true;
    }

    else if (
        new Date(endDate) <
        new Date(startDate)
    ) {

        showError(
            "dateError",
            "End date must be after start date"
        );

        hasError = true;
    }

      if (hasError) return;

      try{

        const response=await axios.post(
            "/admin/coupons/create",
            {
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
        });
        if (response.data.success) {

            window.location.reload();
        }

    }catch(err){
               if (error.response?.data?.message) {

            showError(
                "codeError",
                error.response.data.message
            );
        }

    }
}