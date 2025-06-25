const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public")); // Serve HTML/CSS/JS

let players = {};
let currentQuestion = null;
let correctAnswer = "";
let gameInProgress = false;
let currentRound = 0;
const MAX_ROUNDS = 10;

// Helper: shuffle array
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Fetch trivia question
async function fetchQuestion() {
  try {
    const res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
    const data = await res.json();
    const q = data.results[0];
    correctAnswer = q.correct_answer;
    currentQuestion = {
      question: q.question,
      options: shuffle([...q.incorrect_answers, correctAnswer]),
    };

    io.emit("question", currentQuestion);
    io.emit("round", currentRound + 1);

  } catch (error) {
    console.error("Failed to fetch question:", error);
  }
}

// Declare winner
function declareWinner() {
  gameInProgress = false;
  currentQuestion = null;
  correctAnswer = "";

  const winner = Object.entries(players).reduce((top, [id, p]) =>
    !top || p.score > top.score ? { id, ...p } : top, null
  );

  if (winner) {
    io.emit("winner", { name: winner.name, score: winner.score });
  }

  // Reset scores
  for (const id in players) {
    players[id].score = 0;
  }
}

// Get player name
function getNameFromSocket(socket) {
  return socket.handshake.query.name || "Anonymous";
}

// Handle connections
io.on("connection", (socket) => {
  const name = getNameFromSocket(socket);
  console.log(`✅ Player connected: ${name} (${socket.id})`);
  players[socket.id] = { score: 0, name };

  io.emit("players", players);

  if (!gameInProgress || !currentQuestion) {
    gameInProgress = true;
    currentRound = 0;
    fetchQuestion();
  } else {
    socket.emit("question", currentQuestion);
    socket.emit("round", currentRound + 1);
  }

  socket.on("answer", (data) => {
    if (data.answer === correctAnswer) {
      players[socket.id].score++;
    }

    currentRound++;

    io.emit("players", players);

    if (currentRound >= MAX_ROUNDS) {
      declareWinner();
    } else {
      fetchQuestion();
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${players[socket.id]?.name || 'Player'} disconnected`);
    delete players[socket.id];
    io.emit("players", players);
  });
});

server.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
