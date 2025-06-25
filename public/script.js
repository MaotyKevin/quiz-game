let playerName = prompt("Enter your name:") || "Anonymous";
const socket = io({ query: { name: playerName } });

const questionDiv = document.getElementById("question");
const optionsDiv = document.getElementById("options");
const scoresDiv = document.getElementById("scores");
const roundDiv = document.getElementById("roundInfo");

socket.on("question", data => {
  questionDiv.innerHTML = decode(data.question);
  optionsDiv.innerHTML = "";

  data.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = decode(option);
    btn.onclick = () => {
      socket.emit("answer", { answer: option });
    };
    optionsDiv.appendChild(btn);
  });
});

socket.on("players", players => {
  scoresDiv.innerHTML = "<h2>Scores</h2>";
  for (const [id, p] of Object.entries(players)) {
    scoresDiv.innerHTML += `${p.name}: ${p.score}<br>`;
  }
});

socket.on("round", (num) => {
  roundDiv.innerText = `🌀 Round ${num}`;
});

socket.on("winner", (data) => {
  questionDiv.innerHTML = `🏆 ${data.name} wins with ${data.score} points!`;
  optionsDiv.innerHTML = "";
});
  
function decode(text) {
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

const playersListDiv = document.getElementById("playersList");

socket.on("players", players => {
  scoresDiv.innerHTML = "<h2>Scores</h2>";
  for (const [id, p] of Object.entries(players)) {
    scoresDiv.innerHTML += `${p.name}: ${p.score}<br>`;
  }

  // Update players list top-right
  playersListDiv.innerHTML = "<strong>Players:</strong><br>" +
    Object.values(players).map(p => p.name).join("<br>");
});
