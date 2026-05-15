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