// Tetris Game Engine
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        // 遊戲常數
        this.ROWS = 20;
        this.COLS = 10;
        this.BLOCK_SIZE = this.canvas.width / this.COLS;

        // 方塊定義
        this.PIECES = [
            { shape: [[1, 1, 1, 1]], color: '#00f0f0', name: 'I' },
            { shape: [[1, 1], [1, 1]], color: '#ffff00', name: 'O' },
            { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0', name: 'T' },
            { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0', name: 'J' },
            { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000', name: 'L' },
            { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000', name: 'S' },
            { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000', name: 'Z' }
        ];

        this.init();
    }

    init() {
        this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.dropCounter = 0;
        this.dropInterval = this.getDropInterval();

        this.currentPiece = this.randomPiece();
        this.nextPiece = this.randomPiece();
        this.currentX = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;

        this.lastTime = Date.now();
        this.draw();
    }

    randomPiece() {
        return JSON.parse(JSON.stringify(this.PIECES[Math.floor(Math.random() * this.PIECES.length)]));
    }

    getDropInterval() {
        return Math.max(100, 1000 - (this.level - 1) * 100);
    }

    isValidMove(piece, x, y) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return false;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    rotatePiece(piece) {
        const rotated = [];
        const n = piece.shape.length;
        const m = piece.shape[0].length;

        for (let col = 0; col < m; col++) {
            const newRow = [];
            for (let row = n - 1; row >= 0; row--) {
                newRow.push(piece.shape[row][col]);
            }
            rotated.push(newRow);
        }

        return { ...piece, shape: rotated };
    }

    rotate() {
        if (this.gameOver || this.isPaused) return;

        const rotated = this.rotatePiece(this.currentPiece);
        if (this.isValidMove(rotated, this.currentX, this.currentY)) {
            this.currentPiece = rotated;
        }
    }

    moveLeft() {
        if (this.gameOver || this.isPaused) return;
        if (this.isValidMove(this.currentPiece, this.currentX - 1, this.currentY)) {
            this.currentX--;
        }
    }

    moveRight() {
        if (this.gameOver || this.isPaused) return;
        if (this.isValidMove(this.currentPiece, this.currentX + 1, this.currentY)) {
            this.currentX++;
        }
    }

    moveDown() {
        if (this.gameOver || this.isPaused) return;
        if (this.isValidMove(this.currentPiece, this.currentX, this.currentY + 1)) {
            this.currentY++;
        } else {
            this.lockPiece();
        }
    }

    hardDrop() {
        if (this.gameOver || this.isPaused) return;
        while (this.isValidMove(this.currentPiece, this.currentX, this.currentY + 1)) {
            this.currentY++;
        }
        this.lockPiece();
    }

    lockPiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentX + col;
                    const y = this.currentY + row;

                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    } else {
                        this.gameOver = true;
                    }
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        this.currentX = Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentY = 0;

        if (!this.isValidMove(this.currentPiece, this.currentX, this.currentY)) {
            this.gameOver = true;
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                row++;
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = this.getDropInterval();
            this.updateUI();
        }
    }

    update(deltaTime) {
        if (this.gameOver || this.isPaused) return;

        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.moveDown();
            this.dropCounter = 0;
        }
    }

    draw() {
        // 清除遊戲板
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製網格
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 0.5;
        for (let row = 0; row <= this.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let col = 0; col <= this.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

        // 繪製已鎖定的方塊
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(col * this.BLOCK_SIZE + 1, row * this.BLOCK_SIZE + 1, 
                                     this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(col * this.BLOCK_SIZE + 1, row * this.BLOCK_SIZE + 1, 
                                       this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
                }
            }
        }

        // 繪製當前方塊
        this.drawPiece(this.currentPiece, this.currentX, this.currentY);

        // 繪製下一個方塊
        this.drawNextPiece();

        // 遊戲結束提示
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('遊戲結束', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`最終得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }

        // 暫停提示
        if (this.isPaused && !this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 40px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('已暫停', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    drawPiece(piece, x, y) {
        this.ctx.fillStyle = piece.color;
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const px = (x + col) * this.BLOCK_SIZE;
                    const py = (y + row) * this.BLOCK_SIZE;
                    this.ctx.fillRect(px + 1, py + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px + 1, py + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
                }
            }
        }
    }

    drawNextPiece() {
        const blockSize = 30;
        this.nextCtx.fillStyle = '#fff';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        const piece = this.nextPiece;
        const offsetX = (this.nextCanvas.width - piece.shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - piece.shape.length * blockSize) / 2;

        this.nextCtx.fillStyle = piece.color;
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize + 2,
                        offsetY + row * blockSize + 2,
                        blockSize - 4,
                        blockSize - 4
                    );
                }
            }
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    start() {
        if (this.gameOver) {
            this.init();
        }
        this.isPaused = false;
        this.gameLoop();
        this.updateButtons();
    }

    pause() {
        this.isPaused = !this.isPaused;
        this.updateButtons();
    }

    reset() {
        this.init();
        this.updateUI();
        this.updateButtons();
    }

    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.gameOver) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        } else {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
        }
    }

    gameLoop = () => {
        const now = Date.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(this.gameLoop);
        } else {
            this.updateButtons();
        }
    }
}

// 初始化遊戲
let game = new TetrisGame();

// UI 事件監聽
document.getElementById('startBtn').addEventListener('click', () => {
    game.start();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    game.pause();
    game.draw();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    game.reset();
});

// 鍵盤控制
document.addEventListener('keydown', (e) => {
    if (game.gameOver) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            game.moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            game.moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            game.moveDown();
            break;
        case 'ArrowUp':
            e.preventDefault();
            game.rotate();
            break;
        case ' ':
            e.preventDefault();
            game.hardDrop();
            break;
    }
    game.draw();
});

// 初始繪製
game.updateUI();
game.updateButtons();