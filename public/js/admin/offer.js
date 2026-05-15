const form =
    document.getElementById(
        "createOfferForm"
    );

form.addEventListener(
    "submit",
    async (e) => {

    e.preventDefault();

    const offerLabel =
        document.getElementById(
            "offerLabel"
        );

    const targetSelect =
        document.getElementById(
            "targetSelect"
        );

    const discountValue =
        document.querySelector(
            '[name="discountValue"]'
        );

    const maxDiscountCap =
        document.querySelector(
            '[name="maxDiscountCap"]'
        );

    const minOrderValue =
        document.querySelector(
            '[name="minOrderValue"]'
        );

    const startDate =
        document.getElementById(
            "startDate"
        );

    const endDate =
        document.getElementById(
            "endDate"
        );

    const discountMode =
        document.getElementById(
            "discountMode"
        ).value;

    let isValid = true;

    // CLEAR OLD ERRORS
    [
        offerLabel,
        targetSelect,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate
    ].forEach(clearError);

    // OFFER LABEL
    if (
        !offerLabel.value.trim()
    ) {

        showError(
            offerLabel,
            "Offer label required"
        );

        isValid = false;
    }

    // TARGET
    if (
        !targetSelect.value
    ) {

        showError(
            targetSelect,
            "Please select target"
        );

        isValid = false;
    }

    // DISCOUNT
    const discount =
        Number(
            discountValue.value
        );

    if (
        !discount ||
        discount <= 0
    ) {

        showError(
            discountValue,
            "Invalid discount amount"
        );

        isValid = false;
    }

    // PERCENTAGE LIMIT
    if (
        discountMode ===
        "percentage"
        &&
        discount > 90
    ) {

        showError(
            discountValue,
            "Maximum allowed is 90%"
        );

        isValid = false;
    }

    // MAX CAP
    if (
        maxDiscountCap.value &&
        Number(
            maxDiscountCap.value
        ) < 0
    ) {

        showError(
            maxDiscountCap,
            "Invalid max cap"
        );

        isValid = false;
    }

    // MIN ORDER
    if (
        minOrderValue.value &&
        Number(
            minOrderValue.value
        ) < 0
    ) {

        showError(
            minOrderValue,
            "Invalid minimum order"
        );

        isValid = false;
    }

    // DATES REQUIRED
    if (!startDate.value) {

        showError(
            startDate,
            "Start date required"
        );

        isValid = false;
    }

    if (!endDate.value) {

        showError(
            endDate,
            "End date required"
        );

        isValid = false;
    }

    // DATE VALIDATION
    if (
        startDate.value &&
        endDate.value &&
        new Date(
            startDate.value
        )
        >
        new Date(
            endDate.value
        )
    ) {

        showError(
            endDate,
            "End date must be after start date"
        );

        isValid = false;
    }

    if (!isValid) return;

    // BUTTON LOADER
    const submitBtn =
        form.querySelector(
            'button[type="submit"]'
        );

    const originalBtn =
        submitBtn.innerHTML;

    submitBtn.disabled = true;

    submitBtn.innerHTML =
        "Creating Offer...";

    try {

        const formData =
            new FormData(form);

        const data =
            Object.fromEntries(
                formData.entries()
            );

        const response =
            await axios.post(
                "/admin/offers/create",
                data
            );

        if (
            response.data.success
        ) {

            ajaxToast(
                "success",
                "Offer created successfully"
            );

            form.reset();

            closeCreateOfferModal();

            setTimeout(() => {

                window.location.reload();

            }, 1200);
        }

    } catch (error) {

        console.log(error);

        const message =
            error?.response?.data?.message
            ||
            "Something went wrong";

        ajaxToast(
            "error",
            message
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            originalBtn;
    }
});


// SHOW ERROR
function showError(
    input,
    message
) {

    input.classList.add(
        "input-error"
    );

    const errorText =
        input.parentElement
        .querySelector(
            ".error-text"
        )
        ||
        input.parentElement
        .parentElement
        .querySelector(
            ".error-text"
        );

    if (errorText) {

        errorText.textContent =
            message;

        errorText.classList.remove(
            "hidden"
        );
    }
}


// CLEAR ERROR
function clearError(input) {

    input.classList.remove(
        "input-error"
    );

    const errorText =
        input.parentElement
        .querySelector(
            ".error-text"
        )
        ||
        input.parentElement
        .parentElement
        .querySelector(
            ".error-text"
        );

    if (errorText) {

        errorText.textContent = "";

        errorText.classList.add(
            "hidden"
        );
    }
}


// LIVE VALIDATION
document
.querySelectorAll(
    ".input-field"
)
.forEach(input => {

    input.addEventListener(
        "input",
        () => {

        clearError(input);
    });
});





// OPEN EDIT MODAL
function openEditOfferModal(offer) {

    const modal =
        document.getElementById(
            "editOfferModal"
        );

    modal.style.display = "flex";

    setTimeout(() => {

        modal.classList.add(
            "show"
        );

    }, 10);

    // OFFER ID
    document.getElementById(
        "editOfferId"
    ).value = offer._id;

    // LABEL
    document.getElementById(
        "editOfferLabel"
    ).value = offer.offerLabel;

    // DISCOUNT MODE
    document.getElementById(
        "editDiscountMode"
    ).value = offer.discountMode;

    // TOGGLE ACTIVE
    const toggleItems =
        document.querySelectorAll(
            "#editDiscountModeToggle .toggle-item"
        );

    toggleItems.forEach(item => {

        item.classList.remove(
            "active"
        );

        if (
            item.dataset.value ===
            offer.discountMode
        ) {

            item.classList.add(
                "active"
            );
        }
    });

    // UNIT
    document.getElementById(
        "editDiscountUnit"
    ).textContent =
        offer.discountMode === "percentage"
        ? "%"
        : "₹";

    // DISCOUNT VALUE
    document.querySelector(
        '#editOfferForm [name="discountValue"]'
    ).value =
        offer.discountValue;

    // MAX CAP
    document.querySelector(
        '#editOfferForm [name="maxDiscountCap"]'
    ).value =
        offer.maxDiscountCap || "";

    // MIN ORDER
    document.querySelector(
        '#editOfferForm [name="minOrderValue"]'
    ).value =
        offer.minOrderValue || "";

    // DATES
    document.getElementById(
        "editStartDate"
    ).value =
        offer.startDate.split("T")[0];

    document.getElementById(
        "editEndDate"
    ).value =
        offer.endDate.split("T")[0];
}



// CLOSE EDIT MODAL
function closeEditOfferModal() {

    const modal =
        document.getElementById(
            "editOfferModal"
        );

    modal.classList.remove(
        "show"
    );

    setTimeout(() => {

        modal.style.display =
            "none";

    }, 300);
}



// EDIT TOGGLE
setupToggle(
    "editDiscountModeToggle",
    "editDiscountMode",
    (value) => {

    const unit =
        document.getElementById(
            "editDiscountUnit"
        );

    unit.textContent =
        value === "percentage"
        ? "%"
        : "₹";
});




document
.getElementById(
    "editOfferForm"
)
.addEventListener(
    "submit",
    async (e) => {

    e.preventDefault();

    const offerLabel =
        document.getElementById(
            "editOfferLabel"
        );

    const discountValue =
        document.querySelector(
            '#editOfferForm [name="discountValue"]'
        );

    const maxDiscountCap =
        document.querySelector(
            '#editOfferForm [name="maxDiscountCap"]'
        );

    const minOrderValue =
        document.querySelector(
            '#editOfferForm [name="minOrderValue"]'
        );

    const startDate =
        document.getElementById(
            "editStartDate"
        );

    const endDate =
        document.getElementById(
            "editEndDate"
        );

    const discountMode =
        document.getElementById(
            "editDiscountMode"
        ).value;

    let isValid = true;

    [
        offerLabel,
        discountValue,
        maxDiscountCap,
        minOrderValue,
        startDate,
        endDate
    ].forEach(clearError);

    // LABEL
    if (
        !offerLabel.value.trim()
    ) {

        showError(
            offerLabel,
            "Offer label required"
        );

        isValid = false;
    }

    const discount =
        Number(
            discountValue.value
        );

    if (
        !discount ||
        discount <= 0
    ) {

        showError(
            discountValue,
            "Invalid discount amount"
        );

        isValid = false;
    }


    if (
        discountMode ===
        "percentage"
        &&
        discount > 90
    ) {

        showError(
            discountValue,
            "Maximum allowed is 90%"
        );

        isValid = false;
    }

    if (
        maxDiscountCap.value &&
        Number(
            maxDiscountCap.value
        ) < 0
    ) {

        showError(
            maxDiscountCap,
            "Invalid max cap"
        );

        isValid = false;
    }

    if (
        minOrderValue.value &&
        Number(
            minOrderValue.value
        ) < 0
    ) {

        showError(
            minOrderValue,
            "Invalid minimum order"
        );

        isValid = false;
    }

    // START DATE
    if (!startDate.value) {

        showError(
            startDate,
            "Start date required"
        );

        isValid = false;
    }

    // END DATE
    if (!endDate.value) {

        showError(
            endDate,
            "End date required"
        );

        isValid = false;
    }

   
    if (
        startDate.value &&
        endDate.value &&
        new Date(startDate.value)
        >
        new Date(endDate.value)
    ) {

        showError(
            endDate,
            "End date must be after start date"
        );

        isValid = false;
    }

    if (!isValid) return;

    const submitBtn =
        e.target.querySelector(
            'button[type="submit"]'
        );

    const originalBtn =
        submitBtn.innerHTML;

    submitBtn.disabled = true;

    submitBtn.innerHTML =
        "Updating Offer...";

    try {

        const formData =
            new FormData(e.target);

        const data =
            Object.fromEntries(
                formData.entries()
            );

        const response =
            await axios.put(
                "/admin/offers/update",
                data
            );

        if (
            response.data.success
        ) {

            ajaxToast(
                "success",
                "Offer updated successfully"
            );

            closeEditOfferModal();

            setTimeout(() => {

                window.location.reload();

            }, 1200);
        }

    } catch (error) {

        ajaxToast(
            "error",
            error?.response?.data?.message
            ||
            "Something went wrong"
        );

    } finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            originalBtn;
    }
});




async function deleteOffer(id) {

    try {

        const response =
            await axios.patch(
                `/admin/offers/delete/${id}`
            );

        if (
            response.data.success
        ) {

            ajaxToast(
                "success",
                "Offer deleted successfully"
            );

            setTimeout(() => {

                window.location.reload();

            }, 1200);
        }

    } catch (error) {

        ajaxToast(
            "error",
            "Something went wrong"
        );
    }
}


async function toggleOfferStatus(id) {

    try {

        const response =
            await axios.patch(
                `/admin/offers/toggle-status/${id}`
            );

        if (
            response.data.success
        ) {

            ajaxToast(
                "success",
                response.data.message
            );

           setTimeout(()=>{
             window.location.reload();
           },2000)
        }

    } catch (error) {

        ajaxToast(
            "error",
            "Something went wrong"
        );
    }
}