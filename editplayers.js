let players = [];

// DOM elements
const form = document.getElementById("playerForm");
const tableBody = document.querySelector("#playersTable tbody");

// Render table
function renderPlayers() {
    tableBody.innerHTML = "";

    players.forEach((player, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${player.username}</td>
            <td>${player.tag}</td>
            <td>${player.trophies}</td>
            <td>${player.division}</td>
            <td>${player.isActive ? "Yes" : "No"}</td>
            <td>
                <button onclick="editPlayer(${index})">Edit</button>
                <button onclick="removePlayer(${index})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Add / Edit player
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const tag = document.getElementById("tag").value;
    const trophies = document.getElementById("trophies").value;
    const division = document.getElementById("division").value;
    const isActive = document.getElementById("isActive").checked;
    const editIndex = document.getElementById("editIndex").value;

    const playerData = { username, tag, trophies: Number(trophies), division: Number(division), isActive };

    if (editIndex === "") {
        players.push(playerData);
    } else {
        players[editIndex] = playerData;
    }

    form.reset();
    document.getElementById("editIndex").value = "";
    renderPlayers();
});

// Remove player
function removePlayer(index) {
    players.splice(index, 1);
    renderPlayers();
}

// Edit player
function editPlayer(index) {
    const p = players[index];
    document.getElementById("username").value = p.username;
    document.getElementById("tag").value = p.tag;
    document.getElementById("trophies").value = p.trophies;
    document.getElementById("division").value = p.division;
    document.getElementById("isActive").checked = p.isActive;
    document.getElementById("editIndex").value = index;
}

// Save JSON (download)
document.getElementById("downloadBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "players.json";
    a.click();

    URL.revokeObjectURL(url);
});

// Load JSON (upload)
document.getElementById("uploadInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            players = JSON.parse(e.target.result);
            renderPlayers();
        } catch {
            alert("Invalid JSON file");
        }
    };
    reader.readAsText(file);
});
