// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;

// Paddle
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 7,
    dx: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 4,
    dx: 4,
    dy: -4
};

// Bricks
const brickConfig = {
    rowCount: 5,
    columnCount: 9,
    width: 75,
    height: 20,
    padding: 10,
    offsetTop: 60,
    offsetLeft: 35
};

let bricks = [];

// Colors for different brick rows
const brickColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

// Initialize bricks
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickConfig.columnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickConfig.rowCount; r++) {
            bricks[c][r] = {
                x: c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft,
                y: r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop,
                status: 1,
                color: brickColors[r % brickColors.length]
            };
        }
    }
}

// Draw paddle
function drawPaddle() {
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#34495E');
    gradient.addColorStop(1, '#2C3E50');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Add border
    ctx.strokeStyle = '#1A252F';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Draw ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#E74C3C';
    ctx.fill();

    // Add shine effect
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    ctx.closePath();
}

// Draw bricks
function drawBricks() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brick = bricks[c][r];

                // Draw brick with gradient
                const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brickConfig.height);
                gradient.addColorStop(0, brick.color);
                gradient.addColorStop(1, shadeColor(brick.color, -20));

                ctx.fillStyle = gradient;
                ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Add border
                ctx.strokeStyle = shadeColor(brick.color, -40);
                ctx.lineWidth = 2;
                ctx.strokeRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Add highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height / 3);
            }
        }
    }
}

// Helper function to shade colors
function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// Draw score and info
function drawInfo() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;

    // Wall detection
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collision (left and right)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx *= -1;
    }

    // Wall collision (top)
    if (ball.y - ball.radius < 0) {
        ball.dy *= -1;
    }

    // Paddle collision
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {

        // Calculate hit position on paddle (-1 to 1)
        const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);

        // Adjust ball angle based on where it hit the paddle
        ball.dx = hitPos * 5;
        ball.dy = -Math.abs(ball.dy);

        // Ensure minimum vertical speed
        if (Math.abs(ball.dy) < 3) {
            ball.dy = ball.dy < 0 ? -3 : 3;
        }
    }

    // Bottom wall - lose life
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        if (lives > 0) {
            resetBall();
        } else {
            gameOver();
        }
    }
}

// Brick collision detection
function brickCollision() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brickConfig.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brickConfig.height) {

                    ball.dy *= -1;
                    brick.status = 0;
                    score += 10;

                    // Check if all bricks are destroyed
                    if (checkLevelComplete()) {
                        nextLevel();
                    }
                }
            }
        }
    }
}

// Check if level is complete
function checkLevelComplete() {
    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// Next level
function nextLevel() {
    level++;
    ball.speed += 0.5;
    initBricks();
    resetBall();

    // Show level message
    gamePaused = true;
    setTimeout(() => {
        gamePaused = false;
    }, 2000);
}

// Reset ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = -ball.speed;
}

// Game over
function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '24px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 70);
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw game elements
    drawBricks();
    drawPaddle();
    drawBall();
    drawInfo();

    // Show pause message
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${level}!`, canvas.width / 2, canvas.height / 2);
    }
}

// Update game
function update() {
    if (gameRunning && !gamePaused) {
        movePaddle();
        moveBall();
        brickCollision();
    }

    draw();

    if (gameRunning) {
        requestAnimationFrame(update);
    }
}

// Keyboard controls
function keyDown(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a') {
        paddle.dx = -paddle.speed;
    }
}

function keyUp(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' ||
        e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a') {
        paddle.dx = 0;
    }
}

// Button controls
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        update();
    }
}

function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? 'Resume' : 'Pause';
    }
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    lives = 3;
    level = 1;
    ball.speed = 4;

    paddle.x = canvas.width / 2 - 50;
    resetBall();
    initBricks();
    draw();

    document.getElementById('pauseBtn').textContent = 'Pause';
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Initialize game
initBricks();
draw();
