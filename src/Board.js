import { BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, COLORS } from './constants.js';

export class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = BOARD_WIDTH * CELL_SIZE;
        this.canvas.height = BOARD_HEIGHT * CELL_SIZE;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    }

    drawCell(x, y, color) {
        const centerX = x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2;
        
        if (color !== COLORS.EMPTY && color !== COLORS.GHOST) {
            const gradient = this.ctx.createRadialGradient(
                centerX - CELL_SIZE/4, centerY - CELL_SIZE/4, 0,
                centerX, centerY, CELL_SIZE
            );
            gradient.addColorStop(0, this.lightenColor(color, 40));
            gradient.addColorStop(0.5, color);
            gradient.addColorStop(1, this.darkenColor(color, 30));
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeStyle = this.lightenColor(color, 20);
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            this.ctx.shadowBlur = 0;
            
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, 2);
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(x * CELL_SIZE + 2, (y + 1) * CELL_SIZE - 4, CELL_SIZE - 4, 2);
        } else {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
    }
    
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#',''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#',''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R>0?R:0)*0x10000 + (G>0?G:0)*0x100 + (B>0?B:0)).toString(16).slice(1);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(10, 10, 30, 0.1)');
        gradient.addColorStop(1, 'rgba(30, 10, 50, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = 'rgba(120, 119, 198, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.drawCell(x, y, this.grid[y][x]);
                }
            }
        }
    }

    isValidPosition(piece, pieceX, pieceY) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = pieceX + x;
                    const newY = pieceY + y;
                    
                    if (newX < 0 || newX >= BOARD_WIDTH || 
                        newY >= BOARD_HEIGHT ||
                        (newY >= 0 && this.grid[newY][newX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece(piece, pieceX, pieceY, color) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const boardY = pieceY + y;
                    const boardX = pieceX + x;
                    if (boardY >= 0) {
                        this.grid[boardY][boardX] = color;
                    }
                }
            }
        }
    }

    clearFullLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        return linesCleared;
    }

    isGameOver() {
        // Check if any blocks exist in the top 2 rows (invisible spawn area)
        return this.grid[0].some(cell => cell !== 0) || 
               this.grid[1].some(cell => cell !== 0);
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }
}