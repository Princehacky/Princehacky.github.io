const app = document.getElementById("app");

async function loadGames() {
    try {
        app.innerHTML = "<p>Loading games...</p>";

        const games = await ReviewsAPI.getGames();

        if (!games || games.length === 0) {
            app.innerHTML = "<p>No games found.</p>";
            return;
        }

        app.innerHTML = games.map(game => `
            <article class="card">

                <h2>${escapeHTML(game.name)}</h2>

                <p>
                    ${escapeHTML(
                        game.description || "No description available."
                    )}
                </p>

                <a href="game.html?game=${encodeURIComponent(game.slug)}">
                    View Reviews
                </a>

            </article>
        `).join("");

    } catch (error) {

        console.error("Failed to load games:", error);

        app.innerHTML = `
            <p>
                Unable to load games right now.
                Please try again later.
            </p>
        `;
    }
}

function escapeHTML(value) {
    const element = document.createElement("div");

    element.textContent = value;

    return element.innerHTML;
}

loadGames();