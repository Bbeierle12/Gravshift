import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { GameStateManager } from './GameStateManager.js';
import { EffectsManager } from './EffectsManager.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { RenderManager } from './RenderManager.js';
import { InputManager } from './InputManager.js';

class GravshiftGame {
    constructor() {
        this.container = document.getElementById('game-container');
        
        // Initialize managers
        this.engine = new GameEngine(this.container);
        this.gameState = new GameStateManager();
        this.effects = new EffectsManager(this.engine);
        this.audio = new AudioManager();
        this.ui = new UIManager(this.gameState);
        this.render = new RenderManager(this.engine);
        this.input = new InputManager();
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.player = null;
        this.playerVelocity = new THREE.Vector3();
        this.playerPosition = new THREE.Vector3(0, 0, 0);
        
        // Game settings
        this.debrisSpawnTimer = 0;
        this.debrisSpawnInterval = 2;
        this.maxDebris = 30;
        
        // Time tracking
        this.lastTime = 0;
        this.gameTime = 0;
        
        // Setup hotkeys and event listeners
        this.setupHotkeys();
        this.setupGameEvents();
        
        // Hide HUD initially
        this.ui.hideHUD();
    }

    setupHotkeys() {
        // ESC - Pause/Resume
        this.input.registerHotkey('escape', () => {
            if (this.isRunning && !this.isPaused) {
                this.pause();
            }
            return false; // Prevent default
        });
        
        // F3 - Toggle debug info
        this.input.registerHotkey('f3', () => {
            this.render.toggleDebugInfo();
            return false;
        });
        
        // Number keys 1-9 for quick actions (extensible for future features)
        for (let i = 1; i <= 9; i++) {
            this.input.registerHotkey(i.toString(), () => {
                // Reserved for future quick-select features
                return true;
            });
        }
    }

    setupGameEvents() {
        window.addEventListener('game-start', () => this.startGame());
        window.addEventListener('game-resume', () => this.resume());
        window.addEventListener('game-restart', () => this.restartGame());
        window.addEventListener('game-quit', () => this.quitGame());
    }

    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastTime = performance.now();
        
        // Reset game state
        this.gameState.reset();
        
        // Create player
        this.playerPosition.set(0, 0, 0);
        this.playerVelocity.set(0, 0, 0);
        this.player = this.engine.createPlayer(this.gameState.mass);
        
        // Start first mission
        this.gameState.startNewMission();
        
        // Show HUD
        this.ui.showHUD();
        this.ui.updateHUD();
        
        // Start ambient audio
        this.audio.startAmbient();
        
        // Start game loop
        this.gameLoop(this.lastTime);
    }

    pause() {
        this.isPaused = true;
        this.ui.showMenu('pause-menu');
        this.audio.pause();
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.audio.resume();
    }

    restartGame() {
        this.quitGame();
        this.startGame();
    }

    quitGame() {
        this.isRunning = false;
        this.isPaused = false;
        
        // Clean up
        this.engine.debrisPool.releaseAll();
        this.engine.particlePool.releaseAll();
        this.effects.clear();
        this.audio.stopAmbient();
        this.input.reset();
        
        this.ui.hideHUD();
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            // Update game
            this.update(deltaTime);
            
            // Render
            this.render.render(deltaTime);
        }
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update game time and difficulty
        this.gameTime += deltaTime;
        this.updateDifficulty();
        
        // Handle input and update player
        this.handleInput(deltaTime);
        this.updatePlayer(deltaTime);
        
        // Spawn and update all entities (consolidated)
        this.updateEntities(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update effects and camera
        this.effects.update(deltaTime);
        this.engine.updateCamera(this.playerPosition, deltaTime);
        
        // Update UI
        this.ui.updateHUD();
    }

    updateDifficulty() {
        // Improved difficulty scaling based on player power (mass + tier)
        const powerLevel = this.gameState.mass * this.gameState.tier;
        const timeFactor = Math.min(this.gameTime / 60, 5); // Cap time influence at 5 minutes
        
        // Difficulty based 70% on player power, 30% on time
        this.gameState.difficulty = 1 + (powerLevel / 100) * 0.7 + timeFactor * 0.3;
        this.gameState.timeElapsed = this.gameTime;
        this.gameState.checkAchievements();
    }

    // Consolidated entity update loop
    updateEntities(deltaTime) {
        // Spawn debris
        this.spawnDebris(deltaTime);
        
        // Update all active entities in one pass
        this.engine.update(deltaTime);
    }

    handleInput(deltaTime) {
        const moveSpeed = 20;
        const boostMultiplier = 2;
        const acceleration = new THREE.Vector3();
        
        // Get movement from input manager
        const movement = this.input.getMovementVector();
        acceleration.x = movement.x * moveSpeed;
        acceleration.z = movement.z * moveSpeed;
        
        // Boost
        if (this.input.isBoostPressed()) {
            acceleration.multiplyScalar(boostMultiplier);
            
            // Boost effect (throttled)
            if (!this.lastBoost || Date.now() - this.lastBoost > 100) {
                const direction = acceleration.clone().normalize();
                this.effects.createBoostEffect(this.playerPosition, direction);
                this.audio.playBoost();
                this.lastBoost = Date.now();
            }
        }
        
        // Recycle (R key)
        if (this.input.isRecyclePressed() && (!this.lastRecycle || Date.now() - this.lastRecycle > 1000)) {
            const points = this.gameState.recycle();
            if (points > 0) {
                this.effects.createRecycleEffect(this.playerPosition);
                this.audio.playRecycle();
                this.ui.showNotification('♻️ Recycled!', `+${points} points`, 'normal');
                this.engine.updatePlayer(this.gameState.mass);
                this.lastRecycle = Date.now();
            }
        }
        
        // Apply acceleration
        this.playerVelocity.add(acceleration.multiplyScalar(deltaTime));
        
        // Apply drag
        this.playerVelocity.multiplyScalar(0.95);
    }

    updatePlayer(deltaTime) {
        // Update position
        this.playerPosition.add(this.playerVelocity.clone().multiplyScalar(deltaTime));
        
        // Boundary constraints (soft)
        const boundarySize = 100;
        const pushBack = 0.1;
        
        if (Math.abs(this.playerPosition.x) > boundarySize) {
            this.playerVelocity.x -= Math.sign(this.playerPosition.x) * pushBack;
        }
        if (Math.abs(this.playerPosition.y) > boundarySize) {
            this.playerVelocity.y -= Math.sign(this.playerPosition.y) * pushBack;
        }
        if (Math.abs(this.playerPosition.z) > boundarySize) {
            this.playerVelocity.z -= Math.sign(this.playerPosition.z) * pushBack;
        }
        
        // Update player mesh
        if (this.player) {
            this.player.position.copy(this.playerPosition);
        }
    }

    spawnDebris(deltaTime) {
        this.debrisSpawnTimer += deltaTime;
        
        // Adjust spawn rate based on difficulty
        const spawnInterval = Math.max(0.5, this.debrisSpawnInterval - this.gameState.difficulty * 0.1);
        
        if (this.debrisSpawnTimer >= spawnInterval) {
            this.debrisSpawnTimer = 0;
            
            const activeDebris = this.engine.debrisPool.getActive().length;
            if (activeDebris < this.maxDebris) {
                this.createDebris();
            }
        }
    }

    createDebris() {
        // Random position around player
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        const height = (Math.random() - 0.5) * 40;
        
        const position = new THREE.Vector3(
            this.playerPosition.x + Math.cos(angle) * distance,
            this.playerPosition.y + height,
            this.playerPosition.z + Math.sin(angle) * distance
        );
        
        // Velocity towards player with some randomness
        const toPlayer = new THREE.Vector3()
            .subVectors(this.playerPosition, position)
            .normalize()
            .multiplyScalar(2 + Math.random() * 3);
        
        toPlayer.add(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ));
        
        this.engine.spawnDebris(position, toPlayer, this.gameState.difficulty);
    }

    checkCollisions() {
        const debris = this.engine.debrisPool.getActive();
        const playerRadius = this.player ? this.player.userData.radius : 1;
        
        debris.forEach(d => {
            const distance = d.position.distanceTo(this.playerPosition);
            const debrisRadius = d.geometry.parameters.radius * d.scale.x;
            
            // Check if player can absorb debris
            if (distance < playerRadius + debrisRadius) {
                if (this.gameState.mass >= debrisRadius * 0.8) {
                    // Absorb
                    this.absorbDebris(d);
                } else {
                    // Collision (push back)
                    const pushDirection = new THREE.Vector3()
                        .subVectors(this.playerPosition, d.position)
                        .normalize();
                    this.playerVelocity.add(pushDirection.multiplyScalar(5));
                    this.effects.createCollisionEffect(d.position);
                    this.audio.playCollision(0.5);
                }
            }
        });
    }

    absorbDebris(debris) {
        const debrisMass = debris.userData.mass;
        const debrisColor = debris.material.color.getHex();
        
        // Create absorption effect
        this.effects.createAbsorptionEffect(
            debris.position,
            this.playerPosition,
            debrisColor
        );
        
        // Play sound
        this.audio.playAbsorption(this.gameState.mass);
        
        // Add mass and check for events
        const result = this.gameState.addMass(debrisMass * 0.5);
        
        // Update player size
        this.engine.updatePlayer(this.gameState.mass);
        this.effects.updatePlayerGlow(this.gameState.mass);
        
        // Handle tier up
        if (result.tierUp) {
            this.effects.createTierUpEffect(this.playerPosition, this.gameState.tier);
            this.audio.playTierUp(this.gameState.tier);
            this.ui.showTierUp(this.gameState.tier);
        }
        
        // Handle achievements
        if (result.achievements && result.achievements.length > 0) {
            result.achievements.forEach(achievement => {
                this.ui.showAchievementUnlock(achievement);
                this.audio.playAchievement();
            });
        }
        
        // Check for mission completion
        if (this.gameState.currentMission) {
            const previousMission = this.gameState.currentMission;
            if (previousMission.condition()) {
                const completed = this.gameState.completeMission();
                if (completed) {
                    this.ui.showMissionComplete(completed);
                    this.audio.playMissionComplete();
                }
            }
        }
        
        // Remove debris
        this.engine.debrisPool.release(debris);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GravshiftGame();
    window.game = game; // For debugging
});
