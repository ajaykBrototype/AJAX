

document.addEventListener("DOMContentLoaded", () => {

    const writeReviewBtn = document.getElementById("writeReviewBtn");

    const reviewModal = document.getElementById("reviewModal");

    const modalCloseBtn = document.getElementById("modalCloseBtn");

    const ratingStars = document.querySelectorAll(".modal-star");

    const reviewTitle = document.getElementById("reviewTitle");

    const reviewBody = document.getElementById("reviewBody");

    const charCounterValue = document.getElementById("charCounterValue");

    const charHint = document.getElementById("charHint");

    const uploadZone = document.getElementById("uploadZone");

    const mediaInput = document.getElementById("mediaInput");

    const mediaPreviews = document.getElementById("mediaPreviews");

    const submitReviewBtn = document.getElementById("submitReviewBtn");

    const reviewForm = document.getElementById("reviewForm");



    let selectedRating = 0;

    let selectedImages = [];





    // OPEN MODAL

    writeReviewBtn?.addEventListener("click", openModal);

    modalCloseBtn?.addEventListener("click", closeModal);





    // CLOSE BACKDROP

    reviewModal.addEventListener("click", (e) => {

        if (e.target === reviewModal) {

            closeModal();

        }

    });





    // ESC CLOSE

    document.addEventListener("keydown", (e) => {

        if (

            e.key === "Escape" &&

            reviewModal.classList.contains("active")

        ) {

            closeModal();

        }

    });





    function openModal() {

        reviewModal.classList.add("active");

        document.body.style.overflow = "hidden";



        if (typeof gsap !== "undefined") {

            gsap.fromTo(

                ".review-modal-card",

                {

                    y: 50,

                    opacity: 0,

                    scale: 0.9

                },

                {

                    y: 0,

                    opacity: 1,

                    scale: 1,

                    duration: 0.5,

                    ease: "power4.out"

                }

            );

        }

    }





    function closeModal() {

        if (typeof gsap !== "undefined") {

            gsap.to(".review-modal-card", {

                y: 30,

                opacity: 0,

                scale: 0.95,

                duration: 0.3,

                ease: "power2.in",

                onComplete: () => {

                    reviewModal.classList.remove("active");

                    document.body.style.overflow = "";

                    resetForm();

                }

            });

        } else {

            reviewModal.classList.remove("active");

            document.body.style.overflow = "";

            resetForm();

        }

    }





    function resetForm() {

        selectedRating = 0;

        selectedImages = [];



        reviewForm.reset();



        updateStars(0);

        updateCharCount();

        renderPreviews();

        updateSubmitState();

    }





    // STARS

    ratingStars.forEach(star => {

        star.addEventListener("mouseenter", () => {

            const index = parseInt(star.dataset.index);

            highlightStars(index);

        });



        star.addEventListener("mouseleave", () => {

            highlightStars(selectedRating);

        });



        star.addEventListener("click", () => {

            selectedRating = parseInt(star.dataset.index);

            updateStars(selectedRating);

            updateSubmitState();

        });

    });





    function highlightStars(count) {

        ratingStars.forEach(star => {

            const idx = parseInt(star.dataset.index);



            if (idx <= count) {

                star.setAttribute("fill", "#000000");

                star.setAttribute("stroke", "#000000");

            } else {

                star.setAttribute("fill", "none");

                star.setAttribute("stroke", "#cccccc");

            }

        });

    }





    function updateStars(count) {

        highlightStars(count);

    }





    // TEXTAREA

    reviewBody.addEventListener("input", () => {

        updateCharCount();

        updateSubmitState();

    });





    function updateCharCount() {

        const len = reviewBody.value.length;



        charCounterValue.textContent = `${len} / 1000`;



        if (len < 10) {

            charHint.style.color = "#B04040";

            charHint.textContent = "Min. 10 characters";

        } else {

            charHint.style.color = "#9ca3af";

            charHint.textContent = "Character requirement met";

        }

    }





    function updateSubmitState() {

        const isRatingValid = selectedRating >= 1;

        const isBodyValid = reviewBody.value.length >= 10;



        submitReviewBtn.disabled = !(

            isRatingValid &&

            isBodyValid

        );

    }





    // FILE UPLOAD

    uploadZone.addEventListener("click", () => {

        mediaInput.click();

    });





    uploadZone.addEventListener("dragover", (e) => {

        e.preventDefault();

        uploadZone.style.borderColor = "#111111";

        uploadZone.style.background = "#fafafa";

    });





    uploadZone.addEventListener("dragleave", () => {

        uploadZone.style.borderColor = "rgba(0,0,0,0.15)";

        uploadZone.style.background = "#ffffff";

    });





    uploadZone.addEventListener("drop", (e) => {

        e.preventDefault();



        uploadZone.style.borderColor = "rgba(0,0,0,0.15)";

        uploadZone.style.background = "#ffffff";



        handleFiles(e.dataTransfer.files);

    });





    mediaInput.addEventListener("change", () => {

        handleFiles(mediaInput.files);

    });





    function handleFiles(files) {

        if (selectedImages.length + files.length > 3) {

            ajaxToast.warning(

                "Maximum 3 images allowed"

            );

            return;

        }



        Array.from(files).forEach(file => {

            if (!file.type.startsWith("image/")) {

                ajaxToast.error(

                    "Only image files are allowed"

                );

                return;

            }



            // DUPLICATE CHECK

            const alreadyExists = selectedImages.some(

                item => item.file.name === file.name

            );



            if (alreadyExists) {

                ajaxToast.warning(

                    "Image already selected"

                );

                return;

            }



            const reader = new FileReader();



            reader.onload = (e) => {

                selectedImages.push({

                    file,

                    dataUrl: e.target.result

                });



                renderPreviews();

            };



            reader.readAsDataURL(file);

        });

    }





    function renderPreviews() {

        mediaPreviews.innerHTML = "";



        selectedImages.forEach((item, index) => {

            const div = document.createElement("div");

            div.className = "media-preview-item";



            div.innerHTML = `

                <img src="${item.dataUrl}" />

                <button
                    type="button"
                    class="media-preview-remove"
                >

                    &times;

                </button>

            `;



            div.querySelector("button")

            .addEventListener("click", () => {

                selectedImages.splice(index, 1);

                renderPreviews();

            });



            mediaPreviews.appendChild(div);

        });

    }





    // SUBMIT REVIEW

    reviewForm.addEventListener("submit", async (e) => {

        e.preventDefault();



        if (submitReviewBtn.disabled) return;



        try {

            submitReviewBtn.disabled = true;

            submitReviewBtn.textContent = "Submitting...";



            const formData = new FormData();



            formData.append(

                "rating",

                selectedRating

            );



            formData.append(

                "title",

                reviewTitle.value.trim()

            );



            formData.append(

                "comment",

                reviewBody.value.trim()

            );



            selectedImages.forEach((item) => {

                formData.append(

                    "images",

                    item.file

                );

            });





            const response = await axios.post(

                `/reviews/${currentProductId}`,

                formData,

                {
                    withCredentials: true,

                    headers: {

                        "Content-Type":

                        "multipart/form-data"

                    }

                }

            );





            if (response.data.success) {

                ajaxToast.success(

                    response.data.message ||

                    "Review submitted successfully"

                );



                closeModal();



                

                if (typeof loadReviews === "function") {

                    loadReviews();

                }

            }

        } catch (error) {

            console.log(error);



            ajaxToast.error(

                error.response?.data?.message ||

                "Something went wrong"

            );

        } finally {

            submitReviewBtn.disabled = false;

            submitReviewBtn.textContent =

                "Submit Review";



            updateSubmitState();

        }

    });



    async function loadReviews() {
        const reviewList = document.getElementById("reviewList");
        const avgRatingValue = document.getElementById("avgRatingValue");
        const avgStarsRow = document.getElementById("avgStarsRow");
        const totalReviewsCount = document.getElementById("totalReviewsCount");
        const starBreakdownContainer = document.getElementById("starBreakdownContainer");

        if (!reviewList) return;

        try {
            const res = await axios.get(`/reviews/${currentProductId}`);
            if (res.data.success) {
                const { reviews, ratingSummary } = res.data;

                // 1. Update Average Rating Value
                if (avgRatingValue) {
                    avgRatingValue.textContent = ratingSummary.averageRating;
                }

                // 2. Update Average Stars Row
                if (avgStarsRow) {
                    const rating = Math.round(Number(ratingSummary.averageRating || 0));
                    avgStarsRow.innerHTML = [1, 2, 3, 4, 5].map(i => `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="${i <= rating ? '#000000' : 'none'}" stroke="#000000" stroke-width="1.5">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                    `).join('');
                }

                // 3. Update Total Reviews Count
                if (totalReviewsCount) {
                    totalReviewsCount.textContent = `Based on ${ratingSummary.totalReviews} ${ratingSummary.totalReviews === 1 ? 'Review' : 'Reviews'}`;
                }

                // Update Header Summary
                const headerRatingContainer = document.getElementById("headerRatingContainer");
                const headerStarsRow = document.getElementById("headerStarsRow");
                const headerRatingText = document.getElementById("headerRatingText");

                if (headerRatingContainer && headerStarsRow && headerRatingText) {
                    if (ratingSummary.totalReviews > 0) {
                        const rating = Math.round(Number(ratingSummary.averageRating || 0));
                        headerStarsRow.innerHTML = [1, 2, 3, 4, 5].map(i => `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${i <= rating ? '#000000' : 'none'}" stroke="#000000" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        `).join('');
                        headerRatingText.textContent = `${ratingSummary.averageRating} (${ratingSummary.totalReviews} ${ratingSummary.totalReviews === 1 ? 'Review' : 'Reviews'})`;
                        headerRatingContainer.style.display = "flex";
                        headerRatingContainer.style.opacity = "1";
                    } else {
                        headerRatingContainer.style.display = "none";
                    }
                }

                // 4. Update Star Breakdown Container
                if (starBreakdownContainer) {
                    const stars = [5, 4, 3, 2, 1];
                    starBreakdownContainer.innerHTML = stars.map(star => {
                        const count = ratingSummary.breakdown[star] || 0;
                        const pct = ratingSummary.totalReviews > 0 ? Math.round((count / ratingSummary.totalReviews) * 100) : 0;
                        return `
                            <div class="filter-row" style="${pct === 0 ? 'opacity: 0.5;' : ''}">
                                <span class="filter-label">${star} Stars</span>
                                <div class="filter-bar-bg"><div class="filter-bar-fill" style="width: ${pct}%;"></div></div>
                                <span class="filter-percent">${pct}%</span>
                            </div>
                        `;
                    }).join('');
                }

                // 5. Update Review List
                if (!reviews || reviews.length === 0) {
                    reviewList.innerHTML = `<div class="text-center py-20 text-stone-400 uppercase tracking-[0.2em] text-xs">No reviews yet</div>`;
                } else {
                    const formatImagePath = (img) => {
                        if (!img) return '';
                        let p = img.replace(/^public[\\\/]/i, '');
                        p = p.replace(/\\/g, '/');
                        if (!p.startsWith('/')) p = '/' + p;
                        return p;
                    };

                    let reviewsHtml = reviews.map((r, index) => {
                        const imagesHtml = r.images && r.images.length > 0 ? `
                            <div class="review-images" style="display: flex; gap: 10px; margin-top: 12px;">
                                ${r.images.map(img => {
                                    const formatted = formatImagePath(img);
                                    return `
                                        <img src="${formatted}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; cursor: pointer;" onclick="window.open('${formatted}', '_blank')" />
                                    `;
                                }).join('')}
                            </div>
                        ` : '';

                        const isHidden = index >= 3 ? 'display: none;' : '';

                        return `
                            <div class="review-card" data-index="${index}" style="padding: 32px; background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); margin-bottom: 24px; ${isHidden}">
                                <div class="review-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <div class="review-stars" style="display: flex; gap: 2px;">
                                            ${[1, 2, 3, 4, 5].map(i => `
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="${i <= r.rating ? '#000000' : 'none'}" stroke="#000000" stroke-width="1.5">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            `).join('')}
                                        </div>
                                        <h4 class="review-title" style="margin-top: 8px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1c1c1c;">${r.title || ''}</h4>
                                        <p class="review-author" style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">
                                            ${r.userId?.name || 'Customer'} &mdash; ${new Date(r.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    ${r.verifiedPurchase ? '<div class="verified-badge" style="font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #10b981; font-weight: 700; border: 1px solid #10b981; padding: 4px 8px; border-radius: 2px;">✓ Verified Purchase</div>' : ''}
                                </div>
                                <p class="review-text" style="font-family: 'DM Sans', sans-serif; font-size: 13px; line-height: 1.6; color: #4a4a4a; margin-top: 12px; letter-spacing: 0.01em;">${r.comment}</p>
                                ${imagesHtml}
                            </div>
                        `;
                    }).join('');

                    if (reviews.length > 3) {
                        reviewsHtml += `
                            <div id="loadMoreContainer" style="text-align: center; margin-top: 32px; width: 100%;">
                                <button id="loadMoreReviewsBtn" class="btn-primary" style="background: #ffffff; color: #1c1c1c; border: 1px solid #1c1c1c; padding: 12px 32px; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 9999px; transition: all 0.3s;" onmouseover="this.style.background='#1c1c1c'; this.style.color='#ffffff';" onmouseout="this.style.background='#ffffff'; this.style.color='#1c1c1c';">
                                    Load More Reviews
                                </button>
                            </div>
                        `;
                    }

                    reviewList.innerHTML = reviewsHtml;

                    if (reviews.length > 3) {
                        const loadMoreBtn = document.getElementById('loadMoreReviewsBtn');
                        let currentShown = 3;
                        loadMoreBtn.addEventListener('click', () => {
                            const hiddenCards = Array.from(reviewList.querySelectorAll('.review-card')).filter(card => card.style.display === 'none');
                            
                            const nextToShow = hiddenCards.slice(0, 3);
                            nextToShow.forEach(card => {
                                card.style.display = 'block';
                            });

                            currentShown += nextToShow.length;

                            if (currentShown >= reviews.length) {
                                document.getElementById('loadMoreContainer').style.display = 'none';
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
            reviewList.innerHTML = `<div class="text-center py-20 text-red-400 uppercase tracking-[0.2em] text-xs">Error loading reviews</div>`;
        }
    }

    window.loadReviews = loadReviews;
    loadReviews();

});

