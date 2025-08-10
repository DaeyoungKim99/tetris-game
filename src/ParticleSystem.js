export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = Math.random() * -10 - 5;
        this.gravity = 0.5;
        this.color = color;
        this.alpha = 1;
        this.size = Math.random() * 6 + 4;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.life = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life -= 0.02;
        this.alpha = this.life;
        this.size *= 0.98;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    addLineClearEffect(y, width, colors) {
        for (let x = 0; x < width; x++) {
            setTimeout(() => {
                const color = colors[Math.floor(Math.random() * colors.length)];
                this.addExplosion(x * 30 + 15, y * 30 + 15, color, 10);
            }, x * 50);
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return !particle.isDead();
        });
    }

    draw(ctx) {
        ctx.save();
        this.particles.forEach(particle => particle.draw(ctx));
        ctx.restore();
    }
}