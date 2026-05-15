let editingCouponId = null;



function showError(id, message) {

    const error = document.getElementById(id);

    error.textContent = message;

    error.classList.remove("hidden");
}



function clearErrors() {

    const errors =
        document.querySelectorAll("[id$='Error']");

    errors.forEach(error => {

        error.textContent = "";

        error.classList.add("hidden");
    });
}



async function createCoupon() {

    let hasError = false;

    clearErrors();



    const code =
        document.getElementById("code").value.trim();

    const discountType =
        document.getElementById("discountType").value;

    const discountAmount =
        document.getElementById("discountAmount").value;

    const minOrder =
        document.getElementById("minOrder").value;

    const maxDiscount =
        document.getElementById("maxDiscount").value;

    const maxUsage =
        document.getElementById("maxUsage").value;

    const userLimit =
        document.getElementById("userLimit").value;

    const startDate =
        document.getElementById("startDate").value;

    const endDate =
        document.getElementById("endDate").value;

    const status =
        document.getElementById("status").checked
            ? "active"
            : "inactive";
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
        Number(discountAmount) > 100
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
            "Enter valid minimum order amount"
        );

        hasError = true;
    }


    if (
        maxDiscount &&
        Number(maxDiscount) <= 0
    ) {

        showError(
            "maxDiscountError",
            "Invalid max cap"
        );

        hasError = true;
    }
    if (

        maxDiscount &&

        Number(maxDiscount) >= Number(minOrder)

    ) {

        showError(
            "maxDiscountError",
            "Max cap must be less than minimum order"
        );

        hasError = true;
    }

     if (

    userLimit &&
    maxUsage &&
    Number(userLimit) > Number(maxUsage)

) {

    showError(
        "userLimitError",
        "User limit cannot exceed max usage"
    );

    hasError = true;
}

    if (
        maxUsage &&
        Number(maxUsage) <= 0
    ) {

        showError(
            "maxUsageError",
            "Usage limit must be greater than 0"
        );

        hasError = true;
    }

    if (
        userLimit &&
        Number(userLimit) <= 0
    ) {

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



    try {
        let response;
        const couponData = {
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
        };

        if (editingCouponId) {
            response = await axios.put(
                `/admin/coupons/update/${editingCouponId}`,
                couponData
            );
        } else {
            response = await axios.post(
                "/admin/coupons/create",
                couponData
            );
        }

        if (response.data.success) {
            editingCouponId = null;
            if (typeof closeCouponModal === 'function') closeCouponModal();
            ajaxToast('success', response.data.message || 'Action completed successfully');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (err) {
        if (err.response?.data?.message) {
            showError(
                "codeError",
                err.response.data.message
            );
            ajaxToast('error', err.response.data.message);
        }
        console.log(err);
    }
}

async function deleteCoupon(id) {
    try {
        const result = await ajaxConfirm({
            title: "Delete Coupon?",
            text: "Are you sure you want to remove this coupon?",
            confirmText: "DELETE",
            icon: "warning"
        });

        if (!result.isConfirmed) return;

        const response = await axios.delete(
            `/admin/coupons/delete/${id}`
        );

        if (response.data.success) {
            ajaxToast('success', 'Coupon deleted successfully');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (err) {
        ajaxToast('error', 'Failed to delete coupon');
        console.log(err);
    }
}

async function toggleCouponStatus(id) {
    try {
        const response = await axios.patch(
            `/admin/coupons/toggle/${id}`
        );

        if (response.data.success) {
            ajaxToast('success', response.data.message || 'Status updated');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (err) {
        ajaxToast('error', 'Failed to update status');
        console.log(err);
    }
}



async function openEditCoupon(id) {

    try {

        editingCouponId = id;



        const response = await axios.get(

            `/admin/coupons/get-coupon/${id}`
        );



        const coupon = response.data.coupon;



        document.getElementById("code").value =
            coupon.code || "";

        document.getElementById("discountType").value =
            coupon.discountType || "flat";

        document.getElementById("discountAmount").value =
            coupon.discountAmount || "";

        document.getElementById("minOrder").value =
            coupon.minOrder || "";

        document.getElementById("maxDiscount").value =
            coupon.maxDiscount || "";

        document.getElementById("maxUsage").value =
            coupon.maxUsage || "";

        document.getElementById("userLimit").value =
            coupon.userLimit || "";

        document.getElementById("startDate").value =
            coupon.startDate
                ? coupon.startDate.split("T")[0]
                : "";

        document.getElementById("endDate").value =
            coupon.endDate
                ? coupon.endDate.split("T")[0]
                : "";

        document.getElementById("status").checked =
            coupon.status === "active";



        openCouponModal();

    } catch (err) {

        console.log(err);
    }
}