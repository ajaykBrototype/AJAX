document.addEventListener("DOMContentLoaded", () => {

    const modal =
        document.getElementById("addFundsModal");

    const amountInput =
        document.getElementById("walletAmountInput");

    const summaryAmount =
        document.getElementById("summaryAmount");

    const presetBtns =
        document.querySelectorAll(".preset-btn");
    window.openAddMoneyModal = function () {
        modal.classList.add("open");
        document.body.style.overflow = "hidden";
    };

    window.closeAddMoneyModal = function () {
        modal.classList.remove("open");
        document.body.style.overflow = "";
    };


    window.setPreset = function (amount) {

        amountInput.value = amount;

        presetBtns.forEach(btn => {

            if ( btn.innerText === `₹${amount}` ) {

                btn.classList.add("active");

            } else {

                btn.classList.remove("active");
            }
        });

        updateSummary();
    };

    window.updateSummary = function () {

        const val =
            amountInput.value || 0;

        summaryAmount.innerText = val;

        presetBtns.forEach(btn => {

            if (
                btn.innerText === `₹${val}`
            ) {

                btn.classList.add("active");

            } else {

                btn.classList.remove("active");
            }
        });
    };

window.initiateAddMoney =
async function () {

    const amount =
        Number(amountInput.value);



    if (!amount || amount < 100) {

        Swal.fire({

            icon: "error",

            title: "Invalid Amount",

            text:
                "Minimum amount is ₹100",

            confirmButtonColor:
                "#1C1C1C"
        });

        return;
    }



    try {

        // CREATE ORDER

        const orderResponse =
            await axios.post(

            "/wallet/create-order",

            { amount }
        );



        const order =
            orderResponse.data.order;



        const options = {

            key:
                "rzp_test_SoheRfzN69tfvZ",

            amount:
                order.amount,

            currency:
                order.currency,

            name:
                "AJAX Store",

            description:
                "Wallet Top-up",

            order_id:
                order.id,



            handler:
                async function (response) {

                try {

                    // VERIFY PAYMENT

                    const verifyResponse =
                        await axios.post(

                        "/wallet/verify-payment",

                        {

                            razorpay_order_id:
                                response.razorpay_order_id,

                            razorpay_payment_id:
                                response.razorpay_payment_id,

                            razorpay_signature:
                                response.razorpay_signature,

                            amount
                        }
                    );



                    if (
                        verifyResponse.data.success
                    ) {

                        closeAddMoneyModal();



                        Swal.fire({

                            icon: "success",

                            title:
                                "Money Added",

                            text:
                                `₹${amount} added successfully`,

                            confirmButtonColor:
                                "#1C1C1C"

                        }).then(() => {

                            window.location.reload();
                        });
                    }

                } catch (err) {

                    console.log(err);

                    Swal.fire({

                        icon: "error",

                        title:
                            "Verification Failed",

                        text:
                            "Payment verification failed"
                    });
                }
            },



            theme: {

                color: "#111827"
            }
        };



        const rzp =
            new Razorpay(options);

        rzp.open();

    } catch (err) {

        console.log(err);

        Swal.fire({

            icon: "error",

            title: "Failed",

            text:
                "Unable to initiate payment"
        });
    }
};
   

    modal.addEventListener("click", (e) => {

        if (e.target === modal) {

            closeAddMoneyModal();
        }
    });
});