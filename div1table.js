let players = {};
let games = {};

async function loadData() {
    const playersData = await fetch("idplayers.json").then(r => r.json());
    const gamesData = await fetch("games.json").then(r => r.json());

    players = playersData;
    games = gamesData.games;

    buildLeagueTable();
}

function buildLeagueTable() {
    // Prepare stats for division 1 players
    const stats = {};

    Object.entries(players).forEach(([id, p]) => {
        if (p.division === 1) {
            stats[id] = {
                name: p.username,
                gamesPlayed: 0,
                rubbersPlayed: 0,
                towersWon: 0,
                towersLost: 0,
                net: 0
            };
        }
    });

    // Process games & update stats
    Object.values(games).forEach(game => {
        if (!game.score || !game.towersTakenDown) return;

        const [tw1, tw2] = game.towersTakenDown.split("-").map(n => parseInt(n));
        const [ru1, ru2] = game.score.split("-").map(n => parseInt(n));

        const p1 = game.player1;
        const p2 = game.player2;

        if (stats[p1]) {
            stats[p1].gamesPlayed++;
            stats[p1].rubbersPlayed += ru1 + ru2;
            stats[p1].towersWon += tw1;
            stats[p1].towersLost += tw2;
        }

        if (stats[p2]) {
            stats[p2].gamesPlayed++;
            stats[p2].rubbersPlayed += ru1+ ru2;
            stats[p2].towersWon += tw2;
            stats[p2].towersLost += tw1;
        }
    });

    // Compute net towers
    Object.values(stats).forEach(s => {
        s.net = s.towersWon - s.towersLost;
    });

    // Sort for ranking
    const leaderboard = Object.values(stats).sort((a, b) => {
        if (b.net !== a.net) return b.net - a.net;
        return b.towersWon - a.towersWon;
    });

    renderTable(leaderboard);
}

function renderTable(leaderboard) {
    const tbody = document.querySelector("#leagueTable tbody");
    tbody.innerHTML = "";

    leaderboard.forEach((p, index) => {
        // Find player ID from name (to get tag)
        const playerId = Object.keys(players).find(id => players[id].username === p.name);
        const tag = players[playerId]?.tag?.replace("#", "") || "";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><a href="https://royaleapi.com/player/${tag}" target="_blank">${p.name}</a></td>
            <td>${p.gamesPlayed}</td>
            <td>${p.rubbersPlayed}</td>
            <td>${p.towersWon}</td>
            <td>${p.towersLost}</td>
            <td>${p.net}</td>
        `;
        tbody.appendChild(row);
    });
}


loadData();
