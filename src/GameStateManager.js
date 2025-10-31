// Game State Manager
export class GameStateManager {
    constructor() {
        this.score = 0;
        this.mass = 1.0;
        this.tier = 1;
        this.currentMission = null;
        this.completedMissions = [];
        this.achievements = this.initializeAchievements();
        this.loadLeaderboard();
        this.difficulty = 1;
        this.timeElapsed = 0;
        this.debrisAbsorbed = 0;
    }

    initializeAchievements() {
        return [
            {
                id: 'first_absorption',
                title: 'First Taste',
                description: 'Absorb your first debris',
                icon: '🌟',
                unlocked: false,
                condition: () => this.debrisAbsorbed >= 1
            },
            {
                id: 'mass_10',
                title: 'Growing Strong',
                description: 'Reach mass of 10',
                icon: '💪',
                unlocked: false,
                condition: () => this.mass >= 10
            },
            {
                id: 'mass_50',
                title: 'Heavy Weight',
                description: 'Reach mass of 50',
                icon: '🏋️',
                unlocked: false,
                condition: () => this.mass >= 50
            },
            {
                id: 'mass_100',
                title: 'Massive Entity',
                description: 'Reach mass of 100',
                icon: '🌍',
                unlocked: false,
                condition: () => this.mass >= 100
            },
            {
                id: 'tier_3',
                title: 'Ascending',
                description: 'Reach Tier 3',
                icon: '⬆️',
                unlocked: false,
                condition: () => this.tier >= 3
            },
            {
                id: 'tier_5',
                title: 'Elite Status',
                description: 'Reach Tier 5',
                icon: '👑',
                unlocked: false,
                condition: () => this.tier >= 5
            },
            {
                id: 'score_1000',
                title: 'Point Collector',
                description: 'Score 1000 points',
                icon: '🎯',
                unlocked: false,
                condition: () => this.score >= 1000
            },
            {
                id: 'score_5000',
                title: 'Score Master',
                description: 'Score 5000 points',
                icon: '🏆',
                unlocked: false,
                condition: () => this.score >= 5000
            },
            {
                id: 'survive_5min',
                title: 'Endurance',
                description: 'Survive for 5 minutes',
                icon: '⏱️',
                unlocked: false,
                condition: () => this.timeElapsed >= 300
            },
            {
                id: 'absorb_100',
                title: 'Vacuum Cleaner',
                description: 'Absorb 100 debris',
                icon: '🌪️',
                unlocked: false,
                condition: () => this.debrisAbsorbed >= 100
            }
        ];
    }

    getMissionsList() {
        return [
            {
                id: 'absorb_10',
                title: 'Debris Hunter',
                description: 'Absorb 10 debris',
                difficulty: 1,
                reward: 100,
                condition: () => this.debrisAbsorbed >= 10
            },
            {
                id: 'reach_mass_3',
                title: 'First Growth',
                description: 'Reach a mass of 3',
                difficulty: 1,
                reward: 150,
                condition: () => this.mass >= 3
            },
            {
                id: 'reach_tier_2',
                title: 'Next Level',
                description: 'Advance to Tier 2',
                difficulty: 1,
                reward: 200,
                condition: () => this.tier >= 2
            },
            {
                id: 'absorb_50',
                title: 'Mass Collector',
                description: 'Absorb 50 debris',
                difficulty: 2,
                reward: 300,
                condition: () => this.debrisAbsorbed >= 50
            },
            {
                id: 'reach_mass_15',
                title: 'Growing Power',
                description: 'Reach a mass of 15',
                difficulty: 2,
                reward: 400,
                condition: () => this.mass >= 15
            },
            {
                id: 'reach_tier_4',
                title: 'High Tier',
                description: 'Advance to Tier 4',
                difficulty: 3,
                reward: 500,
                condition: () => this.tier >= 4
            },
            {
                id: 'absorb_200',
                title: 'Absorption Expert',
                description: 'Absorb 200 debris',
                difficulty: 4,
                reward: 800,
                condition: () => this.debrisAbsorbed >= 200
            },
            {
                id: 'reach_mass_100',
                title: 'Maximum Mass',
                description: 'Reach a mass of 100',
                difficulty: 5,
                reward: 1000,
                condition: () => this.mass >= 100
            },
            {
                id: 'reach_tier_8',
                title: 'Ultimate Tier',
                description: 'Advance to Tier 8',
                difficulty: 6,
                reward: 2000,
                condition: () => this.tier >= 8
            }
        ];
    }

    startNewMission() {
        const availableMissions = this.getMissionsList().filter(
            m => !this.completedMissions.includes(m.id) &&
            m.difficulty <= this.tier
        );
        
        if (availableMissions.length > 0) {
            this.currentMission = availableMissions[0];
            return this.currentMission;
        }
        return null;
    }

    checkMissionProgress() {
        if (this.currentMission && this.currentMission.condition()) {
            this.completeMission();
        }
    }

    completeMission() {
        if (!this.currentMission) return;

        this.completedMissions.push(this.currentMission.id);
        this.addScore(this.currentMission.reward);
        
        const completedMission = this.currentMission;
        this.currentMission = null;
        
        // Start next mission after a delay
        setTimeout(() => this.startNewMission(), 2000);
        
        return completedMission;
    }

    checkAchievements() {
        const newlyUnlocked = [];
        
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition()) {
                achievement.unlocked = true;
                newlyUnlocked.push(achievement);
                this.addScore(50); // Bonus points for achievement
            }
        });
        
        return newlyUnlocked;
    }

    addMass(amount) {
        const oldTier = this.tier;
        this.mass += amount;
        this.debrisAbsorbed++;
        
        // Update tier based on mass
        this.tier = this.calculateTier();
        
        // Check for tier up
        const tierUp = this.tier > oldTier;
        
        // Check achievements and missions
        const achievements = this.checkAchievements();
        this.checkMissionProgress();
        
        return { tierUp, achievements };
    }

    calculateTier() {
        // Smoother exponential curve for better progression feel
        // Old: [5, 15, 35, 70, 120, 200]
        // New: Smoother curve with smaller jumps early, larger later
        if (this.mass < 3) return 1;      // 0-3
        if (this.mass < 8) return 2;      // 3-8 (was 5-15)
        if (this.mass < 18) return 3;     // 8-18 (was 15-35)
        if (this.mass < 35) return 4;     // 18-35 (was 35-70)
        if (this.mass < 60) return 5;     // 35-60 (was 70-120)
        if (this.mass < 100) return 6;    // 60-100 (was 120-200)
        if (this.mass < 150) return 7;    // 100-150
        return 8;                          // 150+
    }

    getTierProgress() {
        const tierThresholds = [0, 3, 8, 18, 35, 60, 100, 150, 250];
        const currentThreshold = tierThresholds[this.tier - 1];
        const nextThreshold = tierThresholds[this.tier] || 250;
        
        const progress = (this.mass - currentThreshold) / (nextThreshold - currentThreshold);
        return Math.min(Math.max(progress, 0), 1);
    }

    addScore(points) {
        this.score += points;
        this.checkAchievements();
    }

    recycle() {
        if (this.mass <= 1) return 0;
        
        const recycleAmount = Math.floor(this.mass * 0.25);
        const points = recycleAmount * 10;
        
        this.mass = Math.max(1, this.mass - recycleAmount);
        this.tier = this.calculateTier();
        this.addScore(points);
        
        return points;
    }

    updateDifficulty(timeElapsed) {
        this.timeElapsed = timeElapsed;
        // Note: Difficulty is now calculated in main.js based on player power
        // This method kept for compatibility
        this.checkAchievements();
    }

    saveToLeaderboard(playerName = 'Player') {
        const leaderboard = this.getLeaderboard();
        
        const entry = {
            name: playerName,
            score: this.score,
            mass: this.mass,
            tier: this.tier,
            time: this.timeElapsed,
            date: new Date().toISOString()
        };
        
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep top 10
        const top10 = leaderboard.slice(0, 10);
        localStorage.setItem('gravshift_leaderboard', JSON.stringify(top10));
        
        return top10;
    }

    loadLeaderboard() {
        const saved = localStorage.getItem('gravshift_leaderboard');
        return saved ? JSON.parse(saved) : this.getDefaultLeaderboard();
    }

    getLeaderboard() {
        return this.loadLeaderboard();
    }

    getDefaultLeaderboard() {
        return [
            { name: 'Gravity Master', score: 10000, mass: 150, tier: 7, time: 600 },
            { name: 'Star Absorber', score: 7500, mass: 120, tier: 6, time: 480 },
            { name: 'Cosmic Entity', score: 5000, mass: 90, tier: 5, time: 360 },
            { name: 'Space Wanderer', score: 3000, mass: 60, tier: 4, time: 240 },
            { name: 'Debris Hunter', score: 1500, mass: 35, tier: 3, time: 180 }
        ];
    }

    reset() {
        this.score = 0;
        this.mass = 1.0;
        this.tier = 1;
        this.currentMission = null;
        this.completedMissions = [];
        this.difficulty = 1;
        this.timeElapsed = 0;
        this.debrisAbsorbed = 0;
        // Don't reset achievements - they persist across games
        this.startNewMission();
    }
}
