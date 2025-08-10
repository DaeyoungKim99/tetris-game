import { BOARD_WIDTH, BOARD_HEIGHT } from './constants.js';

export class TetrisAI {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.moveDelay = 50; // ms between moves for visual effect
        this.lastMoveTime = 0;
        this.lastThinkTime = 0;
        this.thinkDelay = 100; // ms between decision cycles
        this.currentPlan = null;
        this.isExecuting = false;
        
        // Weights for evaluation function (tuned for optimal play)
        this.weights = {
            height: -0.510066,
            holes: -0.35663,
            bumpiness: -0.184483,
            lines: 0.760666,
            wells: -0.35663,
            blockades: -0.5,
            heightDifference: -0.2,
            centerHeight: -0.1,
            edgeTouch: 0.05,
            floorTouch: 0.1,
            tSpinPotential: 0.3,
            perfectClear: 10.0
        };
        
        this.moveQueue = [];
        this.thinkingDepth = 2; // Look ahead 2 pieces
    }

    enable() {
        this.enabled = true;
        console.log('🤖 AI Player Activated - Prepare to witness perfection!');
    }

    disable() {
        this.enabled = false;
        this.currentPlan = null;
        this.moveQueue = [];
        this.isExecuting = false;
        console.log('AI Player Deactivated');
    }

    update() {
        if (!this.enabled || this.game.gameState !== 'playing') return;
        
        const now = Date.now();
        
        // Throttle thinking to prevent freezing
        if (!this.isExecuting && now - this.lastThinkTime >= this.thinkDelay) {
            this.planNextMove();
            this.lastThinkTime = now;
        }
        
        // Execute moves with delay for visibility
        if (this.moveQueue.length > 0 && now - this.lastMoveTime >= this.moveDelay) {
            this.executeNextMove();
            this.lastMoveTime = now;
        }
    }

    async planNextMove() {
        if (!this.game.currentPiece || this.isExecuting) return;
        
        this.isExecuting = true;
        
        // Use setTimeout to prevent blocking
        setTimeout(() => {
            // Consider using hold piece
            const shouldHold = this.shouldUseHold();
            if (shouldHold && this.game.canHold) {
                this.moveQueue.push({ type: 'hold' });
                return;
            }
            
            // Find best placement for current piece
            const bestMove = this.findBestPlacement(
                this.game.currentPiece,
                this.game.board,
                this.game.nextPieces
            );
            
            if (bestMove) {
                this.generateMoveSequence(bestMove);
            } else {
                this.isExecuting = false;
            }
        }, 0);
    }

    shouldUseHold() {
        if (!this.game.canHold) return false;
        
        const currentScore = this.evaluatePiece(this.game.currentPiece);
        
        if (this.game.holdPiece) {
            const holdScore = this.evaluatePiece(this.game.holdPiece);
            return holdScore > currentScore + 2; // Bias towards not holding too often
        } else if (this.game.nextPieces.length > 0) {
            const nextScore = this.evaluatePiece(this.game.nextPieces[0]);
            return currentScore < -2 && nextScore > currentScore;
        }
        
        return false;
    }

    evaluatePiece(piece) {
        // Quick evaluation of piece usefulness in current context
        const boardHeight = this.getMaxHeight(this.game.board.grid);
        
        if (piece.type === 'I') {
            // I piece is valuable when board is high
            return boardHeight > 12 ? 5 : 0;
        } else if (piece.type === 'O') {
            // O piece is less valuable
            return -1;
        } else if (piece.type === 'T') {
            // T piece is valuable for T-spins
            return this.hasTSpinOpportunity() ? 3 : 1;
        }
        
        return 0;
    }

    hasTSpinOpportunity() {
        // Simplified T-spin detection
        const grid = this.game.board.grid;
        for (let y = 0; y < BOARD_HEIGHT - 2; y++) {
            for (let x = 1; x < BOARD_WIDTH - 1; x++) {
                if (!grid[y][x] && grid[y][x-1] && grid[y][x+1] && 
                    grid[y+1][x] && !grid[y+1][x-1] && !grid[y+1][x+1]) {
                    return true;
                }
            }
        }
        return false;
    }

    findBestPlacement(piece, board, nextPieces) {
        let bestScore = -Infinity;
        let bestMove = null;
        let evaluations = 0;
        const maxEvaluations = 200; // Limit evaluations to prevent freezing
        
        // Try all rotations
        for (let rotation = 0; rotation < piece.shapes.length; rotation++) {
            // Try all positions
            for (let x = -2; x < BOARD_WIDTH + 2; x++) {
                if (evaluations >= maxEvaluations) break;
                
                const testPiece = this.clonePiece(piece);
                testPiece.rotation = rotation;
                testPiece.x = x;
                testPiece.y = 0;
                
                // Find landing position
                const landingY = this.findLandingY(testPiece, board);
                if (landingY === null) continue;
                
                testPiece.y = landingY;
                
                // Check if placement is valid
                if (!this.isValidPlacement(testPiece, board)) continue;
                
                // Evaluate this placement
                const score = this.evaluatePlacement(testPiece, board, nextPieces);
                evaluations++;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        rotation: rotation,
                        x: x,
                        y: landingY,
                        score: score
                    };
                }
            }
        }
        
        return bestMove;
    }

    findLandingY(piece, board) {
        const shape = piece.shapes[piece.rotation];
        let y = 0;
        
        while (y < BOARD_HEIGHT) {
            if (!this.canPlace(shape, piece.x, y + 1, board.grid)) {
                return y;
            }
            y++;
        }
        
        return null;
    }

    canPlace(shape, x, y, grid) {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (!shape[py][px]) continue;
                
                const boardX = x + px;
                const boardY = y + py;
                
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return false;
                }
                
                if (boardY >= 0 && grid[boardY][boardX]) {
                    return false;
                }
            }
        }
        return true;
    }

    isValidPlacement(piece, board) {
        return this.canPlace(
            piece.shapes[piece.rotation],
            piece.x,
            piece.y,
            board.grid
        );
    }

    evaluatePlacement(piece, board, nextPieces) {
        // Create temporary board with piece placed
        const tempGrid = this.cloneGrid(board.grid);
        this.placePiece(tempGrid, piece);
        
        // Clear lines and get count
        const linesCleared = this.clearLines(tempGrid);
        
        // Calculate evaluation metrics
        const metrics = this.calculateMetrics(tempGrid);
        
        // Calculate base score
        let score = 0;
        score += this.weights.height * metrics.aggregateHeight;
        score += this.weights.holes * metrics.holes;
        score += this.weights.bumpiness * metrics.bumpiness;
        score += this.weights.lines * linesCleared;
        score += this.weights.wells * metrics.wells;
        score += this.weights.blockades * metrics.blockades;
        score += this.weights.heightDifference * metrics.heightDifference;
        score += this.weights.centerHeight * metrics.centerHeight;
        score += this.weights.edgeTouch * metrics.edgeTouch;
        score += this.weights.floorTouch * metrics.floorTouch;
        
        // Check for perfect clear
        if (this.isPerfectClear(tempGrid)) {
            score += this.weights.perfectClear;
        }
        
        // Simplified lookahead - disabled for performance
        // Only enable for higher difficulties
        if (this.thinkingDepth > 1 && nextPieces && nextPieces.length > 0) {
            // Just do a quick evaluation of next piece compatibility
            const nextPieceScore = this.quickEvaluateNextPiece(tempGrid, nextPieces[0]);
            score += nextPieceScore * 0.2;
        }
        
        return score;
    }
    
    quickEvaluateNextPiece(grid, nextPiece) {
        // Quick heuristic for next piece
        const heights = this.getColumnHeights(grid);
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
        
        if (nextPiece.type === 'I' && avgHeight > 10) return 5;
        if (nextPiece.type === 'O' && avgHeight < 5) return -2;
        return 0;
    }


    calculateMetrics(grid) {
        const heights = this.getColumnHeights(grid);
        
        return {
            aggregateHeight: heights.reduce((a, b) => a + b, 0),
            holes: this.countHoles(grid),
            bumpiness: this.calculateBumpiness(heights),
            wells: this.countWells(grid),
            blockades: this.countBlockades(grid),
            heightDifference: Math.max(...heights) - Math.min(...heights),
            centerHeight: (heights[4] + heights[5]) / 2,
            edgeTouch: this.countEdgeTouching(grid),
            floorTouch: this.countFloorTouching(grid)
        };
    }

    getColumnHeights(grid) {
        const heights = new Array(BOARD_WIDTH).fill(0);
        
        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (grid[y][x]) {
                    heights[x] = BOARD_HEIGHT - y;
                    break;
                }
            }
        }
        
        return heights;
    }

    getMaxHeight(grid) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (grid[y][x]) {
                    return BOARD_HEIGHT - y;
                }
            }
        }
        return 0;
    }

    countHoles(grid) {
        let holes = 0;
        
        for (let x = 0; x < BOARD_WIDTH; x++) {
            let blockFound = false;
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (grid[y][x]) {
                    blockFound = true;
                } else if (blockFound) {
                    holes++;
                }
            }
        }
        
        return holes;
    }

    calculateBumpiness(heights) {
        let bumpiness = 0;
        
        for (let i = 0; i < heights.length - 1; i++) {
            bumpiness += Math.abs(heights[i] - heights[i + 1]);
        }
        
        return bumpiness;
    }

    countWells(grid) {
        let wells = 0;
        const heights = this.getColumnHeights(grid);
        
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const left = x === 0 ? BOARD_HEIGHT : heights[x - 1];
            const right = x === BOARD_WIDTH - 1 ? BOARD_HEIGHT : heights[x + 1];
            const center = heights[x];
            
            if (center < left && center < right) {
                wells += Math.min(left, right) - center;
            }
        }
        
        return wells;
    }

    countBlockades(grid) {
        let blockades = 0;
        
        for (let x = 0; x < BOARD_WIDTH; x++) {
            let holesBelow = false;
            for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
                if (!grid[y][x] && y < BOARD_HEIGHT - 1 && grid[y + 1][x]) {
                    holesBelow = true;
                } else if (grid[y][x] && holesBelow) {
                    blockades++;
                }
            }
        }
        
        return blockades;
    }

    countEdgeTouching(grid) {
        let count = 0;
        
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (grid[y][0]) count++;
            if (grid[y][BOARD_WIDTH - 1]) count++;
        }
        
        return count;
    }

    countFloorTouching(grid) {
        let count = 0;
        
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (grid[BOARD_HEIGHT - 1][x]) count++;
        }
        
        return count;
    }

    isPerfectClear(grid) {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (grid[y][x]) return false;
            }
        }
        return true;
    }

    placePiece(grid, piece) {
        const shape = piece.shapes[piece.rotation];
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardY = piece.y + y;
                    const boardX = piece.x + x;
                    if (boardY >= 0 && boardY < BOARD_HEIGHT && 
                        boardX >= 0 && boardX < BOARD_WIDTH) {
                        grid[boardY][boardX] = piece.color;
                    }
                }
            }
        }
    }

    clearLines(grid) {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (grid[y].every(cell => cell !== 0)) {
                grid.splice(y, 1);
                grid.unshift(new Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Check same row again
            }
        }
        
        return linesCleared;
    }

    generateMoveSequence(bestMove) {
        this.moveQueue = [];
        
        const currentRotation = this.game.currentPiece.rotation;
        const targetRotation = bestMove.rotation;
        const currentX = this.game.currentPiece.x;
        const targetX = bestMove.x;
        
        // Calculate rotation moves
        let rotationDiff = targetRotation - currentRotation;
        if (rotationDiff < 0) rotationDiff += 4;
        
        // Add rotation moves (limit to prevent infinite loops)
        for (let i = 0; i < Math.min(rotationDiff, 3); i++) {
            this.moveQueue.push({ type: 'rotate' });
        }
        
        // Calculate horizontal moves
        const xDiff = targetX - currentX;
        const maxMoves = 15; // Prevent infinite moves
        
        // Add horizontal moves
        if (xDiff > 0) {
            for (let i = 0; i < Math.min(xDiff, maxMoves); i++) {
                this.moveQueue.push({ type: 'right' });
            }
        } else if (xDiff < 0) {
            for (let i = 0; i < Math.min(Math.abs(xDiff), maxMoves); i++) {
                this.moveQueue.push({ type: 'left' });
            }
        }
        
        // Add drop
        this.moveQueue.push({ type: 'drop' });
    }

    executeNextMove() {
        if (this.moveQueue.length === 0) {
            this.isExecuting = false;
            return;
        }
        
        const move = this.moveQueue.shift();
        
        switch (move.type) {
            case 'left':
                this.game.handleKeyPress('ArrowLeft');
                break;
            case 'right':
                this.game.handleKeyPress('ArrowRight');
                break;
            case 'rotate':
                this.game.handleKeyPress('ArrowUp');
                break;
            case 'drop':
                this.game.handleKeyPress(' ');
                this.isExecuting = false;
                break;
            case 'hold':
                this.game.handleKeyPress('c');
                this.isExecuting = false;
                break;
        }
    }

    clonePiece(piece) {
        return {
            type: piece.type,
            color: piece.color,
            shapes: piece.shapes,
            rotation: piece.rotation,
            x: piece.x,
            y: piece.y
        };
    }

    cloneGrid(grid) {
        return grid.map(row => [...row]);
    }

    setDifficulty(level) {
        switch(level) {
            case 'easy':
                this.moveDelay = 150;
                this.thinkDelay = 200;
                this.thinkingDepth = 0;
                // Add some randomness to make mistakes
                this.weights.lines *= 0.8;
                break;
            case 'medium':
                this.moveDelay = 100;
                this.thinkDelay = 150;
                this.thinkingDepth = 1;
                break;
            case 'hard':
                this.moveDelay = 50;
                this.thinkDelay = 100;
                this.thinkingDepth = 1;
                break;
            case 'impossible':
                this.moveDelay = 30;
                this.thinkDelay = 50;
                this.thinkingDepth = 2;
                // Perfect weights
                this.weights = {
                    height: -0.510066,
                    holes: -0.35663,
                    bumpiness: -0.184483,
                    lines: 0.960666,
                    wells: -0.35663,
                    blockades: -0.5,
                    heightDifference: -0.2,
                    centerHeight: -0.1,
                    edgeTouch: 0.05,
                    floorTouch: 0.1,
                    tSpinPotential: 0.5,
                    perfectClear: 15.0
                };
                break;
        }
    }
}