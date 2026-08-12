"use strict";

/* =========================
   PUBLIC GAME REVIEW PAGE
========================= */

const gameTitle =
    document.getElementById("game-title");

const gameDescription =
    document.getElementById("game-description");

const gameStats =
    document.getElementById("game-stats");

const ratingSummary =
    document.getElementById("rating-summary");

const reviewForm =
    document.getElementById("review-form");

const reviewsList =
    document.getElementById("reviews-list");

const formMessage =
    document.getElementById("form-message");

let currentGame = null;
let currentReviews = [];
let reviewSubmitting = false;


/* =========================
   LOAD GAME
========================= */

async function loadGame() {

    try {

        showLoading();

        const params =
            new URLSearchParams(
                window.location.search
            );

        const slug =
            params.get("game");


        if (!slug) {

            showError(
                "No game was specified."
            );

            return;
        }


        if (
            typeof ReviewsAPI ===
            "undefined"
        ) {

            showError(
                "Review system is unavailable."
            );

            console.error(
                "ReviewsAPI is not defined."
            );

            return;
        }


        const game =
            await ReviewsAPI.getGame(slug);


        if (!game) {

            showError(
                "Game not found."
            );

            return;
        }


        currentGame = game;


        if (gameTitle) {

            gameTitle.textContent =
                game.name;
        }


        if (gameDescription) {

            gameDescription.textContent =
                game.description ||
                "No description available.";
        }


        if (reviewsList) {

            reviewsList.innerHTML =
                `
                <p>
                    Loading approved reviews...
                </p>
                `;
        }


        const reviews =
            await ReviewsAPI
                .getApprovedReviews(
                    game.id
                );


        currentReviews =
            Array.isArray(reviews)
                ? reviews
                : [];


        renderStats(
            currentReviews
        );

        renderReviews(
            currentReviews
        );


    } catch (error) {

        console.error(
            "Failed to load game:",
            error
        );

        showError(
            "Unable to load this game right now."
        );
    }
}


/* =========================
   RATING STATISTICS
========================= */

function renderStats(reviews) {

    const total =
        reviews.length;


    const average =
        total
            ? (
                reviews.reduce(
                    function (
                        sum,
                        review
                    ) {

                        return (
                            sum +
                            Number(
                                review.rating ||
                                0
                            )
                        );

                    },
                    0
                ) / total
            ).toFixed(1)
            : "0.0";


    const rounded =
        total
            ? Math.round(
                Number(average)
            )
            : 0;


    const stars =
        createStars(
            rounded
        );


    if (gameStats) {

        gameStats.innerHTML = `

            <div class="card">

                <strong>
                    ${total}
                </strong>

                <span>
                    Approved
                    ${total === 1
                        ? "Review"
                        : "Reviews"}
                </span>

            </div>


            <div class="card">

                <strong>
                    ${average} / 5
                </strong>

                <span>
                    Average Rating
                </span>

            </div>
        `;
    }


    if (ratingSummary) {

        ratingSummary.innerHTML = `

            <div class="card rating-card">

                <h2>
                    Community Rating
                </h2>


                <div
                    class="rating-stars"
                    aria-label="${average} out of 5 stars"
                >
                    ${stars}
                </div>


                <strong class="rating-number">
                    ${average} / 5
                </strong>


                <p>
                    Based on
                    ${total}
                    approved
                    ${total === 1
                        ? "review"
                        : "reviews"}.
                </p>

            </div>
        `;
    }
}


/* =========================
   RENDER REVIEWS
========================= */

function renderReviews(reviews) {

    if (!reviewsList) {
        return;
    }


    if (!reviews.length) {

        reviewsList.innerHTML = `

            <div class="card empty-reviews">

                <h3>
                    No approved reviews yet
                </h3>

                <p>
                    Be the first to review
                    this game.
                </p>

            </div>
        `;

        return;
    }


    reviewsList.innerHTML =
        reviews
            .map(
                function (review) {

                    const rating =
                        clampRating(
                            review.rating
                        );


                    const stars =
                        createStars(
                            rating
                        );


                    const nickname =
                        escapeHTML(
                            review.nickname ||
                            "Anonymous"
                        );


                    const title =
                        review.title
                            ? `
                                <h3>
                                    ${escapeHTML(
                                        review.title
                                    )}
                                </h3>
                              `
                            : "";


                    const text =
                        escapeHTML(
                            review.review ||
                            ""
                        );


                    const date =
                        formatDate(
                            review.created_at
                        );


                    return `

                        <article
                            class="card review-card"
                        >

                            <div
                                class="review-rating"
                                aria-label="${rating} out of 5 stars"
                            >

                                <span
                                    class="rating-stars"
                                >
                                    ${stars}
                                </span>

                                <strong>
                                    ${rating}/5
                                </strong>

                            </div>


                            ${title}


                            <p
                                class="review-text"
                            >
                                ${text}
                            </p>


                            <small
                                class="review-author"
                            >
                                By ${nickname}
                            </small>


                            <small
                                class="review-date"
                            >
                                ${escapeHTML(
                                    date
                                )}
                            </small>

                        </article>
                    `;
                }
            )
            .join("");
}


/* =========================
   REVIEW SUBMISSION
========================= */

if (reviewForm) {

    reviewForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (reviewSubmitting) {
                return;
            }


            if (!currentGame) {

                setFormMessage(
                    "Game information is still loading."
                );

                return;
            }


            const nicknameElement =
                document.getElementById(
                    "nickname"
                );

            const ratingElement =
                document.getElementById(
                    "rating"
                );

            const titleElement =
                document.getElementById(
                    "title"
                );

            const reviewElement =
                document.getElementById(
                    "review"
                );


            const nickname =
                nicknameElement
                    ? nicknameElement.value.trim()
                    : "";


            const rating =
                ratingElement
                    ? Number(
                        ratingElement.value
                    )
                    : 0;


            const title =
                titleElement
                    ? titleElement.value.trim()
                    : "";


            const review =
                reviewElement
                    ? reviewElement.value.trim()
                    : "";


            /* Nickname */

            if (!nickname) {

                setFormMessage(
                    "Please enter a nickname."
                );

                return;
            }


            if (nickname.length > 30) {

                setFormMessage(
                    "Nickname must be 30 characters or less."
                );

                return;
            }


            /* Rating */

            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {

                setFormMessage(
                    "Please select a rating from 1 to 5."
                );

                return;
            }


            /* Title */

            if (title.length > 100) {

                setFormMessage(
                    "Review title must be 100 characters or less."
                );

                return;
            }


            /* Review */

            if (!review) {

                setFormMessage(
                    "Please write a review."
                );

                return;
            }


            if (review.length < 5) {

                setFormMessage(
                    "Your review must contain at least 5 characters."
                );

                return;
            }


            if (review.length > 1000) {

                setFormMessage(
                    "Your review must be 1000 characters or less."
                );

                return;
            }


            const submitButton =
                reviewForm.querySelector(
                    'button[type="submit"]'
                );


            reviewSubmitting = true;


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Submitting...";
            }


            setFormMessage(
                "Submitting review..."
            );


            try {

                await ReviewsAPI.submitReview({

                    game_id:
                        currentGame.id,

                    nickname:
                        nickname,

                    rating:
                        rating,

                    title:
                        title || null,

                    review:
                        review
                });


                reviewForm.reset();


                setFormMessage(
                    "Review submitted. It will appear after approval."
                );


            } catch (error) {

                console.error(
                    "Review submission failed:",
                    error
                );


                setFormMessage(
                    "Unable to submit your review. Please try again."
                );


            } finally {

                reviewSubmitting =
                    false;


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Submit Review";
                }
            }
        }
    );
}


/* =========================
   FORM MESSAGE
========================= */

function setFormMessage(message) {

    if (!formMessage) {
        return;
    }

    formMessage.textContent =
        message;
}


/* =========================
   LOADING STATE
========================= */

function showLoading() {

    if (gameTitle) {

        gameTitle.textContent =
            "Loading Game...";
    }


    if (gameDescription) {

        gameDescription.textContent =
            "Please wait while we load the game information.";
    }


    if (gameStats) {

        gameStats.innerHTML = `
            <div class="card">
                Loading statistics...
            </div>
        `;
    }


    if (ratingSummary) {

        ratingSummary.innerHTML = `
            <div class="card">
                Loading rating...
            </div>
        `;
    }


    if (reviewsList) {

        reviewsList.innerHTML = `
            <p>
                Loading approved reviews...
            </p>
        `;
    }
}


/* =========================
   ERROR STATE
========================= */

function showError(message) {

    if (gameTitle) {

        gameTitle.textContent =
            "Unable to Load Game";
    }


    if (gameDescription) {

        gameDescription.textContent =
            message;
    }


    if (gameStats) {

        gameStats.innerHTML = "";
    }


    if (ratingSummary) {

        ratingSummary.innerHTML = "";
    }


    if (reviewsList) {

        reviewsList.innerHTML = `

            <div
                class="card"
                role="alert"
            >

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>

            </div>
        `;
    }
}


/* =========================
   STAR DISPLAY
========================= */

function createStars(rating) {

    const safeRating =
        clampRating(rating);


    return (
        "★".repeat(
            safeRating
        ) +
        "☆".repeat(
            5 - safeRating
        )
    );
}


/* =========================
   RATING SAFETY
========================= */

function clampRating(value) {

    const rating =
        Number(value);


    if (!Number.isFinite(rating)) {
        return 0;
    }


    return Math.min(
        5,
        Math.max(
            0,
            Math.round(rating)
        )
    );
}


/* =========================
   DATE FORMAT
========================= */

function formatDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================
   HTML SECURITY
========================= */

function escapeHTML(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        String(
            value == null
                ? ""
                : value
        );


    return element.innerHTML;
}


/* =========================
   START
========================= */

loadGame();