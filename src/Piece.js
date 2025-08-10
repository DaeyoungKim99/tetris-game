import { TETROMINOS, COLORS, BOARD_WIDTH } from './constants.js';

export class Piece {
    constructor(type) {
        this.type = type;
        this.color = COLORS[type];
        this.shapes = TETROMINOS[type];
        this.rotation = 0;
        this.x = Math.floor((BOARD_WIDTH - this.getCurrentShape()[0].length) / 2);
        this.y = 0; // Start at row 0 instead of -2 for proper game over detection
    }

    getCurrentShape() {
        return this.shapes[this.rotation];
    }

    rotate(direction = 1) {
        this.rotation = (this.rotation + direction + this.shapes.length) % this.shapes.length;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    getGhostY(board) {
        let ghostY = this.y;
        while (board.isValidPosition(this.getCurrentShape(), this.x, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }

    hardDrop(board) {
        const dropDistance = this.getGhostY(board) - this.y;
        this.y = this.getGhostY(board);
        return dropDistance;
    }

    draw(ctx, cellSize, offsetX = 0, offsetY = 0) {
        const shape = this.getCurrentShape();
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = (this.x + x) * cellSize + offsetX;
                    const drawY = (this.y + y) * cellSize + offsetY;
                    const centerX = drawX + cellSize / 2;
                    const centerY = drawY + cellSize / 2;
                    
                    const gradient = ctx.createRadialGradient(
                        centerX - cellSize/4, centerY - cellSize/4, 0,
                        centerX, centerY, cellSize
                    );
                    gradient.addColorStop(0, this.lightenColor(this.color, 40));
                    gradient.addColorStop(0.5, this.color);
                    gradient.addColorStop(1, this.darkenColor(this.color, 30));
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
                    
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 15;
                    ctx.strokeStyle = this.lightenColor(this.color, 20);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
                    ctx.shadowBlur = 0;
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.fillRect(drawX + 2, drawY + 2, cellSize - 4, 2);
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(drawX + 2, drawY + cellSize - 4, cellSize - 4, 2);
                }
            }
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

    drawGhost(ctx, board, cellSize) {
        const ghostY = this.getGhostY(board);
        const shape = this.getCurrentShape();
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const drawX = (this.x + x) * cellSize;
                    const drawY = (ghostY + y) * cellSize;
                    
                    const gradient = ctx.createLinearGradient(drawX, drawY, drawX, drawY + cellSize);
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
                    
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.strokeRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
                    ctx.setLineDash([]);
                }
            }
        }
        
        ctx.restore();
    }

    static getRandomType() {
        const types = Object.keys(TETROMINOS);
        return types[Math.floor(Math.random() * types.length)];
    }
}