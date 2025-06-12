let playerName = "";
let points = 0;
let lives = 3;
let currentLevel = 1;
let monster = { row: 4, col: 4 };
let obstacles = [];
let highlightedMoves = [];
let currentMoveType = "";
let gameTimer;
let timeLeft = 30;
let gameActive = false;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// Adjusted hex size to fit 10x10 grid on screen
const HEX_SIZE = 40;  // Increased from 30 to 40
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
const VERTICAL_SPACING = HEX_HEIGHT * 0.75;
const GRID_ROWS = 10;
const GRID_COLS = 10;
let goal = { row: 0, col: 9 };

// Calculate required canvas size based on hex grid
const CANVAS_WIDTH = HEX_WIDTH * GRID_COLS + HEX_SIZE;
const CANVAS_HEIGHT = VERTICAL_SPACING * GRID_ROWS + HEX_SIZE;

// Set canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Movement patterns
const MOVEMENT_TYPES = [
  "DIAGONAL", 
  "HORIZONTAL",
  "VERTICAL"
];

function showPlayerForm() {
  document.getElementById("homeScreen").classList.remove("visible");
  document.getElementById("playerNameForm").classList.add("visible");
}

function showInstructions() {
  document.getElementById("instructionsModal").style.display = 'block';
}

function startGame() {
  playerName = document.getElementById("playerNameInput").value || "Monster";
  document.getElementById("playerInfo").textContent = `Player: ${playerName}`;
  document.getElementById("playerNameForm").classList.remove("visible");
  document.getElementById("gamePage").classList.add("visible");
  resetGameState();
  initGame();
}

function resetGameState() {
  points = 0;
  lives = 3;
  currentLevel = 1;
  monster = { row: 4, col: 4 };
  timeLeft = 30;
  gameActive = true;
}

function initGame() {
  if (gameTimer) clearInterval(gameTimer);
  
  obstacles = [];
  highlightedMoves = [];
  
  // Set random movement type
  currentMoveType = MOVEMENT_TYPES[Math.floor(Math.random() * MOVEMENT_TYPES.length)];
  document.getElementById("moveTypeDisplay").textContent = `Movement: ${currentMoveType} (3 tiles)`;
  
  timeLeft = Math.max(15, 35 - currentLevel * 3);
  gameTimer = setInterval(updateTimer, 1000);
  
  // Place goal in top-right area
  goal = {
    row: Math.floor(Math.random() * 3),
    col: 7 + Math.floor(Math.random() * 3)
  };
  
  placeStrategicObstacles();
  redrawGame();
  updateUI();
}

function placeStrategicObstacles() {
  obstacles = [];
  const obstacleCount = 5 + currentLevel * 2;
  
  // Create path with obstacles
  let currentRow = monster.row;
  let currentCol = monster.col;
  
  // First move toward goal column
  while (currentCol < goal.col) {
    currentCol++;
    if (Math.random() < 0.4) {
      const obsRow = Math.max(0, Math.min(GRID_ROWS-1, 
        currentRow + (Math.random() < 0.5 ? 1 : -1)));
      obstacles.push({ row: obsRow, col: currentCol });
    }
  }
  
  // Then adjust row to reach goal
  while (currentRow !== goal.row) {
    if (currentRow < goal.row) currentRow++;
    else currentRow--;
    if (Math.random() < 0.4) {
      const obsCol = Math.max(0, Math.min(GRID_COLS-1, 
        currentCol + (Math.random() < 0.5 ? 1 : -1)));
      obstacles.push({ row: currentRow, col: obsCol });
    }
  }
  
  // Add remaining obstacles randomly
  for (let i = 0; i < obstacleCount; i++) {
    let randRow, randCol;
    do {
      randRow = Math.floor(Math.random() * GRID_ROWS);
      randCol = Math.floor(Math.random() * GRID_COLS);
    } while (
      (randRow === monster.row && randCol === monster.col) || 
      (randRow === goal.row && randCol === goal.col) ||
      obstacles.some(obs => obs.row === randRow && obs.col === randCol)
    );
    obstacles.push({ row: randRow, col: randCol });
  }
}

function updateUI() {
  document.getElementById("levelInfo").textContent = `Level: ${currentLevel}`;
  document.getElementById("pointBoard").textContent = `Points: ${points}`;
  document.getElementById("timerDisplay").textContent = `Time Left: ${timeLeft}s`;
  updateLivesDisplay();
}

function updateLivesDisplay() {
  const display = document.getElementById("livesDisplay");
  display.innerHTML = "Lives: ";
  for (let i = 0; i < lives; i++) {
    display.innerHTML += `<span class="heart">♥</span>`;
  }
}

function updateTimer() {
  timeLeft--;
  document.getElementById("timerDisplay").textContent = `Time Left: ${timeLeft}s`;
  
  if (timeLeft <= 0) {
    timeUp();
  }
}

function timeUp() {
  lives--;
  updateLivesDisplay();
  
  if (lives <= 0) {
    gameOver();
  } else {
    timeLeft = Math.max(15, 35 - currentLevel * 3);
    alert("Time's up! Lost a life. Try again!");
    initGame();
  }
}

function drawHexGrid() {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const x = col * HEX_WIDTH + HEX_SIZE;
      // Offset every other row for proper hex grid alignment
      const y = row * VERTICAL_SPACING + HEX_SIZE;
      drawHex(x, y, row, col);
    }
  }
}

function drawHex(x, y, row, col) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i;
    points.push({
      x: x + HEX_SIZE * Math.cos(angle),
      y: y + HEX_SIZE * Math.sin(angle)
    });
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();

  // Enhanced hexagon styling
  const isHighlighted = highlightedMoves.some(m => m.row === row && m.col === col);
  
  if (isHighlighted) {
    // Highlighted move hexagons (keep existing green glow)
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, HEX_SIZE / 2);
    gradient.addColorStop(0, "rgba(0,255,0,0.8)");
    gradient.addColorStop(1, "rgba(0,100,0,0.3)");
    ctx.fillStyle = gradient;
  } else {
    // Regular hexagon styling - more visible colors
    const hue = (row * 10 + col * 5) % 360;
    const saturation = 15;
    const lightness = row % 2 ? 15 : 18; // More contrast between rows
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  ctx.fill();
  
  // Brighter borders with subtle glow
  ctx.strokeStyle = isHighlighted ? "#66ff66" : "#555";
  ctx.lineWidth = 2;
  
  // Add glow effect to borders
  ctx.shadowColor = isHighlighted ? "rgba(102,255,102,0.7)" : "rgba(255,255,255,0.15)";
  ctx.shadowBlur = 5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Add subtle highlight to top edges
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.lineTo(points[2].x, points[2].y);
  ctx.closePath();
  ctx.fillStyle = isHighlighted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)";
  ctx.fill();

  // Add coordinate labels for debugging (optional)
  if (currentLevel === 1) {
    ctx.fillStyle = "#777";
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${col},${row}`, x, y + 4);
  }
}

function drawMonster(x, y) {
  // Monster body with pulsing effect
  const pulse = 0.95 + Math.sin(Date.now()/300)*0.05;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  
  // Body
  ctx.beginPath();
  ctx.arc(0, 0, HEX_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#8a2be2";
  ctx.fill();
  
  // Eyes
  ctx.beginPath();
  ctx.arc(-10, -8, 6, 0, Math.PI * 2);
  ctx.arc(10, -8, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#00ffff";
  ctx.fill();
  
  // Mouth
  ctx.beginPath();
  ctx.arc(0, 8, 8, 0, Math.PI, false);
  ctx.strokeStyle = "#ff3366";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.restore();
}

function drawGoal(x, y) {
  // Glowing portal effect
  const gradient = ctx.createRadialGradient(x, y, 5, x, y, HEX_SIZE / 2);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.5, "#00ffff");
  gradient.addColorStop(1, "rgba(0,255,255,0)");
  
  ctx.beginPath();
  ctx.arc(x, y, HEX_SIZE / 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Portal glow effect
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x, y, HEX_SIZE / 2 + i * 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,255,${0.3 - i * 0.1})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawObstacle(x, y) {
  // Spiky trap with glowing effect
  ctx.beginPath();
  ctx.arc(x, y, HEX_SIZE / 3, 0, Math.PI * 2);
  ctx.fillStyle = "#ff3333";
  ctx.fill();
  
  // Spikes
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i;
    const spikeLength = HEX_SIZE / 2;
    
    ctx.beginPath();
    ctx.moveTo(
      x + (HEX_SIZE / 3) * Math.cos(angle),
      y + (HEX_SIZE / 3) * Math.sin(angle)
    );
    ctx.lineTo(
      x + spikeLength * Math.cos(angle),
      y + spikeLength * Math.sin(angle)
    );
    ctx.strokeStyle = "#ff6666";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  // Inner glow with pulse effect
  const pulse = 0.9 + Math.sin(Date.now()/200)*0.1;
  ctx.beginPath();
  ctx.arc(x, y, HEX_SIZE / 4 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,100,100,0.5)";
  ctx.fill();
}

function drawBackground() {
  // Dark gradient background
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0a0a0a");
  gradient.addColorStop(1, "#1a1a1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Subtle grid pattern in background
  ctx.strokeStyle = "rgba(40,40,40,0.2)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function handleCanvasClick(e) {
  if (!gameActive) return;
  
  const mouseX = e.offsetX;
  const mouseY = e.offsetY;
  const monsterX = monster.col * HEX_WIDTH + HEX_SIZE;
  const monsterY = monster.row * VERTICAL_SPACING + HEX_SIZE;
  const distanceToMonster = Math.sqrt((mouseX - monsterX) ** 2 + (mouseY - monsterY) ** 2);
  
  if (distanceToMonster <= HEX_SIZE / 2) {
    // Show possible moves for current movement type
    highlightedMoves = getPossibleMoves();
    redrawGame();
    return;
  }
  
  // Check if clicked on a highlighted move
  for (const move of highlightedMoves) {
    const moveX = move.col * HEX_WIDTH + HEX_SIZE;
    const moveY = move.row * VERTICAL_SPACING + HEX_SIZE;
    const distanceToMove = Math.sqrt((mouseX - moveX) ** 2 + (mouseY - moveY) ** 2);
    
    if (distanceToMove <= HEX_SIZE / 2) {
      // Move the monster
      monster.row = move.row;
      monster.col = move.col;
      
      // Check if landed on obstacle
      const isObstacle = obstacles.some(obs => 
        obs.row === monster.row && obs.col === monster.col
      );
      
      // Check if landed on goal
      const isGoal = monster.row === goal.row && monster.col === goal.col;
      
      if (isObstacle) {
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
          gameOver();
        } else {
          alert("You hit a deadly trap! Lost a life.");
          initGame(); // Reset current level
        }
      } else if (isGoal) {
        levelComplete();
      } else {
        // Normal move - set new random movement type
        currentMoveType = MOVEMENT_TYPES[Math.floor(Math.random() * MOVEMENT_TYPES.length)];
        document.getElementById("moveTypeDisplay").textContent = `Movement: ${currentMoveType} (3 tiles)`;
        highlightedMoves = [];
        redrawGame();
      }
      return;
    }
  }
  
  // Clicked somewhere else - clear highlights
  highlightedMoves = [];
  redrawGame();
}

function getPossibleMoves() {
  let moves = [];
  
  if (currentMoveType === "DIAGONAL") {
    const directions = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ];
    
    for (const dir of directions) {
      for (let step = 1; step <= 3; step++) {
        const newRow = monster.row + dir.dr * step;
        const newCol = monster.col + dir.dc * step;
        
        if (newRow >= 0 && newRow < GRID_ROWS && newCol >= 0 && newCol < GRID_COLS) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
  } 
  else if (currentMoveType === "HORIZONTAL") {
    for (let step = 1; step <= 3; step++) {
      if (monster.col - step >= 0) {
        moves.push({ row: monster.row, col: monster.col - step });
      }
      if (monster.col + step < GRID_COLS) {
        moves.push({ row: monster.row, col: monster.col + step });
      }
    }
  } 
  else { // VERTICAL
    for (let step = 1; step <= 3; step++) {
      if (monster.row - step >= 0) {
        moves.push({ row: monster.row - step, col: monster.col });
      }
      if (monster.row + step < GRID_ROWS) {
        moves.push({ row: monster.row + step, col: monster.col });
      }
    }
  }
  
  return moves;
}

function redrawGame() {
  drawBackground();
  drawHexGrid();
  
  // Draw obstacles
  for (const obs of obstacles) {
    drawObstacle(obs.col * HEX_WIDTH + HEX_SIZE, obs.row * VERTICAL_SPACING + HEX_SIZE);
  }
  
  // Draw highlighted moves (ALL green, including obstacles)
  for (const move of highlightedMoves) {
    const x = move.col * HEX_WIDTH + HEX_SIZE;
    const y = move.row * VERTICAL_SPACING + HEX_SIZE;
    
    // Glowing effect for highlighted tiles
    const gradient = ctx.createRadialGradient(x, y, 5, x, y, HEX_SIZE / 2);
    gradient.addColorStop(0, "rgba(0,255,0,0.8)");
    gradient.addColorStop(1, "rgba(0,100,0,0.3)");
    
    ctx.beginPath();
    ctx.arc(x, y, HEX_SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
    
    // Pulsing border effect
    ctx.beginPath();
    ctx.arc(x, y, HEX_SIZE / 2 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,255,0,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Draw goal
  drawGoal(goal.col * HEX_WIDTH + HEX_SIZE, goal.row * VERTICAL_SPACING + HEX_SIZE);
  
  // Draw monster
  drawMonster(monster.col * HEX_WIDTH + HEX_SIZE, monster.row * VERTICAL_SPACING + HEX_SIZE);
}

function levelComplete() {
  clearInterval(gameTimer);
  points += 100 * currentLevel;
  currentLevel++;
  
  if (currentLevel <= 10) {
    alert(`Level ${currentLevel-1} Complete! Starting level ${currentLevel}`);
    initGame();
  } else {
    gameOver(true);
  }
}

function gameOver(victory = false) {
  gameActive = false;
  clearInterval(gameTimer);
  
  if (victory) {
    document.getElementById("gameOverScreen").innerHTML = `
      <h2>VICTORY!</h2>
      <p>You conquered all levels!</p>
      <p id="finalScore">Final Score: ${points}</p>
      <button onclick="resetGame()">PLAY AGAIN</button>
    `;
  } else {
    document.getElementById("finalScore").textContent = `Final Score: ${points}`;
  }
  
  document.getElementById("gameOverScreen").style.display = 'block';
}

function resetGame() {
  document.getElementById("gameOverScreen").style.display = 'none';
  resetGameState();
  initGame();
}

// Make hex buttons visible when page loads
window.onload = function() {
  const hexBtns = document.querySelectorAll('.hex-btn');
  setTimeout(() => {
    hexBtns.forEach((btn, index) => {
      setTimeout(() => {
        btn.style.transform = 'rotateY(0deg)';
        btn.style.opacity = '1';
      }, index * 100);
    });
  }, 500);
};

canvas.addEventListener("click", handleCanvasClick);
