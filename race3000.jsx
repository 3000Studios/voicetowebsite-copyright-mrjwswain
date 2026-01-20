import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Volume2, VolumeX, Play, RotateCcw, Trophy } from "lucide-react";

const GRID_WIDTH = 9;
const GRID_HEIGHT = 15;
const PIECES = ["🎮", "🧹", "🧽", "🔌", "📱", "💊", "💅", "💻", "🚚", "🔊"];
const PLAYERS = [
  { name: "Jerica", code: "daughter", color: "#FF1493" },
  { name: "Jadon", code: "son", color: "#00BFFF" },
  { name: "Mom", code: "mom", color: "#9370DB" },
  { name: "Dad", code: "dad", color: "#32CD32" },
];
const TURNS_PER_PLAYER = 20;
const WIN_SCORE = 3000;
const MESSAGE_BANK = {
  3: "Good job",
  4: "Way to go",
  5: "Excellent work",
  6: "AMAZING",
  7: "SPECTACULAR",
  8: "PHENOMENAL",
  9: "LEGENDARY",
  10: "UNBELIEVABLE",
};

const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const buildGrid = () => {
  const matrix = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    const row = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      row.push(PIECES[Math.floor(Math.random() * PIECES.length)]);
    }
    matrix.push(row);
  }
  return matrix;
};

const findMatches = (grid) => {
  const matches = new Set();
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH - 2; x++) {
      if (grid[y][x] && grid[y][x] === grid[y][x + 1] && grid[y][x] === grid[y][x + 2]) {
        let run = 3;
        matches.add(`${x},${y}`);
        matches.add(`${x + 1},${y}`);
        matches.add(`${x + 2},${y}`);
        while (x + run < GRID_WIDTH && grid[y][x] === grid[y][x + run]) {
          matches.add(`${x + run},${y}`);
          run++;
        }
      }
    }
  }
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT - 2; y++) {
      if (grid[y][x] && grid[y + 1][x] === grid[y][x] && grid[y + 2][x] === grid[y][x]) {
        let run = 3;
        matches.add(`${x},${y}`);
        matches.add(`${x},${y + 1}`);
        matches.add(`${x},${y + 2}`);
        while (y + run < GRID_HEIGHT && grid[y + run][x] === grid[y][x]) {
          matches.add(`${x},${y + run}`);
          run++;
        }
      }
    }
  }
  return Array.from(matches).map((match) => {
    const [x, y] = match.split(",").map(Number);
    return { x, y };
  });
};

const removeMatches = (grid, matches) => {
  const matrix = grid.map((row) => [...row]);
  matches.forEach(({ x, y }) => {
    matrix[y][x] = null;
  });
  return matrix;
};

const applyGravity = (grid) => {
  const matrix = grid.map((row) => [...row]);
  for (let x = 0; x < GRID_WIDTH; x++) {
    let write = GRID_HEIGHT - 1;
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (matrix[y][x] !== null) {
        matrix[write][x] = matrix[y][x];
        if (write !== y) matrix[y][x] = null;
        write--;
      }
    }
    for (let y = write; y >= 0; y--) {
      matrix[y][x] = PIECES[Math.floor(Math.random() * PIECES.length)];
    }
  }
  return matrix;
};

const playTone = (audioRef, freq, duration = 0.2, type = "sine", enabled = true) => {
  if (!enabled) return;
  try {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn(error);
  }
};

const startGrid = buildGrid();

const RaceTo3000 = () => {
  const [grid, setGrid] = useState(startGrid);
  const [selected, setSelected] = useState(null);
  const [player, setPlayer] = useState(null);
  const [turns, setTurns] = useState(TURNS_PER_PLAYER);
  const [scores, setScores] = useState(() => {
    const baseline = {};
    PLAYERS.forEach((profile) => {
      baseline[profile.name] = 0;
    });
    return baseline;
  });
  const [messages, setMessages] = useState(["Welcome back to Race 3000."]);
  const [combo, setCombo] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [codeInput, setCodeInput] = useState("");
  const [status, setStatus] = useState("Locked");
  const [confetti, setConfetti] = useState([]);
  const audioRef = useRef(null);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (!player) {
      setGrid(buildGrid());
    }
  }, [player]);

  useEffect(() => {
    if (turns <= 0 && player) {
      finishTurn();
    }
  }, [turns]);

  useEffect(() => {
    const handle = setInterval(() => setBgIndex((prev) => (prev + 1) % 6), 4500);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    if (!combo) return;
    const timer = setTimeout(() => setCombo(null), 1600);
    return () => clearTimeout(timer);
  }, [combo]);

  const addMessage = (text) => {
    setMessages((prev) => [...prev.slice(-5), text]);
  };

  const updateScore = (name, points) => {
    setScores((prev) => {
      const next = { ...prev };
      PLAYERS.forEach((profile) => {
        if (profile.name === name) next[profile.name] = (next[profile.name] || 0) + points;
        else next[profile.name] = Math.max(0, (next[profile.name] || 0) - Math.floor(points / 4));
      });
      return next;
    });
  };

  const processMatches = (matrix) => {
    const matches = findMatches(matrix);
    if (!matches.length) {
      setSelected(null);
      setGrid(matrix);
      return;
    }
    const nextGrid = applyGravity(removeMatches(matrix, matches));
    const messageLabel = MESSAGE_BANK[Math.min(matches.length, 10)];
    setCombo(messageLabel);
    addMessage(`${player?.name || "Player"} ${messageLabel.toUpperCase()}!`);
    updateScore(player?.name || "Player", matches.length * 50);
    playTone(audioRef, 420 + matches.length * 40, 0.25, "sine", soundEnabled);
    setGrid(nextGrid);
    setTimeout(() => processMatches(nextGrid), 400);
  };

  const onCellClick = (x, y) => {
    if (!player || turns <= 0) return;
    if (!selected) {
      setSelected({ x, y });
      return;
    }
    const dx = Math.abs(selected.x - x);
    const dy = Math.abs(selected.y - y);
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      const nextGrid = grid.map((row) => [...row]);
      const temp = nextGrid[y][x];
      nextGrid[y][x] = nextGrid[selected.y][selected.x];
      nextGrid[selected.y][selected.x] = temp;
      setGrid(nextGrid);
      setTurns((prev) => Math.max(prev - 1, 0));
      addMessage(`${player.name} executed a swap.`);
      setTimeout(() => processMatches(nextGrid), 150);
    } else {
      setSelected({ x, y });
    }
  };

  const finishTurn = () => {
    const winner = Object.entries(scores).find(([, score]) => score >= WIN_SCORE);
    if (winner) {
      setConfetti(
        Array.from({ length: 120 }, () => ({
          id: randomId(),
          x: Math.random() * window.innerWidth,
          y: -20,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 2 + 1,
          color: `hsl(${Math.random() * 360},100%,60%)`,
        }))
      );
      setStatus(`${winner[0]} WINS!`);
      addMessage(`${winner[0]} breached ${WIN_SCORE}!`);
      return;
    }
    setStatus("Locked");
    setPlayer(null);
    setSelected(null);
    setTurns(TURNS_PER_PLAYER);
    setCombo(null);
  };

  const handleLogin = () => {
    const code = codeInput.trim().toLowerCase();
    const match = PLAYERS.find((profile) => profile.code === code);
    if (!match) {
      addMessage("Access denied.");
      playTone(audioRef, 220, 0.35, "square", soundEnabled);
      return;
    }
    setPlayer(match);
    setStatus("Online");
    setTurns(TURNS_PER_PLAYER);
    setGrid(buildGrid());
    addMessage(`${match.name} unlocked the console.`);
    playTone(audioRef, 520, 0.2, "sine", soundEnabled);
  };

  const renderLogin = () => (
    <div
      className="login-shell"
      style={{
        background: `linear-gradient(145deg, #000, #05050f ${bgIndex * 2}%)`,
      }}
    >
      {confetti.map((particle) => (
        <span
          key={particle.id}
          style={{
            position: "fixed",
            top: particle.y,
            left: particle.x,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: particle.color,
            pointerEvents: "none",
          }}
        />
      ))}
      <div className="login-card">
        <h1>Race to 3000</h1>
        <div className="player-grid">
          {PLAYERS.map((profile) => (
            <div
              key={profile.code}
              className={`player-card ${player?.name === profile.name ? "active" : ""}`}
              style={{ borderColor: profile.color }}
            >
              <h3 style={{ color: profile.color }}>{profile.name}</h3>
              <span>{scores[profile.name] || 0}</span>
            </div>
          ))}
        </div>
        <input
          type="password"
          placeholder="Enter code (daughter / son / mom / dad)"
          value={codeInput}
          onChange={(event) => setCodeInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleLogin()}
        />
        <div className="action-row">
          <button className="primary-action" type="button" onClick={handleLogin}>
            START TURN
          </button>
        </div>
      </div>
    </div>
  );

  const renderGame = () => (
    <div className="game-shell">
      {combo && (
        <div className="combo-toast">
          {combo}
        </div>
      )}
      <div className="dashboard-panel">
        <div>
          <strong>{player?.name || "Player"}'s Turn</strong>
          <p>Turns remaining: {turns}</p>
        </div>
        <div className="controls">
          <div className="control-dot" onClick={() => setSoundEnabled((prev) => !prev)}>
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </div>
          <div className="control-dot" onClick={() => setTurns((prev) => Math.max(prev - 1, 0))}>
            <Play size={18} />
          </div>
          <div className="control-dot" onClick={() => setGrid(buildGrid())}>
            <RotateCcw size={18} />
          </div>
        </div>
      </div>
      <div className="player-grid">
        {PLAYERS.map((profile) => (
          <div
            key={profile.code}
            className={`player-card ${player?.name === profile.name ? "active" : ""}`}
            style={{ borderColor: profile.color }}
          >
            <h3 style={{ color: profile.color }}>{profile.name}</h3>
            <span>{scores[profile.name] || 0}</span>
          </div>
        ))}
      </div>
      <div className="grid-stage">
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={`grid-cell ${selected?.x === x && selected?.y === y ? "active" : ""}`}
              onClick={() => onCellClick(x, y)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
      <div className="message-panel">
        <h2>Session chatter</h2>
        <div className="message-history">
          {messages.map((msg, index) => (
            <div key={`${msg}-${index}`} className="message-entry">
              {msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (status.includes("WINS")) {
    return (
      <div className="game-shell">
        <div className="combo-toast" style={{ color: "#ffe600" }}>
          {status}
        </div>
        <Trophy size={140} color="#ffd700" />
      </div>
    );
  }

  return player ? renderGame() : renderLogin();
};

createRoot(document.getElementById("race-root")).render(<RaceTo3000 />);
