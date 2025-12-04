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
    // Prepare stats for division 2 players
    const stats = {};

    Object.entries(players).forEach(([id, p]) => {
        if (p.division === 2) {
            stats[id] = {
                name: p.username,
                gamesWon: 0,
                gamesLost: 0,
                gamesNet: 0,
                rubbersWon: 0,
                rubbersLost: 0,
                rubbersNet: 0,
                towersWon: 0,
                towersLost: 0,
                towersNet: 0
            };
        }
    });

    // Process games & update stats
    Object.values(games).forEach(game => {
        if (!game.score || !game.towersTakenDown) return;

        const [tw1, tw2] = game.towersTakenDown.split("-").map(n => parseInt(n));
        const [ru1, ru2] = game.score.split("-").map(n => parseInt(n));
        let [ga1, ga2] = [0, 0];
        if (ru1 > ru2) {
            ga1 = 1;
        } else if (ru2 > ru1) {
            ga2 = 1;
        }

        const p1 = game.player1;
        const p2 = game.player2;

        if (stats[p1]) {
            stats[p1].gamesWon += ga1;
            stats[p1].gamesLost += ga2;
            stats[p1].gamesNet += ga1 - ga2;
            stats[p1].rubbersWon += ru1;
            stats[p1].rubbersLost += ru2;
            stats[p1].rubbersNet += ru1 - ru2;
            stats[p1].towersWon += tw1;
            stats[p1].towersLost += tw2;
            stats[p1].towersNet += tw1 - tw2;
        }

        if (stats[p2]) {
            stats[p2].gamesWon += ga2;
            stats[p2].gamesLost += ga1;
            stats[p2].gamesNet += ga2 - ga1;
            stats[p2].rubbersWon += ru2;
            stats[p2].rubbersLost += ru1;
            stats[p2].rubbersNet += ru2 - ru1;
            stats[p2].towersWon += tw2;
            stats[p2].towersLost += tw1;
            stats[p2].towersNet += tw2 - tw1;
        }
    });

    // Compute towersNet towers
    Object.values(stats).forEach(s => {
        s.towersNet = s.towersWon - s.towersLost;
    });

    // Sort for ranking
    const leaderboard = Object.values(stats).sort((a, b) => {
        // 1. Net games
        if (b.gamesNet !== a.gamesNet) return b.gamesNet - a.gamesNet;

        // 2. Games won
        if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;

        // 3. Net rubbers
        if (b.rubbersNet !== a.rubbersNet) return b.rubbersNet - a.rubbersNet;

        // 4. Rubbers won
        if (b.rubbersWon !== a.rubbersWon) return b.rubbersWon - a.rubbersWon;

        // 5. Net towers
        if (b.towersNet !== a.towersNet) return b.towersNet - a.towersNet;

        // 6. Towers won
        return b.towersWon - a.towersWon;
    });


    renderTable(leaderboard);
}

function renderTable(leaderboard) {
    const tbody = document.querySelector("#leagueTable tbody");
    tbody.innerHTML = "";

    let prevPlayer = [];

    leaderboard.forEach((p, index) => {
        // Find player ID from name (to get tag)
        const playerId = Object.keys(players).find(id => players[id].username === p.name);
        const tag = players[playerId]?.tag?.replace("#", "") || "";

        const row = document.createElement("tr");

        let rank = index + 1;

        if (prevPlayer.length > 0 &&
            prevPlayer[0] === p.gamesWon &&
            prevPlayer[1] === p.gamesLost &&
            prevPlayer[2] === p.rubbersWon &&
            prevPlayer[3] === p.rubbersLost &&
            prevPlayer[4] === p.towersWon &&
            prevPlayer[5] === p.towersLost) {
            rank = prevPlayer[6];
        }

        row.innerHTML = `
            <td><b>${rank}</b></td>
            <td><a href="https://royaleapi.com/player/${tag}" target="_blank">${p.name}</a></td>
            <td>${p.gamesWon + p.gamesLost}</td>
            <td><b>${p.gamesNet}</b></td>
            <td>${p.rubbersWon + p.rubbersLost}</td>
            <td><b>${p.rubbersNet}</b></td>
            <td>${p.towersNet}</td>
            <td>${p.towersWon}</td>
            <td>${p.towersLost}</td>
        `;

        prevPlayer = [p.gamesWon, p.gamesLost, p.rubbersWon, p.rubbersLost, p.towersWon, p.towersLost, rank];
        tbody.appendChild(row);
    });
}


loadData();
