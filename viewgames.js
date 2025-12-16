let players = {};
let games = {};
let nextGameId = 0;

const container = document.getElementById("gamesContainer");
const searchInput = document.getElementById("searchInput");
const hideInactiveCheckbox = document.getElementById("hideInactiveCheckbox");

async function loadData() {
    const playersData = await fetch("idplayers.json").then(r => r.json());
    const gamesData = await fetch("games.json").then(r => r.json());

    players = playersData;
    games = gamesData.games;
    nextGameId = gamesData.nextGameId;

    renderGames();
}

function renderPlayerName(playerId, direction) {
    const player = players[playerId];
    if (!player) return "Unknown";

    const inactiveTag = !player.isActive 
        ? `<span class="inactive-tag">Inactive</span>`
        : "";

    if (direction === "left") {
        return `${inactiveTag} ${player.username}`;
    } else {
        return `${player.username} ${inactiveTag}`;
    }
}

function renderGames(filter = "") {
    container.innerHTML = "";

    const filterLower = filter.toLowerCase();

    // group games by timestamp string
    const grouped = {};

    Object.entries(games).forEach(([id, game]) => {
        const datetime = new Date(game.datetime);
        
        let viewType = document.getElementsByTagName("h1")[0].innerText;
        if (viewType.toLowerCase().startsWith("past") || viewType.toLowerCase().startsWith("unplayed")) {
            if (new Date(game.datetime).setHours(0,0,0,0) > new Date().setHours(0,0,0,0)) return;
        } else if (viewType.toLowerCase().startsWith("future")) {
            if (new Date(game.datetime).setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) return;
        }

        if (viewType.toLowerCase().startsWith("unplayed")) {
            if (game.score) return;
        }

        const player1 = players[game.player1];
        const player2 = players[game.player2];

        if (
            hideInactiveCheckbox.checked &&
            (!player1?.isActive || !player2?.isActive)
        ) {
            return;
        }


        // get day of the week + full date and time
        const dayOfWeek = datetime.toLocaleDateString(undefined, { weekday: 'long' });
        const datePart = datetime.toLocaleDateString(); // e.g., 12/3/2025
        const timePart = datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const dateKey = `${dayOfWeek} ${datePart} ${timePart}`; // e.g., "Wednesday, 12/3/2025 12:30"

        // player lookup
        const p1 = renderPlayerName(game.player1, "left");
        const p2 = renderPlayerName(game.player2, "right");

        // apply search filter
        if (
            filter &&
            !p1.toLowerCase().includes(filterLower) &&
            !p2.toLowerCase().includes(filterLower)
        ) {
            return;
        }

        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({ id, ...game });
    });

    console.log(grouped);


    // render headings and games
    for (const timestamp in grouped) {
        const heading = document.createElement("div");
        heading.className = "timestamp-heading";
        heading.textContent = timestamp;
        container.appendChild(heading);

        const divisions = [1, 2];
        for (const division of divisions) {
            const divisionHeading = document.createElement("div");
            divisionHeading.className = "division-heading";
            divisionHeading.textContent = `Division ${division}`;
            container.appendChild(divisionHeading);


            grouped[timestamp].forEach(game => {
                if (players[game["player1"]]["division"] !== division) return;
                const p1 = renderPlayerName(game.player1, "left");
                const p2 = renderPlayerName(game.player2, "right");

                const card = document.createElement("div");
                card.className = "game-card";

                card.innerHTML = `
                    <div class="game-title">${p1} vs ${p2}</div>
                    <div class="score">Score: ${game.score ?? "Pending"}</div>
                    ${game.imageData ? `<img class="game-image" src="${game.imageData}" alt="${game.imageName}">` : ""}
                `;

                container.appendChild(card);
            });
        }
    }
}

searchInput.addEventListener("input", () => {
    renderGames(searchInput.value.trim());
});

hideInactiveCheckbox.addEventListener("change", () => {
    renderGames(searchInput.value.trim());
});

loadData();
