import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { ParticleSystem } from './ParticleSystem.js';
import { SoundSystem } from './SoundSystem.js';
import { Storage } from './Storage.js';
import { TetrisAI } from './TetrisAI.js';
import { POINTS, LEVEL_SPEEDS, CELL_SIZE, PREVIEW_CELL_SIZE, COLORS } from './constants.js';

export class Game {
    constructor() {
        this.board = new Board(document.getElementById('gameCanvas'));
        this.setupCanvases();
        
        this.particleSystem = new ParticleSystem();
        this.soundSystem = new SoundSystem();
        this.storage = new Storage();
        this.ai = new TetrisAI(this);
        
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropCounter = 0;
        this.dropInterval = LEVEL_SPEEDS[0];
        this.lastTime = 0;
        
        this.combo = 0;
        this.lastClearTime = 0;
        
        this.startTime = Date.now();
        this.pieceCount = 0;
        this.actionCount = 0;
        
        this.gameState = 'playing';
        this.keys = {};
        this.keyTimers = {};
        
        this.ghostEnabled = true;
        
        this.init();
    }

    setupCanvases() {
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.nextCanvas.width = PREVIEW_CELL_SIZE * 6;
        this.nextCanvas.height = PREVIEW_CELL_SIZE * 4;
        
        this.nextCanvas2 = document.getElementById('nextCanvas2');
        this.nextCtx2 = this.nextCanvas2.getContext('2d');
        this.nextCanvas2.width = PREVIEW_CELL_SIZE * 5;
        this.nextCanvas2.height = PREVIEW_CELL_SIZE * 3;
        
        this.nextCanvas3 = document.getElementById('nextCanvas3');
        this.nextCtx3 = this.nextCanvas3.getContext('2d');
        this.nextCanvas3.width = PREVIEW_CELL_SIZE * 5;
        this.nextCanvas3.height = PREVIEW_CELL_SIZE * 3;
        
        this.holdCanvas = document.getElementById('holdCanvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        this.holdCanvas.width = PREVIEW_CELL_SIZE * 6;
        this.holdCanvas.height = PREVIEW_CELL_SIZE * 4;
    }

    init() {
        this.currentPiece = new Piece(Piece.getRandomType());
        for (let i = 0; i < 3; i++) {
            this.nextPieces.push(new Piece(Piece.getRandomType()));
        }
        
        const settings = this.storage.getSettings();
        if (settings) {
            this.soundSystem.soundEnabled = settings.soundEnabled;
            this.soundSystem.musicEnabled = settings.musicEnabled;
            this.soundSystem.setVolume(settings.volume);
            this.ghostEnabled = settings.ghostEnabled;
        }
        
        this.setupControls();
        this.setupUIControls();
        this.setupAIControls();
        this.updateDisplay();
        this.startStatsTimer();
        this.soundSystem.startMusic();
        this.gameLoop();
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'gameover') return;
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
                return;
            }
            
            if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'paused') {
                    this.restart();
                    return;
                }
            }
            
            if (e.key === 'm' || e.key === 'M') {
                this.toggleMute();
                return;
            }
            
            if (this.gameState !== 'playing') return;
            
            if (!this.keys[e.key]) {
                this.keys[e.key] = true;
                this.handleKeyPress(e.key);
                
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    this.keyTimers[e.key] = setTimeout(() => {
                        this.keyTimers[e.key + '_repeat'] = setInterval(() => {
                            this.handleKeyPress(e.key);
                        }, 50);
                    }, 150);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            clearTimeout(this.keyTimers[e.key]);
            clearInterval(this.keyTimers[e.key + '_repeat']);
        });
    }

    setupUIControls() {
        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            this.restart();
        });
        
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettings();
        });
    }
    
    setupAIControls() {
        const aiToggle = document.getElementById('aiToggle');
        const aiDifficulty = document.getElementById('aiDifficulty');
        const aiStatus = document.getElementById('aiStatus');
        
        aiToggle?.addEventListener('click', () => {
            if (this.ai.enabled) {
                this.ai.disable();
                aiToggle.textContent = 'Enable AI';
                aiToggle.classList.remove('active');
                aiStatus.textContent = '🤖 OFF';
                aiStatus.classList.remove('active');
            } else {
                this.ai.enable();
                this.ai.setDifficulty(aiDifficulty.value);
                aiToggle.textContent = 'Disable AI';
                aiToggle.classList.add('active');
                aiStatus.textContent = '🤖 ACTIVE';
                aiStatus.classList.add('active');
            }
        });
        
        aiDifficulty?.addEventListener('change', (e) => {
            this.ai.setDifficulty(e.target.value);
            if (e.target.value === 'impossible') {
                aiStatus.textContent = '🔥 GODMODE';
            } else if (this.ai.enabled) {
                aiStatus.textContent = '🤖 ACTIVE';
            }
        });
    }

    handleKeyPress(key) {
        if (!this.ai.enabled) {
            this.actionCount++;
        }
        
        switch(key) {
            case 'ArrowLeft':
                if (this.movePiece(-1, 0)) {
                    this.soundSystem.play('move');
                }
                break;
            case 'ArrowRight':
                if (this.movePiece(1, 0)) {
                    this.soundSystem.play('move');
                }
                break;
            case 'ArrowDown':
                if (this.movePiece(0, 1)) {
                    this.score += POINTS.SOFT_DROP;
                    this.updateDisplay();
                    this.soundSystem.play('move');
                }
                break;
            case 'ArrowUp':
            case 'x':
            case 'X':
                if (this.rotatePiece(1)) {
                    this.soundSystem.play('rotate');
                }
                break;
            case 'z':
            case 'Z':
                if (this.rotatePiece(-1)) {
                    this.soundSystem.play('rotate');
                }
                break;
            case ' ':
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                this.holdCurrentPiece();
                break;
        }
    }

    movePiece(dx, dy) {
        this.currentPiece.move(dx, dy);
        if (!this.board.isValidPosition(this.currentPiece.getCurrentShape(), this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.move(-dx, -dy);
            return false;
        }
        return true;
    }

    rotatePiece(direction = 1) {
        const originalRotation = this.currentPiece.rotation;
        this.currentPiece.rotate(direction);
        
        const kicks = this.getWallKicks(this.currentPiece.type, originalRotation, this.currentPiece.rotation);
        
        for (const [dx, dy] of kicks) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            
            if (this.board.isValidPosition(this.currentPiece.getCurrentShape(), this.currentPiece.x, this.currentPiece.y)) {
                if (this.isTSpin()) {
                    this.showTSpinText();
                }
                return true;
            }
            
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
        }
        
        this.currentPiece.rotation = originalRotation;
        return false;
    }

    getWallKicks(pieceType, fromRotation, toRotation) {
        if (pieceType === 'I') {
            return [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]];
        }
        return [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
    }

    isTSpin() {
        if (this.currentPiece.type !== 'T') return false;
        
        const shape = this.currentPiece.getCurrentShape();
        const corners = [
            [0, 0], [2, 0], [0, 2], [2, 2]
        ];
        
        let filledCorners = 0;
        for (const [dx, dy] of corners) {
            const x = this.currentPiece.x + dx;
            const y = this.currentPiece.y + dy;
            if (x < 0 || x >= 10 || y >= 20 || (y >= 0 && this.board.grid[y][x])) {
                filledCorners++;
            }
        }
        
        return filledCorners >= 3;
    }

    showTSpinText() {
        const canvas = this.board.canvas;
        const ctx = this.board.ctx;
        
        ctx.save();
        ctx.font = 'bold 30px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        
        ctx.strokeText('T-SPIN!', x, y);
        ctx.fillText('T-SPIN!', x, y);
        ctx.restore();
        
        this.soundSystem.play('combo');
        
        setTimeout(() => {
            this.render();
        }, 1000);
    }

    holdCurrentPiece() {
        if (!this.canHold) return;
        
        this.soundSystem.play('hold');
        
        if (this.holdPiece === null) {
            this.holdPiece = this.currentPiece;
            this.currentPiece = this.nextPieces.shift();
            this.nextPieces.push(new Piece(Piece.getRandomType()));
        } else {
            const temp = this.currentPiece;
            this.currentPiece = this.holdPiece;
            this.holdPiece = temp;
        }
        
        this.currentPiece.x = Math.floor((10 - this.currentPiece.getCurrentShape()[0].length) / 2);
        this.currentPiece.y = 0;
        
        this.canHold = false;
        this.drawHoldPiece();
        this.drawNextPieces();
    }

    hardDrop() {
        const dropDistance = this.currentPiece.hardDrop(this.board);
        this.score += dropDistance * POINTS.HARD_DROP;
        this.soundSystem.play('drop');
        this.lockPiece();
    }

    lockPiece() {
        // Check if piece is locked above the visible area (game over)
        if (this.currentPiece.y < 0) {
            this.gameOver();
            return;
        }
        
        this.board.lockPiece(
            this.currentPiece.getCurrentShape(),
            this.currentPiece.x,
            this.currentPiece.y,
            this.currentPiece.color
        );
        
        // Check if any blocks are in the top row (game over)
        if (this.board.grid[0].some(cell => cell !== 0) || 
            this.board.grid[1].some(cell => cell !== 0)) {
            this.gameOver();
            return;
        }
        
        this.pieceCount++;
        this.canHold = true;
        
        const fullLines = [];
        for (let y = 0; y < this.board.grid.length; y++) {
            if (this.board.grid[y].every(cell => cell !== 0)) {
                fullLines.push(y);
            }
        }
        
        if (fullLines.length > 0) {
            fullLines.forEach(y => {
                const colors = this.board.grid[y].filter(cell => cell !== 0);
                this.particleSystem.addLineClearEffect(y, this.board.grid[y].length, colors);
            });
            
            this.triggerScreenShake(fullLines.length);
            
            if (fullLines.length === 4) {
                this.soundSystem.play('tetris');
            } else {
                this.soundSystem.play('clear');
            }
        }
        
        const linesCleared = this.board.clearFullLines();
        if (linesCleared > 0) {
            const wasTSpin = this.isTSpin();
            this.updateScore(linesCleared, wasTSpin);
            this.updateCombo(linesCleared);
        } else {
            this.combo = 0;
        }
        
        this.currentPiece = this.nextPieces.shift();
        this.nextPieces.push(new Piece(Piece.getRandomType()));
        
        // Check if new piece can spawn (game over if not)
        if (!this.board.isValidPosition(this.currentPiece.getCurrentShape(), this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
            return;
        }
        
        this.updateDisplay();
        this.drawNextPieces();
    }

    updateScore(linesCleared, wasTSpin = false) {
        this.lines += linesCleared;
        
        const points = [0, POINTS.SINGLE, POINTS.DOUBLE, POINTS.TRIPLE, POINTS.TETRIS];
        let basePoints = points[linesCleared] * this.level;
        
        if (wasTSpin) {
            basePoints *= 2;
        }
        
        if (this.combo > 0) {
            basePoints *= (1 + this.combo * 0.5);
            this.showComboText(this.combo);
        }
        
        this.score += Math.floor(basePoints);
        
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel !== this.level && newLevel < LEVEL_SPEEDS.length) {
            this.level = newLevel;
            this.dropInterval = LEVEL_SPEEDS[this.level - 1];
            this.showLevelUpEffect();
            this.soundSystem.play('levelUp');
        }
    }
    
    updateCombo(linesCleared) {
        const now = Date.now();
        if (now - this.lastClearTime < 3000) {
            this.combo++;
            this.soundSystem.play('combo');
        } else {
            this.combo = 0;
        }
        this.lastClearTime = now;
    }
    
    showComboText(combo) {
        const canvas = this.board.canvas;
        const ctx = this.board.ctx;
        const text = `${combo}x COMBO!`;
        const fontSize = 20 + combo * 2;
        
        ctx.save();
        ctx.font = `bold ${fontSize}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff006e';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const x = canvas.width / 2;
        const y = canvas.height / 3;
        
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
        
        setTimeout(() => {
            this.render();
        }, 1000);
    }
    
    showLevelUpEffect() {
        const canvas = this.board.canvas;
        this.particleSystem.addExplosion(canvas.width / 2, canvas.height / 2, '#FFD700', 50);
    }
    
    triggerScreenShake(intensity) {
        const canvas = this.board.canvas;
        const originalTransform = canvas.style.transform;
        let shakeTime = 0;
        const shakeInterval = setInterval(() => {
            shakeTime += 16;
            if (shakeTime > 300) {
                canvas.style.transform = originalTransform;
                clearInterval(shakeInterval);
            } else {
                const x = (Math.random() - 0.5) * intensity * 3;
                const y = (Math.random() - 0.5) * intensity * 3;
                canvas.style.transform = `translate(${x}px, ${y}px)`;
            }
        }, 16);
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        document.getElementById('time').textContent = this.storage.formatTime(elapsed);
        
        const ppm = this.pieceCount > 0 ? Math.floor((this.pieceCount / elapsed) * 60) : 0;
        document.getElementById('ppm').textContent = ppm;
        
        const apm = this.actionCount > 0 ? Math.floor((this.actionCount / elapsed) * 60) : 0;
        document.getElementById('apm').textContent = apm;
    }

    drawNextPieces() {
        const canvases = [this.nextCanvas, this.nextCanvas2, this.nextCanvas3];
        const contexts = [this.nextCtx, this.nextCtx2, this.nextCtx3];
        
        for (let i = 0; i < 3 && i < this.nextPieces.length; i++) {
            const ctx = contexts[i];
            const canvas = canvases[i];
            const piece = this.nextPieces[i];
            const cellSize = i === 0 ? PREVIEW_CELL_SIZE : PREVIEW_CELL_SIZE * 0.8;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const shape = piece.getCurrentShape();
            const offsetX = (canvas.width - shape[0].length * cellSize) / 2;
            const offsetY = (canvas.height - shape.length * cellSize) / 2;
            
            for (let y = 0; y < shape.length; y++) {
                for (let x = 0; x < shape[y].length; x++) {
                    if (shape[y][x]) {
                        const drawX = offsetX + x * cellSize;
                        const drawY = offsetY + y * cellSize;
                        
                        const gradient = ctx.createRadialGradient(
                            drawX + cellSize/2, drawY + cellSize/2, 0,
                            drawX + cellSize/2, drawY + cellSize/2, cellSize
                        );
                        gradient.addColorStop(0, piece.lightenColor(piece.color, 30));
                        gradient.addColorStop(0.5, piece.color);
                        gradient.addColorStop(1, piece.darkenColor(piece.color, 20));
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(drawX, drawY, cellSize - 1, cellSize - 1);
                    }
                }
            }
        }
    }

    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const shape = this.holdPiece.getCurrentShape();
        const offsetX = (this.holdCanvas.width - shape[0].length * PREVIEW_CELL_SIZE) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * PREVIEW_CELL_SIZE) / 2;
        
        const alpha = this.canHold ? 1 : 0.3;
        this.holdCtx.globalAlpha = alpha;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = offsetX + x * PREVIEW_CELL_SIZE;
                    const drawY = offsetY + y * PREVIEW_CELL_SIZE;
                    
                    const gradient = this.holdCtx.createRadialGradient(
                        drawX + PREVIEW_CELL_SIZE/2, drawY + PREVIEW_CELL_SIZE/2, 0,
                        drawX + PREVIEW_CELL_SIZE/2, drawY + PREVIEW_CELL_SIZE/2, PREVIEW_CELL_SIZE
                    );
                    gradient.addColorStop(0, this.holdPiece.lightenColor(this.holdPiece.color, 30));
                    gradient.addColorStop(0.5, this.holdPiece.color);
                    gradient.addColorStop(1, this.holdPiece.darkenColor(this.holdPiece.color, 20));
                    
                    this.holdCtx.fillStyle = gradient;
                    this.holdCtx.fillRect(drawX, drawY, PREVIEW_CELL_SIZE - 1, PREVIEW_CELL_SIZE - 1);
                }
            }
        }
        
        this.holdCtx.globalAlpha = 1;
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseOverlay').classList.remove('hidden');
            this.soundSystem.stopMusic();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseOverlay').classList.add('hidden');
            this.lastTime = performance.now();
            this.soundSystem.startMusic();
            this.gameLoop();
        }
    }

    gameOver() {
        if (this.gameState === 'gameover') return; // Prevent multiple calls
        
        this.gameState = 'gameover';
        this.soundSystem.play('gameOver');
        this.soundSystem.stopMusic();
        
        // Disable AI if it was playing
        if (this.ai && this.ai.enabled) {
            this.ai.disable();
            const aiToggle = document.getElementById('aiToggle');
            const aiStatus = document.getElementById('aiStatus');
            if (aiToggle) {
                aiToggle.textContent = 'Enable AI';
                aiToggle.classList.remove('active');
            }
            if (aiStatus) {
                aiStatus.textContent = '🤖 OFF';
                aiStatus.classList.remove('active');
            }
        }
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const rank = this.storage.addHighScore(this.score, this.lines, this.level, elapsed);
        
        this.storage.updateStats({
            score: this.score,
            lines: this.lines,
            level: this.level,
            playTime: elapsed
        });
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLines').textContent = this.lines;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalTime').textContent = this.storage.formatTime(elapsed);
        
        const highScores = this.storage.getHighScores();
        const highScoresList = document.getElementById('highScoresList');
        highScoresList.innerHTML = '';
        
        highScores.forEach((score, index) => {
            const li = document.createElement('li');
            const isCurrentGame = rank && index + 1 === rank;
            li.innerHTML = `
                <span>${index + 1}. ${isCurrentGame ? '⭐ ' : ''}${score.score}</span>
                <span>${this.storage.formatTime(score.time)}</span>
            `;
            highScoresList.appendChild(li);
        });
        
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }

    restart() {
        this.board.reset();
        this.particleSystem = new ParticleSystem();
        
        this.currentPiece = new Piece(Piece.getRandomType());
        this.nextPieces = [];
        for (let i = 0; i < 3; i++) {
            this.nextPieces.push(new Piece(Piece.getRandomType()));
        }
        
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropCounter = 0;
        this.dropInterval = LEVEL_SPEEDS[0];
        this.lastTime = performance.now();
        
        this.combo = 0;
        this.lastClearTime = 0;
        
        this.startTime = Date.now();
        this.pieceCount = 0;
        this.actionCount = 0;
        
        this.gameState = 'playing';
        
        // Reset AI
        if (this.ai.enabled) {
            this.ai.moveQueue = [];
            this.ai.isExecuting = false;
        }
        
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
        
        this.updateDisplay();
        this.drawNextPieces();
        this.drawHoldPiece();
        this.soundSystem.startMusic();
        this.gameLoop();
    }

    startStatsTimer() {
        setInterval(() => {
            if (this.gameState === 'playing') {
                this.updateDisplay();
            }
        }, 1000);
    }

    openSettings() {
        console.log('Settings menu not yet implemented');
    }
    
    toggleMute() {
        const wasSoundEnabled = this.soundSystem.soundEnabled;
        const wasMusicEnabled = this.soundSystem.musicEnabled;
        
        if (wasSoundEnabled || wasMusicEnabled) {
            // Mute everything
            this.soundSystem.soundEnabled = false;
            this.soundSystem.musicEnabled = false;
            this.soundSystem.stopMusic();
            this.showMuteStatus(true);
            
            // Save mute state
            this.storage.updateSettings({ 
                soundEnabled: false, 
                musicEnabled: false,
                wasMuted: true
            });
        } else {
            // Unmute everything
            this.soundSystem.soundEnabled = true;
            this.soundSystem.musicEnabled = true;
            if (this.gameState === 'playing') {
                this.soundSystem.startMusic();
            }
            this.showMuteStatus(false);
            
            // Save unmute state
            this.storage.updateSettings({ 
                soundEnabled: true, 
                musicEnabled: true,
                wasMuted: false
            });
        }
    }
    
    showMuteStatus(isMuted) {
        const canvas = this.board.canvas;
        const ctx = this.board.ctx;
        
        ctx.save();
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillStyle = isMuted ? '#ff006e' : '#00ff00';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        
        const x = canvas.width / 2;
        const y = 50;
        const text = isMuted ? '🔇 MUTED' : '🔊 UNMUTED';
        
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();
        
        // Clear the message after 1 second
        setTimeout(() => {
            this.render();
        }, 1000);
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Let AI control if enabled
        if (this.ai.enabled) {
            this.ai.update();
        }
        
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropCounter = 0;
        }
        
        this.particleSystem.update();
    }

    render() {
        this.board.render();
        
        if (this.currentPiece && this.currentPiece.y >= 0 && this.ghostEnabled) {
            this.currentPiece.drawGhost(this.board.ctx, this.board, CELL_SIZE);
        }
        
        if (this.currentPiece) {
            this.currentPiece.draw(this.board.ctx, CELL_SIZE);
        }
        
        this.particleSystem.draw(this.board.ctx);
    }

    gameLoop(time = 0) {
        if (this.gameState === 'gameover') return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.update(deltaTime);
        this.render();
        
        if (this.gameState === 'playing') {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }
}