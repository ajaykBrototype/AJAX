
const reasonSelect = document.getElementById("returnReason");
const conditionSelect = document.getElementById("itemCondition");
const commentBox = document.getElementById("returnComment");

const reasonError = document.getElementById("reasonError");
const conditionError = document.getElementById("conditionError");
const commentError = document.getElementById("commentError");

const charCount = document.getElementById("charCount");


const imageInput =document.getElementById("returnImages");
const uploadZone =document.getElementById("uploadZone");
const previewContainer =document.getElementById("previewContainer");
const imageError =document.getElementById("imageError");

const submitBtn = document.getElementById("submitReturnBtn");
const submitBtnText = document.getElementById("submitBtnText");
const submitBtnIcon = document.getElementById("submitBtnIcon");

commentBox.addEventListener("input",()=>{
    charCount.innerText=commentBox.value.length;

    if(commentBox.value.trim().length>=20){
        commentError.classList.add("hidden");
    }
});

function validateReason(){
    if(!reasonSelect.value){
        reasonError.classList.remove("hidden");

         reasonSelect.classList.add(
            "ring-1",
            "ring-red-400"
        );

        return false;
    }
     reasonError.classList.add("hidden");

    reasonSelect.classList.remove(
        "ring-1",
        "ring-red-400"
    );

    return true;
}


function validateCondition() {

    if (!conditionSelect.value) {

        conditionError.classList.remove("hidden");

        conditionSelect.classList.add(
            "ring-1",
            "ring-red-400"
        );

        return false;
    }

    conditionError.classList.add("hidden");

    conditionSelect.classList.remove(
        "ring-1",
        "ring-red-400"
    );

    return true;
}

function validateComment() {

    const comment = commentBox.value.trim();

    if (comment.length < 20) {

        commentError.innerText =
            "Comment must be at least 20 characters";

        commentError.classList.remove("hidden");

        commentBox.classList.add(
            "ring-1",
            "ring-red-400"
        );

        return false;
    }

    if (comment.length > 500) {

        commentError.innerText =
            "Maximum 500 characters allowed";

        commentError.classList.remove("hidden");

        return false;
    }

    commentError.classList.add("hidden");

    commentBox.classList.remove(
        "ring-1",
        "ring-red-400"
    );

    return true;
}


async function submitReturnRequest() {

    const isReasonValid = validateReason();
    const isConditionValid = validateCondition();
    const isCommentValid = validateComment();

    if (
        !isReasonValid ||
        !isConditionValid ||
        !isCommentValid
    ) {
        return;
    }

     submitBtn.disabled = true;

    submitBtn.classList.add(
        "opacity-70",
        "cursor-not-allowed"
    );

    submitBtnText.innerText =
        "Submitting Request...";

    submitBtnIcon.innerHTML = `
       <svg class="animate-spin"
     xmlns="http://www.w3.org/2000/svg"
     fill="none"
     viewBox="0 0 24 24">

  <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4">
  </circle>

  <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
  </path>

</svg>
`;

   try {

    const formData = new FormData();

    formData.append("orderId", orderId);
    formData.append("itemId", itemId);

    formData.append(
        "reason",
        reasonSelect.value
    );

    formData.append(
        "condition",
        conditionSelect.value
    );

    formData.append(
        "comment",
        commentBox.value.trim()
    );


    uploadedFiles.forEach(file => {

        formData.append(
            "images",
            file
        );

    });



    const res = await axios.post(
        "/return-request",
        formData,
        {
            headers: {
                "Content-Type":
                    "multipart/form-data"
            }
        }
    );



    setTimeout(() => {

        Swal.fire({
            icon: "success",
            title: "Return Request Submitted",
            text: "We’ll notify you once approved.",
            confirmButtonColor: "#1C1C1C"
        }).then(() => {

            window.location.href = "/orders";

        });

    }, 1200);

} catch (err) {

    console.log(err);

    Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text:
            err.response?.data?.message ||
            "Please try again."
    });

    submitBtn.disabled = false;

    submitBtn.classList.remove(
        "opacity-70",
        "cursor-not-allowed"
    );

    submitBtnText.innerText =
        "Submit Full Return";

    submitBtnIcon.innerHTML = `
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    `;
}
}

    reasonSelect.addEventListener(
    "change",
    validateReason
);

conditionSelect.addEventListener(
    "change",
    validateCondition
);

commentBox.addEventListener(
    "blur",
    validateComment
);





let uploadedFiles=[];

uploadZone.addEventListener("click",()=>{
    imageInput.click();
});

imageInput.addEventListener("change",(e) => {
        handleFiles(e.target.files);
    }
);

uploadZone.addEventListener("dragover",(e)=>{
    e.preventDefault();
    uploadZone.classList.add("drag-active");
});

uploadZone.addEventListener("dragleave", () => {

    uploadZone.classList.remove("drag-active");

});
uploadZone.addEventListener("drop", (e) => {

    e.preventDefault();

    uploadZone.classList.remove("drag-active");

    handleFiles(e.dataTransfer.files);

});

function handleFiles(files){
    const allowTypes=[
        "image/jpeg",
        "image/png",
        "image/webp"
    ];
     imageError.classList.add("hidden");

     for(const file of files){
        if(uploadedFiles.length >= 5){
             showImageError(
                "Maximum 5 images allowed"
            );

            break;
        }

        if(!allowTypes.includes(file.type)){
               showImageError(
                "Only JPG, PNG, WEBP allowed"
            );

            continue;
        }

         if (file.size > 5 * 1024 * 1024) {

            showImageError(
                `${file.name} exceeds 5MB`
            );

            continue;
        }
        
        const alreadyExists = uploadedFiles.some(
            existing =>
                existing.name === file.name &&
                existing.size === file.size
        );

        if (alreadyExists) {

            showImageError(
                `${file.name} already added`
            );

            continue;
        }



        uploadedFiles.push(file);

    }



    renderImagePreviews();


}


function showImageError(message) {

    imageError.innerText = message;

    imageError.classList.remove("hidden");

}


function renderImagePreviews() {

    previewContainer.innerHTML = "";



    uploadedFiles.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = (e) => {

            const previewCard =
                document.createElement("div");

            previewCard.className =
                "preview-card";



            previewCard.innerHTML = `
                <img src="${e.target.result}" />

                <button
                    type="button"
                    class="remove-image-btn"
                    onclick="removeImage(${index})"
                >
                    ×
                </button>
            `;

            previewContainer.appendChild(
                previewCard
            );

        };

        reader.readAsDataURL(file);

    });

}



function removeImage(index) {

    uploadedFiles.splice(index, 1);

    renderImagePreviews();

}


