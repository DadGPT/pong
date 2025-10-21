// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let level = 1;

// Particle system
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.015;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Ball trail
let ballTrail = [];
const maxTrailLength = 15;

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

// Snake
const snakeConfig = {
    gridSize: 20,
    speed: 150 // milliseconds per move
};

let snake = {
    segments: [
        { x: 5, y: 25 },
        { x: 4, y: 25 },
        { x: 3, y: 25 }
    ],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 }
};

let lastSnakeMove = 0;

// Initialize snake
function initSnake() {
    // Start snake in bottom-left area, away from bricks and paddle
    snake.segments = [
        { x: 5, y: 25 },
        { x: 4, y: 25 },
        { x: 3, y: 25 }
    ];
    snake.direction = { x: 1, y: 0 };
    snake.nextDirection = { x: 1, y: 0 };
}

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

// Colors for different brick rows (dark mode neon colors)
const brickColors = ['#ff0080', '#00d4ff', '#9000ff', '#00ff88', '#ff8800'];

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
    ctx.save();

    // Neon glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00d4ff';

    // Gradient effect
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#0080ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Border with glow
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

    ctx.restore();
}

// Draw ball
function drawBall() {
    // Add to trail
    ballTrail.push({ x: ball.x, y: ball.y });
    if (ballTrail.length > maxTrailLength) {
        ballTrail.shift();
    }

    // Draw trail
    ctx.save();
    ballTrail.forEach((pos, index) => {
        const alpha = index / ballTrail.length;
        ctx.globalAlpha = alpha * 0.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0080';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ball.radius * alpha, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0080';
        ctx.fill();
    });
    ctx.restore();

    // Draw main ball with glow
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#ff0080';

    // Gradient ball
    const gradient = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#ffaacc');
    gradient.addColorStop(1, '#ff0080');

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Shine effect
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    ctx.restore();
}

// Draw snake
function drawSnake() {
    ctx.save();

    snake.segments.forEach((segment, index) => {
        const x = segment.x * snakeConfig.gridSize;
        const y = segment.y * snakeConfig.gridSize;
        const size = snakeConfig.gridSize - 2;

        // Animated glow
        const glowIntensity = 15 + Math.sin(Date.now() / 200) * 10;
        ctx.shadowBlur = glowIntensity;

        if (index === 0) {
            // Head is brighter with stronger glow
            ctx.shadowColor = '#00ff88';
            const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#00cc66');
            ctx.fillStyle = gradient;
        } else {
            // Body segments
            ctx.shadowColor = '#00ff88';
            ctx.fillStyle = '#00dd77';
        }

        ctx.fillRect(x, y, size, size);

        // Prominent glowing border
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, size, size);

        // Add glowing eye dots on head
        if (index === 0) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffffff';
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(x + 4, y + 4, 4, 4);
            ctx.fillRect(x + 11, y + 4, 4, 4);
        }
    });

    ctx.restore();
}

// Draw bricks
function drawBricks() {
    ctx.save();

    for (let c = 0; c < brickConfig.columnCount; c++) {
        for (let r = 0; r < brickConfig.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brick = bricks[c][r];

                // Animated glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = brick.color;

                // Draw brick with gradient
                const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x + brickConfig.width, brick.y + brickConfig.height);
                gradient.addColorStop(0, brick.color);
                gradient.addColorStop(1, shadeColor(brick.color, -30));

                ctx.fillStyle = gradient;
                ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Glowing border
                ctx.shadowBlur = 8;
                ctx.strokeStyle = brick.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(brick.x, brick.y, brickConfig.width, brickConfig.height);

                // Add highlight
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(brick.x, brick.y, brickConfig.width, brickConfig.height / 3);
            }
        }
    }

    ctx.restore();
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

// Move snake
function moveSnake(currentTime) {
    // Initialize lastSnakeMove if this is the first move
    if (lastSnakeMove === 0) {
        lastSnakeMove = currentTime;
        return;
    }

    if (currentTime - lastSnakeMove < snakeConfig.speed) {
        return;
    }
    lastSnakeMove = currentTime;

    // Update direction
    snake.direction = { ...snake.nextDirection };

    // Calculate new head position
    const head = snake.segments[0];
    const newHead = {
        x: head.x + snake.direction.x,
        y: head.y + snake.direction.y
    };

    // Wrap around walls
    if (newHead.x < 0) newHead.x = Math.floor(canvas.width / snakeConfig.gridSize) - 1;
    if (newHead.x >= Math.floor(canvas.width / snakeConfig.gridSize)) newHead.x = 0;
    if (newHead.y < 0) newHead.y = Math.floor(canvas.height / snakeConfig.gridSize) - 1;
    if (newHead.y >= Math.floor(canvas.height / snakeConfig.gridSize)) newHead.y = 0;

    // Add new head
    snake.segments.unshift(newHead);

    // Remove tail (don't grow)
    snake.segments.pop();
}

// Check if snake ate the ball
function checkSnakeEatsBall() {
    const head = snake.segments[0];
    const headCenterX = head.x * snakeConfig.gridSize + snakeConfig.gridSize / 2;
    const headCenterY = head.y * snakeConfig.gridSize + snakeConfig.gridSize / 2;

    const distance = Math.sqrt(
        Math.pow(ball.x - headCenterX, 2) +
        Math.pow(ball.y - headCenterY, 2)
    );

    // If snake head is close enough to ball center
    if (distance < ball.radius + snakeConfig.gridSize / 2) {
        // Win the level!
        nextLevel();
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

                    // Create particle explosion
                    const centerX = brick.x + brickConfig.width / 2;
                    const centerY = brick.y + brickConfig.height / 2;
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(centerX, centerY, brick.color));
                    }

                    // Animate score update
                    animateScoreUpdate();

                    // Check if all bricks are destroyed
                    if (checkLevelComplete()) {
                        nextLevel();
                    }
                }
            }
        }
    }
}

// Animate score update
function animateScoreUpdate() {
    const scoreElement = document.getElementById('score').parentElement.querySelector('span');
    scoreElement.style.animation = 'none';
    setTimeout(() => {
        scoreElement.style.animation = 'scoreUpdate 0.5s ease';
    }, 10);
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

    // Create dramatic particle burst
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle(
            canvas.width / 2,
            canvas.height / 2,
            ['#ff0080', '#00d4ff', '#9000ff', '#00ff88'][Math.floor(Math.random() * 4)]
        ));
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Game Over text with glow
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ff0080';
    ctx.fillStyle = '#ff0080';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);

    // Score with different color
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00d4ff';
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

    // Instructions
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ff88';
    ctx.fillStyle = '#00ff88';
    ctx.font = '20px Arial';
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 80);
    ctx.restore();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw game elements
    drawBricks();
    drawPaddle();
    drawBall();
    drawSnake();
    drawInfo();

    // Show pause message with neon styling
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00d4ff';
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${level}!`, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }
}

// Update game
function update(currentTime = 0) {
    if (gameRunning && !gamePaused) {
        movePaddle();
        moveBall();
        moveSnake(currentTime);
        brickCollision();
        checkSnakeEatsBall();
    }

    draw();

    if (gameRunning) {
        requestAnimationFrame(update);
    }
}

// Helper function to rotate snake direction
function rotateSnakeClockwise() {
    const current = snake.nextDirection;
    // Right → Down → Left → Up → Right
    if (current.x === 1 && current.y === 0) {
        snake.nextDirection = { x: 0, y: 1 };  // Right to Down
    } else if (current.x === 0 && current.y === 1) {
        snake.nextDirection = { x: -1, y: 0 }; // Down to Left
    } else if (current.x === -1 && current.y === 0) {
        snake.nextDirection = { x: 0, y: -1 }; // Left to Up
    } else if (current.x === 0 && current.y === -1) {
        snake.nextDirection = { x: 1, y: 0 };  // Up to Right
    }
}

function rotateSnakeCounterClockwise() {
    const current = snake.nextDirection;
    // Right → Up → Left → Down → Right
    if (current.x === 1 && current.y === 0) {
        snake.nextDirection = { x: 0, y: -1 }; // Right to Up
    } else if (current.x === 0 && current.y === -1) {
        snake.nextDirection = { x: -1, y: 0 }; // Up to Left
    } else if (current.x === -1 && current.y === 0) {
        snake.nextDirection = { x: 0, y: 1 };  // Left to Down
    } else if (current.x === 0 && current.y === 1) {
        snake.nextDirection = { x: 1, y: 0 };  // Down to Right
    }
}

// Keyboard controls
function keyDown(e) {
    // Paddle controls (arrows only)
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        paddle.dx = -paddle.speed;
    }

    // Snake rotation controls
    // Spacebar = rotate clockwise
    // Z = rotate counter-clockwise
    if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        rotateSnakeClockwise();
    } else if (e.key === 'z' || e.key === 'Z') {
        rotateSnakeCounterClockwise();
    }
}

function keyUp(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight' ||
        e.key === 'Left' || e.key === 'ArrowLeft') {
        paddle.dx = 0;
    }
}

// Button controls
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);

function startGame() {
    if (!gameRunning) {
        // If game ended (no lives left), reset first
        if (lives <= 0) {
            resetGame();
        }
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
    initSnake();
    lastSnakeMove = 0;

    // Clear particles and trail
    particles = [];
    ballTrail = [];

    draw();

    document.getElementById('pauseBtn').textContent = 'Pause';
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Initialize game
initBricks();
draw();
