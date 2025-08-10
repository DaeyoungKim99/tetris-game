export class Storage {
    constructor() {
        this.storageKey = 'tetrisGameData';
        this.init();
    }

    init() {
        if (!this.getData()) {
            this.setData({
                highScores: [],
                stats: {
                    gamesPlayed: 0,
                    totalLines: 0,
                    totalScore: 0,
                    bestLevel: 0,
                    totalPlayTime: 0
                },
                settings: {
                    soundEnabled: true,
                    musicEnabled: true,
                    ghostEnabled: true,
                    volume: 0.5,
                    wasMuted: false
                }
            });
        }
    }

    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    setData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    addHighScore(score, lines, level, time) {
        const data = this.getData();
        const newScore = {
            score,
            lines,
            level,
            time,
            date: new Date().toISOString(),
            rank: 0
        };

        data.highScores.push(newScore);
        data.highScores.sort((a, b) => b.score - a.score);
        data.highScores = data.highScores.slice(0, 10);

        data.highScores.forEach((score, index) => {
            score.rank = index + 1;
        });

        this.setData(data);
        return newScore.rank <= 10 ? newScore.rank : null;
    }

    getHighScores() {
        const data = this.getData();
        return data ? data.highScores : [];
    }

    updateStats(stats) {
        const data = this.getData();
        data.stats.gamesPlayed++;
        data.stats.totalLines += stats.lines;
        data.stats.totalScore += stats.score;
        data.stats.totalPlayTime += stats.playTime;
        if (stats.level > data.stats.bestLevel) {
            data.stats.bestLevel = stats.level;
        }
        this.setData(data);
    }

    getStats() {
        const data = this.getData();
        return data ? data.stats : null;
    }

    getSettings() {
        const data = this.getData();
        return data ? data.settings : null;
    }

    updateSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        this.setData(data);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}