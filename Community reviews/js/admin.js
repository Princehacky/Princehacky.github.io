"use strict";

/* =========================
   ELEMENTS
========================= */

const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

const logoutButton = document.getElementById("logout-button");

const statistics = document.getElementById("statistics");

const pendingReviews =
    document.getElementById("pending-reviews");

const approvedReviews =
    document.getElementById("approved-reviews");

const rejectedReviews =
    document.getElementById("rejected-reviews");

const refreshButton =
    document.getElementById("refresh-dashboard");

let dashboardLoading = false;
let moderationInProgress = false;


/* =========================
   PAGE START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log("Admin page ready");

        setupTabs();
        setupRefresh();
        checkAdminSession();

    }
);


/* =========================
   LOGIN SESSION
========================= */

async function checkAdminSession() {

    try {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            showLoginMessage(
                "Supabase is not loaded."
            );

            return;
        }


        const result =
            await supabaseClient
                .auth
                .getSession();


        if (result.error) {
            throw result.error;
        }


        const session =
            result.data.session;


        if (!session) {

            showLogin();

            return;
        }


        const isAdmin =
            await verifyAdmin(
                session.user.id
            );


        if (!isAdmin) {

            await supabaseClient
                .auth
                .signOut();

            showLogin();

            showLoginMessage(
                "This account is not an admin."
            );

            return;
        }


        showAdminDashboard();

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        showLogin();

        showLoginMessage(
            "Unable to check your session."
        );
    }
}


/* =========================
   VERIFY ADMIN
========================= */

async function verifyAdmin(userId) {

    const result =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();


    if (result.error) {

        console.error(
            "Admin verification failed:",
            result.error
        );

        return false;
    }


    return Boolean(result.data);
}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

    if (loginSection) {
        loginSection.hidden = false;
    }

    if (adminSection) {
        adminSection.hidden = true;
    }
}


/* =========================
   SHOW DASHBOARD
========================= */

function showAdminDashboard() {

    if (loginSection) {
        loginSection.hidden = true;
    }

    if (adminSection) {
        adminSection.hidden = false;
    }

    loadDashboard();
}


/* =========================
   LOGIN MESSAGE
========================= */

function showLoginMessage(message) {

    if (loginMessage) {
        loginMessage.textContent = message;
    }
}


/* =========================
   LOGIN FORM
========================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;


            showLoginMessage(
                "Signing in..."
            );


            try {

                const result =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email: email,
                            password: password
                        });


                if (result.error) {
                    throw result.error;
                }


                const user =
                    result.data.user;


                if (!user) {
                    throw new Error(
                        "Login failed."
                    );
                }


                const isAdmin =
                    await verifyAdmin(
                        user.id
                    );


                if (!isAdmin) {

                    await supabaseClient
                        .auth
                        .signOut();

                    throw new Error(
                        "This account is not an admin."
                    );
                }


                showLoginMessage("");

                showAdminDashboard();

            } catch (error) {

                console.error(
                    "Login failed:",
                    error
                );

                showLoginMessage(
                    error.message ||
                    "Login failed."
                );
            }
        }
    );
}


/* =========================
   LOGOUT
========================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled = true;

            try {

                await supabaseClient
                    .auth
                    .signOut();

                showLogin();

            } catch (error) {

                console.error(
                    "Logout failed:",
                    error
                );

            } finally {

                logoutButton.disabled = false;
            }
        }
    );
}


/* =========================
   LOAD DASHBOARD
========================= */

async function loadDashboard() {

    if (dashboardLoading) {
        return;
    }


    dashboardLoading = true;

    console.log(
        "Admin dashboard loading..."
    );

    console.time(
        "admin-dashboard"
    );


    try {

        const reviewsResult =
            await supabaseClient
                .from("reviews")
                .select(
                    "id,game_id,nickname,rating,title,review,status,created_at"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .range(0, 49);


        if (reviewsResult.error) {
            throw reviewsResult.error;
        }


        const gamesResult =
            await supabaseClient
                .from("games")
                .select(
                    "id,name,slug"
                );


        if (gamesResult.error) {
            throw gamesResult.error;
        }


        const reviews =
            Array.isArray(
                reviewsResult.data
            )
                ? reviewsResult.data
                : [];


        const games =
            Array.isArray(
                gamesResult.data
            )
                ? gamesResult.data
                : [];


        const gameMap =
            new Map();


        games.forEach(
            function (game) {

                gameMap.set(
                    game.id,
                    game
                );

            }
        );


        reviews.forEach(
            function (review) {

                review.game =
                    gameMap.get(
                        review.game_id
                    ) || null;

            }
        );


        const pending =
            reviews.filter(
                function (review) {
                    return (
                        review.status ===
                        "pending"
                    );
                }
            );


        const approved =
            reviews.filter(
                function (review) {
                    return (
                        review.status ===
                        "approved"
                    );
                }
            );


        const rejected =
            reviews.filter(
                function (review) {
                    return (
                        review.status ===
                        "rejected"
                    );
                }
            );


        renderStatistics(
            reviews,
            pending,
            approved,
            rejected
        );


        renderReviews(
            pendingReviews,
            pending
        );


        renderReviews(
            approvedReviews,
            approved
        );


        renderReviews(
            rejectedReviews,
            rejected
        );


        console.log(
            "Admin dashboard loaded:",
            reviews.length,
            "reviews"
        );

    } catch (error) {

        console.error(
            "Admin dashboard failed:",
            error
        );

        renderError(
            "Unable to load reviews."
        );

    } finally {

        dashboardLoading = false;

        console.timeEnd(
            "admin-dashboard"
        );
    }
}


/* =========================
   STATISTICS
========================= */

function renderStatistics(
    reviews,
    pending,
    approved,
    rejected
) {

    if (!statistics) {
        return;
    }


    let average = "0.0";


    if (reviews.length > 0) {

        const total =
            reviews.reduce(
                function (sum, review) {

                    return (
                        sum +
                        Number(
                            review.rating || 0
                        )
                    );

                },
                0
            );


        average =
            (
                total /
                reviews.length
            ).toFixed(1);
    }


    statistics.innerHTML =

        "<div>" +
        "<strong>" +
        reviews.length +
        "</strong>" +
        "<span>Total</span>" +
        "</div>" +

        "<div>" +
        "<strong>" +
        pending.length +
        "</strong>" +
        "<span>Pending</span>" +
        "</div>" +

        "<div>" +
        "<strong>" +
        approved.length +
        "</strong>" +
        "<span>Approved</span>" +
        "</div>" +

        "<div>" +
        "<strong>" +
        rejected.length +
        "</strong>" +
        "<span>Rejected</span>" +
        "</div>" +

        "<div>" +
        "<strong>" +
        average +
        "</strong>" +
        "<span>Average</span>" +
        "</div>";
}


/* =========================
   RENDER REVIEWS
========================= */

function renderReviews(
    container,
    reviews
) {

    if (!container) {
        return;
    }


    if (!reviews.length) {

        container.innerHTML =
            "<p>No reviews here.</p>";

        return;
    }


    container.innerHTML =
        reviews
            .map(
                function (review) {

                    const gameName =
                        escapeHTML(
                            review.game
                                ? review.game.name
                                : "Unknown Game"
                        );


                    const nickname =
                        escapeHTML(
                            review.nickname ||
                            "Anonymous"
                        );


                    const title =
                        escapeHTML(
                            review.title ||
                            "Untitled review"
                        );


                    const text =
                        escapeHTML(
                            review.review ||
                            ""
                        );


                    const status =
                        escapeHTML(
                            review.status ||
                            "unknown"
                        );


                    const date =
                        escapeHTML(
                            formatDate(
                                review.created_at
                            )
                        );


                    let actions = "";


                    if (
                        review.status ===
                        "pending"
                    ) {

                        actions =

                            '<div class="admin-actions">' +

                            '<button ' +
                            'type="button" ' +
                            'data-review-action="approve" ' +
                            'data-review-id="' +
                            Number(review.id) +
                            '">' +
                            "Approve" +
                            "</button>" +

                            '<button ' +
                            'type="button" ' +
                            'data-review-action="reject" ' +
                            'data-review-id="' +
                            Number(review.id) +
                            '">' +
                            "Reject" +
                            "</button>" +

                            "</div>";
                    }


                    return (

                        '<article class="card review-card">' +

                        "<h3>" +
                        title +
                        "</h3>" +

                        "<p>" +
                        text +
                        "</p>" +

                        "<p><strong>Game:</strong> " +
                        gameName +
                        "</p>" +

                        "<p><strong>Nickname:</strong> " +
                        nickname +
                        "</p>" +

                        "<p><strong>Rating:</strong> " +
                        Number(
                            review.rating || 0
                        ) +
                        "/5</p>" +

                        "<p><strong>Status:</strong> " +
                        status +
                        "</p>" +

                        "<p><strong>Submitted:</strong> " +
                        date +
                        "</p>" +

                        actions +

                        "</article>"
                    );
                }
            )
            .join("");


    const buttons =
        container.querySelectorAll(
            "[data-review-action]"
        );


    buttons.forEach(
        function (button) {

            button.onclick =
                function () {

                    const id =
                        Number(
                            button.getAttribute(
                                "data-review-id"
                            )
                        );


                    const action =
                        button.getAttribute(
                            "data-review-action"
                        );


                    handleModeration(
                        id,
                        action,
                        button
                    );
                };
        }
    );
}


/* =========================
   MODERATION
========================= */

async function handleModeration(
    id,
    action,
    button
) {

    if (moderationInProgress) {
        return;
    }


    let newStatus = "";


    if (action === "approve") {
        newStatus = "approved";
    }


    if (action === "reject") {
        newStatus = "rejected";
    }


    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        !newStatus
    ) {
        return;
    }


    const actionName =
        newStatus === "approved"
            ? "approve"
            : "reject";


    if (
        !window.confirm(
            "Are you sure you want to " +
            actionName +
            " this review?"
        )
    ) {
        return;
    }


    moderationInProgress = true;


    if (button) {

        button.disabled = true;

        button.textContent =
            newStatus === "approved"
                ? "Approving..."
                : "Rejecting...";
    }


    try {

        console.log(
            "Moderating review:",
            id,
            "=>",
            newStatus
        );


        const result =
            await supabaseClient
                .from("reviews")
                .update({
                    status: newStatus
                })
                .eq("id", id)
                .select(
                    "id,game_id,nickname,rating,title,review,status,created_at"
                )
                .single();


        if (result.error) {
            throw result.error;
        }


        console.log(
            "Review moderation successful:",
            result.data
        );


        await loadDashboard();

    } catch (error) {

        console.error(
            "Review moderation failed:",
            error
        );


        window.alert(
            "Could not " +
            actionName +
            " the review.\n\n" +
            error.message
        );

    } finally {

        moderationInProgress = false;
    }
}


/* =========================
   TABS
========================= */

function setupTabs() {

    const tabs =
        document.querySelectorAll(
            ".admin-tab"
        );


    const panels =
        document.querySelectorAll(
            ".review-panel"
        );


    console.log(
        "Setting up tabs:",
        tabs.length,
        "tabs",
        panels.length,
        "panels"
    );


    tabs.forEach(
        function (button) {

            button.onclick =
                function () {

                    const selected =
                        button.dataset.tab;


                    console.log(
                        "Tab clicked:",
                        selected
                    );


                    tabs.forEach(
                        function (tab) {

                            tab.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    panels.forEach(
                        function (panel) {

                            panel.hidden =
                                panel.dataset.panel !==
                                selected;

                        }
                    );
                };
        }
    );
}


/* =========================
   REFRESH
========================= */

function setupRefresh() {

    const button =
        document.getElementById(
            "refresh-dashboard"
        );


    if (!button) {

        console.error(
            "Refresh button not found"
        );

        return;
    }


    button.onclick =
        async function () {

            if (dashboardLoading) {
                return;
            }


            button.disabled = true;

            button.textContent =
                "Refreshing...";


            try {

                await loadDashboard();

            } finally {

                button.disabled = false;

                button.textContent =
                    "Refresh Reviews";
            }
        };
}


/* =========================
   ERROR
========================= */

function renderError(message) {

    if (statistics) {

        statistics.innerHTML =
            "<p>" +
            escapeHTML(message) +
            "</p>";
    }


    if (pendingReviews) {
        pendingReviews.innerHTML = "";
    }


    if (approvedReviews) {
        approvedReviews.innerHTML = "";
    }


    if (rejectedReviews) {
        rejectedReviews.innerHTML = "";
    }
}


/* =========================
   HELPERS
========================= */

function formatDate(value) {

    if (!value) {
        return "Unknown";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Unknown";
    }


    return date.toLocaleString();
}


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