# 🎮 Modern Tetris Game

![Tetris Game with AI](tetris-game-ai.gif)

A feature-rich Tetris game built with vanilla JavaScript and HTML5 Canvas, featuring modern effects, particle systems, and AI player.

![Tetris Game](https://img.shields.io/badge/Game-Tetris-purple)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- **Classic Tetris Mechanics** with all 7 tetromino pieces
- **Advanced Features**: Hold piece system, ghost piece, wall kicks, T-spin detection
- **Visual Effects**: Particle explosions, screen shake, 3D gradient pieces, animated starfield background
- **AI Player**: Multiple difficulty levels with sophisticated evaluation algorithms
- **Scoring System**: Combos, level progression, high score leaderboard
- **Statistics**: PPM (Pieces Per Minute), APM (Actions Per Minute), real-time timer

## 🎮 Controls

| Key | Action |
|-----|--------|
| ← → | Move left/right |
| ↓ | Soft drop |
| Space | Hard drop |
| ↑ / X | Rotate clockwise |
| Z | Rotate counter-clockwise |
| C | Hold piece |
| P | Pause game |
| M | Mute/Unmute |

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/DaeyoungKim99/tetris-game.git
cd tetris-game

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Built files will be in the `dist` directory.

## 🌐 Deployment

### GitHub Pages
```bash
npm run deploy:gh-pages
```

### Netlify
```bash
npm run deploy:netlify
```

### Surge.sh
```bash
npm run deploy:surge
```

## 📁 Project Structure

```
tetris/
├── index.html
├── style.css
├── package.json
├── vite.config.js
└── src/
    ├── main.js         # Entry point
    ├── Game.js         # Main game logic
    ├── Board.js        # Board management
    ├── Piece.js        # Tetromino logic
    ├── TetrisAI.js     # AI player
    ├── ParticleSystem.js
    ├── SoundSystem.js
    └── Storage.js      # High scores persistence
```

## 🎯 Scoring System

- **Single Line**: 100 × level
- **Double**: 300 × level
- **Triple**: 500 × level
- **Tetris**: 800 × level
- **T-Spin Bonus**: 2× multiplier
- **Combo Multiplier**: 1.5× per consecutive clear

## 🤖 AI Player

The AI uses advanced heuristics including aggregate height, holes, bumpiness, line clears, and pattern recognition. On IMPOSSIBLE mode, it can achieve:
- **PPM**: 600-1000+
- **APM**: 1000-2000+
- Near-perfect play indefinitely

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

DK99

Project Link: [https://github.com/DaeyoungKim99/tetris-game](https://github.com/DaeyoungKim99/tetris-game)