// UI Manager
export class UIManager {
    constructor(gameStateManager) {
        this.gameState = gameStateManager;
        this.sidebarOpen = false;
        this.setupEventListeners();
        this.setupSidebar();
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('start-game')?.addEventListener('click', () => {
            this.hideMenu('main-menu');
            window.dispatchEvent(new CustomEvent('game-start'));
        });

        document.getElementById('view-achievements')?.addEventListener('click', () => {
            this.showAchievements();
        });

        document.getElementById('view-leaderboard')?.addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('view-controls')?.addEventListener('click', () => {
            this.showPanel('controls-panel');
        });

        // Pause menu buttons
        document.getElementById('resume-game')?.addEventListener('click', () => {
            this.hideMenu('pause-menu');
            window.dispatchEvent(new CustomEvent('game-resume'));
        });

        document.getElementById('restart-game')?.addEventListener('click', () => {
            this.hideMenu('pause-menu');
            window.dispatchEvent(new CustomEvent('game-restart'));
        });

        document.getElementById('quit-game')?.addEventListener('click', () => {
            this.hideMenu('pause-menu');
            this.showMenu('main-menu');
            window.dispatchEvent(new CustomEvent('game-quit'));
        });

        // Close buttons for panels
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const panel = e.target.closest('.panel');
                if (panel) {
                    panel.classList.remove('active');
                }
            });
        });
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Section toggles
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const section = e.target.closest('.sidebar-section');
                if (section) {
                    section.classList.toggle('collapsed');
                    e.target.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        });
        
        // Tab key to toggle sidebar
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleSidebar();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.sidebarOpen = !this.sidebarOpen;
            sidebar.classList.toggle('open', this.sidebarOpen);
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.sidebarOpen = false;
            sidebar.classList.remove('open');
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            this.sidebarOpen = true;
            sidebar.classList.add('open');
        }
    }

    showMenu(menuId) {
        document.querySelectorAll('.menu').forEach(menu => {
            menu.classList.remove('active');
        });
        document.getElementById(menuId)?.classList.add('active');
    }

    hideMenu(menuId) {
        document.getElementById(menuId)?.classList.remove('active');
    }

    showPanel(panelId) {
        document.getElementById(panelId)?.classList.add('active');
    }

    hidePanel(panelId) {
        document.getElementById(panelId)?.classList.remove('active');
    }

    updateHUD() {
        // Update mass
        document.getElementById('mass-value').textContent = this.gameState.mass.toFixed(1);
        
        // Update tier
        document.getElementById('tier-value').textContent = this.gameState.tier;
        
        // Update score
        document.getElementById('score-value').textContent = this.gameState.score;
        
        // Update tier progress bar
        const progress = this.gameState.getTierProgress();
        const progressFill = document.getElementById('tier-progress-fill');
        const progressText = document.getElementById('tier-progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress * 100}%`;
            progressText.textContent = `Next Tier: ${Math.floor(progress * 100)}%`;
        }
        
        // Update current mission
        this.updateMissionDisplay();
        
        // Update sidebar if open
        if (this.sidebarOpen) {
            this.updateSidebar();
        }
    }

    updateSidebar() {
        this.updateSidebarMissions();
        this.updateSidebarAchievements();
        this.updateSidebarStats();
    }

    updateSidebarMissions() {
        const container = document.getElementById('sidebar-mission-display');
        if (!container) return;

        if (this.gameState.currentMission) {
            const mission = this.gameState.currentMission;
            container.innerHTML = `
                <div class="mission-display">
                    <span class="mission-title">${mission.title}</span>
                    <span class="mission-progress">${mission.description}</span>
                    <div style="margin-top: 8px; font-size: 12px; color: #00ff88;">
                        Reward: +${mission.reward} points
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="mission-display">
                    <span class="mission-progress">All missions complete! Keep playing!</span>
                </div>
            `;
        }
    }

    updateSidebarAchievements() {
        const container = document.getElementById('sidebar-achievements');
        if (!container) return;

        const unlocked = this.gameState.achievements.filter(a => a.unlocked);
        const total = this.gameState.achievements.length;
        
        container.innerHTML = `
            <div style="margin-bottom: 10px; font-size: 14px; color: #64c8ff;">
                ${unlocked.length} / ${total} Unlocked
            </div>
            <div style="font-size: 12px; opacity: 0.8;">
                Click "Achievements" in main menu to view all
            </div>
        `;
    }

    updateSidebarStats() {
        const container = document.getElementById('sidebar-stats');
        if (!container) return;

        const minutes = Math.floor(this.gameState.timeElapsed / 60);
        const seconds = Math.floor(this.gameState.timeElapsed % 60);
        
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Time:</span>
                    <span style="color: #00ff88;">${minutes}:${seconds.toString().padStart(2, '0')}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Debris Absorbed:</span>
                    <span style="color: #00ff88;">${this.gameState.debrisAbsorbed}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Difficulty:</span>
                    <span style="color: #00ff88;">${this.gameState.difficulty.toFixed(1)}x</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Missions Done:</span>
                    <span style="color: #00ff88;">${this.gameState.completedMissions.length}</span>
                </div>
            </div>
        `;
    }

    updateMissionDisplay() {
        const missionDisplay = document.getElementById('current-mission');
        if (!missionDisplay) return;

        if (this.gameState.currentMission) {
            const mission = this.gameState.currentMission;
            missionDisplay.innerHTML = `
                <span class="mission-title">${mission.title}</span>
                <span class="mission-progress">${mission.description}</span>
            `;
        } else {
            missionDisplay.innerHTML = `
                <span class="mission-title">No Active Mission</span>
                <span class="mission-progress">Keep playing to unlock new missions!</span>
            `;
        }
    }

    showNotification(title, message, type = 'normal') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;

        container.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showAchievementUnlock(achievement) {
        this.showNotification(
            achievement.icon + ' ' + achievement.title,
            achievement.description,
            'achievement'
        );
    }

    showTierUp(tier) {
        this.showNotification(
            '🎉 Tier Up!',
            `You've reached Tier ${tier}!`,
            'tier-up'
        );
    }

    showMissionComplete(mission) {
        this.showNotification(
            '✅ Mission Complete!',
            `${mission.title}: +${mission.reward} points`,
            'achievement'
        );
    }

    showAchievements() {
        const panel = document.getElementById('achievements-panel');
        const list = document.getElementById('achievements-list');
        
        if (!panel || !list) return;

        list.innerHTML = '';
        
        this.gameState.achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : ''}`;
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            `;
            list.appendChild(item);
        });

        panel.classList.add('active');
    }

    showLeaderboard() {
        const panel = document.getElementById('leaderboard-panel');
        const list = document.getElementById('leaderboard-list');
        
        if (!panel || !list) return;

        list.innerHTML = '';
        
        const leaderboard = this.gameState.getLeaderboard();
        
        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-entry rank-${index + 1}`;
            item.innerHTML = `
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-score">${entry.score.toLocaleString()}</div>
            `;
            list.appendChild(item);
        });

        panel.classList.add('active');
    }

    showGameOver() {
        // Save score to leaderboard
        const playerName = prompt('Enter your name for the leaderboard:', 'Player') || 'Player';
        this.gameState.saveToLeaderboard(playerName);

        // Show final stats
        this.showNotification(
            '🎮 Game Over',
            `Final Score: ${this.gameState.score} | Mass: ${this.gameState.mass.toFixed(1)} | Tier: ${this.gameState.tier}`,
            'normal'
        );

        // Show main menu after delay
        setTimeout(() => {
            this.showMenu('main-menu');
            this.showLeaderboard();
        }, 2000);
    }

    hideHUD() {
        document.getElementById('hud').style.display = 'none';
        this.closeSidebar();
    }

    showHUD() {
        document.getElementById('hud').style.display = 'block';
    }
}
