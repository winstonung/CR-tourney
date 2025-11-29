// Player JSON data
fetch("players.json")
    .then(response => response.json())
    .then(item => {
        const players = item;
        // Initial render
        loadPlayers(players);
    });

const tableBody = document.querySelector("#playersTable tbody");
const searchInput = document.getElementById("searchInput");

function loadPlayers(list) {
    tableBody.innerHTML = "";

    list.forEach(player => {
        const cleanTag = player.tag.replace("#", "");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${player.username}</td>
            <td>${player.tag}</td>
            <td>${player.division}</td>
            <td><a href="https://royaleapi.com/player/${cleanTag}" target="_blank">View Profile</a></td>
        `;
        tableBody.appendChild(row);
    });
}

// Live search filter
searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();

    const filtered = players.filter(player =>
        player.username.toLowerCase().includes(term) ||
        player.tag.toLowerCase().includes(term) ||
        player.division.toString().includes(term)
    );

    loadPlayers(filtered);
});

