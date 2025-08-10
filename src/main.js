import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
    const createStarfield = () => {
        const stars = document.createElement('div');
        stars.className = 'stars';
        
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (Math.random() * 3 + 2) + 's';
            stars.appendChild(star);
        }
        
        document.body.appendChild(stars);
    };
    
    createStarfield();
    
    const game = new Game();
    
    document.body.style.overflow = 'hidden';
    
    const gameContainer = document.querySelector('.game-container');
    gameContainer.style.animation = 'fadeIn 1s ease-out';
});