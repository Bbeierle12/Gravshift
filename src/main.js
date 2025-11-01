import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { GameStateManager } from './GameStateManager.js';
import { EffectsManager } from './EffectsManager.js';
import { AudioManager } from './AudioManager.js';
import { UIManager } from './UIManager.js';
import { RenderManager } from './RenderManager.js';
import { InputManager } from './InputManager.js';
import { ResourceSystem } from './ResourceSystem.js';
import { BuildingSystem, BuildingType, BUILDING_CONFIGS } from './BuildingSystem.js';
import { EnvironmentalSystem } from './EnvironmentalSystem.js';

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
        
        // Initialize new systems
        this.resources = new ResourceSystem();
        this.buildings = new BuildingSystem(this.engine.scene);
        this.environment = new EnvironmentalSystem(this.engine.scene);
        
        // Building mode state
        this.buildMode = false;
        this.selectedBuildingType = null;
        
        // Camera rotation state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Gravity field state
        this.gravityMode = 'neutral'; // 'attract', 'repel', 'neutral'
        this.gravityStrength = 15;
        this.gravityRange = 30;
        
        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.player = null;
        this.playerVelocity = new THREE.Vector3();
        this.playerPosition = new THREE.Vector3(0, 0, 0);
        
        // Carried debris system
        this.carriedDebris = [];
        this.maxCarriedDebris = 5;
        this.grabRange = 5;
        
        // Game settings
        this.debrisSpawnTimer = 0;
        this.debrisSpawnInterval = 2;
        this.maxDebris = 90;
        
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
        
        // G - Toggle gravity mode (Attract/Repel/Neutral)
        this.input.registerHotkey('g', () => {
            if (this.isRunning && !this.isPaused && !this.buildMode) {
                this.cycleGravityMode();
            }
            return false;
        });
        
        // B - Toggle build mode
        this.input.registerHotkey('b', () => {
            if (this.isRunning && !this.isPaused) {
                this.toggleBuildMode();
            }
            return false;
        });
        
        // Number keys 1-3 for building selection
        this.input.registerHotkey('1', () => {
            if (this.buildMode) {
                this.selectBuilding(BuildingType.RECYCLER);
            }
            return false;
        });
        
        this.input.registerHotkey('2', () => {
            if (this.buildMode) {
                this.selectBuilding(BuildingType.TREE);
            }
            return false;
        });
        
        this.input.registerHotkey('3', () => {
            if (this.buildMode) {
                this.selectBuilding(BuildingType.OXYGEN_GENERATOR);
            }
            return false;
        });
        
        // Mouse click for building placement
        window.addEventListener('click', (e) => {
            if (this.buildMode && this.selectedBuildingType && !e.target.closest('.menu, .panel')) {
                this.tryPlaceBuilding();
            }
        });
        
        // Mouse drag for camera rotation
        window.addEventListener('mousedown', (e) => {
            // Only start drag if left button and not in build mode
            if (e.button === 0 && !this.buildMode && !e.target.closest('.menu, .panel, .sidebar')) {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                document.body.style.cursor = 'grabbing';
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.isRunning && !this.isPaused) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                // Rotate camera based on mouse movement
                const sensitivity = 0.005;
                this.engine.rotateCameraH(-deltaX * sensitivity);
                this.engine.rotateCameraV(-deltaY * sensitivity);
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.isDragging = false;
                document.body.style.cursor = 'default';
            }
        });
        
        // Stop dragging if mouse leaves window
        window.addEventListener('mouseleave', () => {
            this.isDragging = false;
            document.body.style.cursor = 'default';
        });
        
        // Mouse wheel for zoom and gravity strength adjustment
        window.addEventListener('wheel', (e) => {
            if (this.isRunning && !this.isPaused) {
                if (e.ctrlKey) {
                    // Ctrl + Wheel: Adjust gravity strength
                    e.preventDefault();
                    this.gravityStrength = Math.max(5, Math.min(50, this.gravityStrength - e.deltaY * 0.01));
                    console.log(`Gravity strength: ${this.gravityStrength.toFixed(1)}`);
                } else {
                    // Wheel only: Zoom camera
                    e.preventDefault();
                    this.handleZoom(e.deltaY);
                }
            }
        }, { passive: false });
        
        // Plus/Minus keys for zoom (alternative controls)
        this.input.registerHotkey('equal', () => { // + key (same as =)
            if (this.isRunning && !this.isPaused) {
                this.handleZoom(-100); // Zoom in
            }
            return false;
        });
        
        this.input.registerHotkey('minus', () => { // - key
            if (this.isRunning && !this.isPaused) {
                this.handleZoom(100); // Zoom out
            }
            return false;
        });
        
        // E - Grab/Release debris
        this.input.registerHotkey('e', () => {
            if (this.isRunning && !this.isPaused && !this.buildMode) {
                this.grabNearbyDebris();
            }
            return false;
        });
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
        
        // Initialize environmental zones
        this.environment.createZone(new THREE.Vector3(0, 0, 0), 50, 10);
        this.environment.createZone(new THREE.Vector3(40, 0, 40), 40, 5);
        this.environment.createZone(new THREE.Vector3(-40, 0, -40), 40, 5);
        
        // Create debris nodes (cyan crystals that spawn debris)
        this.engine.createDebrisNode(new THREE.Vector3(30, 0, 20), 3000, 5);
        this.engine.createDebrisNode(new THREE.Vector3(-40, 10, -30), 2500, 4);
        this.engine.createDebrisNode(new THREE.Vector3(0, -20, 50), 4000, 6);
        this.engine.createDebrisNode(new THREE.Vector3(50, 5, -40), 3500, 5);
        
        // Create recycler globes (red wireframe spheres that absorb debris)
        this.engine.createRecycler(new THREE.Vector3(60, 0, 0), 10);
        this.engine.createRecycler(new THREE.Vector3(-60, 15, -20), 8);
        this.engine.createRecycler(new THREE.Vector3(0, -30, 60), 12);
        this.engine.createRecycler(new THREE.Vector3(-50, -10, 40), 9);
        
        // Subscribe to resource updates
        this.resources.subscribe(resources => {
            this.updateResourceDisplay(resources);
        });
        
        // Show HUD
        this.ui.showHUD();
        this.ui.updateHUD();
        this.updateResourceDisplay(this.resources.getResources());
        
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
        
        // Update carried debris positions
        this.updateCarriedDebris(deltaTime);
        
        // Spawn and update all entities (consolidated)
        this.updateEntities(deltaTime);
        
        // Update debris nodes and recyclers
        const currentTime = Date.now();
        this.engine.updateDebrisNodes(currentTime, this.playerPosition);
        const absorbed = this.engine.updateRecyclers(currentTime, this.carriedDebris);
        
        // Process absorbed debris
        if (absorbed && absorbed.length > 0) {
            absorbed.forEach(item => {
                this.processRecyclerAbsorption(item.debris, item.recycler);
            });
        }
        
        // Update new systems
        this.buildings.update(deltaTime);
        this.environment.updateZones(deltaTime, this.buildings.getBuildings());
        
        // Process building effects
        const debris = this.engine.debrisPool.getActive();
        this.buildings.processRecyclers(deltaTime, debris, this.resources);
        this.buildings.processOxygenGeneration(deltaTime, this.resources);
        
        // Drain oxygen over time
        this.resources.drainOxygen(deltaTime, 0.5);
        
        // Check collisions
        this.checkCollisions();
        
        // Update effects and camera
        this.effects.update(deltaTime);
        this.engine.updateCamera(this.playerPosition, deltaTime);
        
        // Update gravity field visualization
        this.effects.updateGravityField(
            this.playerPosition,
            this.gravityMode,
            this.gravityRange,
            this.gravityStrength
        );
        
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
        
        // Apply gravity field to debris
        this.applyGravityField(deltaTime);
        
        // Update all active entities in one pass
        this.engine.update(deltaTime);
    }

    handleInput(deltaTime) {
        const moveSpeed = 20;
        const boostMultiplier = 2;
        const acceleration = new THREE.Vector3();
        
        // Get movement from input manager (now includes Y axis)
        const movement = this.input.getMovementVector();
        acceleration.x = movement.x * moveSpeed;
        acceleration.y = movement.y * moveSpeed; // Enable vertical movement
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
            // Skip debris being carried
            if (this.carriedDebris.includes(d)) return;
            
            const distance = d.position.distanceTo(this.playerPosition);
            const debrisRadius = d.geometry.parameters.radius * d.scale.x;
            const debrisMass = d.userData.mass;
            
            // Check if player can absorb debris
            if (distance < playerRadius + debrisRadius) {
                // Player can absorb debris if their mass is larger
                if (this.gameState.mass > debrisMass * 0.5) {
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
        
        // Award resources based on debris type
        const resourceType = Math.random();
        if (resourceType < 0.4) {
            this.resources.addResource('plastic', debrisMass * 0.3);
        } else if (resourceType < 0.7) {
            this.resources.addResource('metal', debrisMass * 0.2);
        } else {
            this.resources.addResource('organic', debrisMass * 0.25);
        }
        
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
    
    // Grab/Release debris system
    grabNearbyDebris() {
        if (this.carriedDebris.length >= this.maxCarriedDebris) {
            this.ui.showNotification('⚠️ Carrying too much!', `Max ${this.maxCarriedDebris} debris`, 'normal');
            return;
        }
        
        // Find nearest debris within grab range
        const debris = this.engine.debrisPool.getActive();
        let nearest = null;
        let minDistance = this.grabRange;
        
        debris.forEach(d => {
            // Skip debris already being carried
            if (this.carriedDebris.includes(d)) return;
            
            const distance = d.position.distanceTo(this.playerPosition);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = d;
            }
        });
        
        if (nearest) {
            // Grab the debris
            this.carriedDebris.push(nearest);
            nearest.userData.isCarried = true;
            
            // Visual effect
            this.effects.createAbsorptionEffect(
                nearest.position,
                this.playerPosition,
                nearest.material.color.getHex()
            );
            
            this.audio.playAbsorption(0.5);
            this.ui.showNotification('📦 Grabbed debris', `Carrying ${this.carriedDebris.length}/${this.maxCarriedDebris}`, 'normal');
        } else {
            this.ui.showNotification('❌ No debris nearby', `Get within ${this.grabRange}m`, 'normal');
        }
    }
    
    updateCarriedDebris(deltaTime) {
        // Remove any debris that was absorbed or destroyed
        this.carriedDebris = this.carriedDebris.filter(d => 
            this.engine.debrisPool.getActive().includes(d)
        );
        
        // Update positions of carried debris to orbit around player
        this.carriedDebris.forEach((debris, index) => {
            const angle = (index / this.carriedDebris.length) * Math.PI * 2 + this.gameTime;
            const orbitRadius = 3 + this.player.userData.radius;
            const height = Math.sin(this.gameTime * 2 + index) * 1.5;
            
            const targetX = this.playerPosition.x + Math.cos(angle) * orbitRadius;
            const targetY = this.playerPosition.y + height;
            const targetZ = this.playerPosition.z + Math.sin(angle) * orbitRadius;
            
            const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
            
            // Smoothly move debris to target position
            debris.position.lerp(targetPos, deltaTime * 5);
            
            // Zero out velocity while carried
            debris.userData.velocity.set(0, 0, 0);
            
            // Rotate carried debris
            debris.rotation.x += deltaTime * 2;
            debris.rotation.y += deltaTime * 2;
        });
    }
    
    processRecyclerAbsorption(debris, recycler) {
        // Trigger absorption effect in engine
        const debrisData = this.engine.absorbDebris(debris, recycler);
        
        // Remove from carried debris array
        const index = this.carriedDebris.indexOf(debris);
        if (index > -1) {
            this.carriedDebris.splice(index, 1);
        }
        
        // Award resources based on debris mass
        const debrisMass = debrisData.mass;
        const resourceAmount = debrisMass * 2; // Higher reward for recycling
        
        // Random resource type
        const resourceType = Math.random();
        if (resourceType < 0.3) {
            this.resources.addResource('plastic', resourceAmount);
        } else if (resourceType < 0.6) {
            this.resources.addResource('metal', resourceAmount);
        } else if (resourceType < 0.9) {
            this.resources.addResource('organic', resourceAmount);
        } else {
            this.resources.addResource('seeds', Math.floor(resourceAmount * 0.5));
        }
        
        // Add points
        this.gameState.addScore(Math.floor(debrisMass * 10));
        
        // Play sound and show notification
        this.audio.playRecycle();
        
        // Show notification when carrying count changes
        if (this.carriedDebris.length === 0) {
            this.ui.showNotification('♻️ All debris recycled!', `+${Math.floor(resourceAmount)} resources`, 'success');
        }
    }
    
    // Gravity field methods
    cycleGravityMode() {
        const modes = ['neutral', 'attract', 'repel'];
        const currentIndex = modes.indexOf(this.gravityMode);
        this.gravityMode = modes[(currentIndex + 1) % modes.length];
        
        // Visual and audio feedback
        const modeNames = {
            'neutral': '⚪ Neutral Field',
            'attract': '🔵 Attract Field',
            'repel': '🔴 Repel Field'
        };
        
        this.ui.showNotification(modeNames[this.gravityMode], 'Gravity mode changed', 'normal');
        this.audio.playBoost(); // Use boost sound for mode change
        
        console.log(`Gravity mode: ${this.gravityMode}`);
    }
    
    applyGravityField(deltaTime) {
        if (this.gravityMode === 'neutral') return;
        
        const debris = this.engine.debrisPool.getActive();
        const isAttract = this.gravityMode === 'attract';
        
        debris.forEach(d => {
            // Skip debris being carried
            if (this.carriedDebris.includes(d)) return;
            
            const toPlayer = new THREE.Vector3().subVectors(this.playerPosition, d.position);
            const distance = toPlayer.length();
            
            // Only affect debris within range
            if (distance < this.gravityRange && distance > 0.1) {
                // Gravity falls off with distance (inverse square law)
                const falloff = 1 - (distance / this.gravityRange);
                const strength = this.gravityStrength * falloff * falloff;
                
                // Normalize direction and apply force
                toPlayer.normalize();
                const force = toPlayer.multiplyScalar(strength * deltaTime);
                
                // Apply force (attract or repel)
                if (isAttract) {
                    d.userData.velocity.add(force);
                } else {
                    d.userData.velocity.sub(force);
                }
            }
        });
    }
    
    handleZoom(delta) {
        // Get current camera distance
        const currentDistance = this.engine.getCameraDistance();
        
        // Calculate new distance (zoom in = decrease distance, zoom out = increase)
        const zoomSpeed = 0.1;
        const zoomDelta = delta * zoomSpeed;
        const newDistance = Math.max(5, Math.min(100, currentDistance + zoomDelta));
        
        // Apply new distance
        this.engine.setCameraDistance(newDistance);
        
        // Show zoom level notification (throttled)
        if (!this.lastZoomNotify || Date.now() - this.lastZoomNotify > 500) {
            const zoomPercent = Math.round(((100 - newDistance) / 95) * 100);
            this.ui.showNotification('🔍 Zoom', `${zoomPercent}%`, 'normal');
            this.lastZoomNotify = Date.now();
        }
    }
    
    // Building mode methods
    toggleBuildMode() {
        this.buildMode = !this.buildMode;
        const buildUI = document.getElementById('build-ui');
        if (buildUI) {
            buildUI.style.display = this.buildMode ? 'block' : 'none';
        }
        console.log(`Build mode: ${this.buildMode ? 'ON' : 'OFF'}`);
    }
    
    selectBuilding(type) {
        this.selectedBuildingType = type;
        const config = BUILDING_CONFIGS[type];
        console.log(`Selected: ${config.name}`);
        
        // Update UI to show selection
        document.querySelectorAll('#build-ui .building-option').forEach(el => {
            el.classList.remove('selected');
        });
        const option = document.querySelector(`#build-ui .building-option[data-type="${type}"]`);
        if (option) {
            option.classList.add('selected');
        }
    }
    
    tryPlaceBuilding() {
        if (!this.selectedBuildingType) return;

        const config = BUILDING_CONFIGS[this.selectedBuildingType];

        // Check if player can afford it
        if (!this.resources.canAfford(config.cost)) {
            console.log('Not enough resources!');
            this.ui.showNotification('❌ Not enough resources', '', 'error');
            return;
        }

        let placePosition;

        // Special handling for trees - snap to zone surface
        if (this.selectedBuildingType === BuildingType.TREE) {
            placePosition = this.findNearestZonePosition();
            if (!placePosition) {
                this.ui.showNotification('❌ No zone nearby', 'Trees must be placed on environmental zones', 'error');
                return;
            }
        } else {
            // Calculate placement position in front of player for other buildings
            const camera = this.engine.camera;
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.y = 0; // Keep on ground plane
            direction.normalize();

            placePosition = this.playerPosition.clone()
                .add(direction.multiplyScalar(10));
            // Keep building at player's current height instead of forcing to ground
        }

        // Try to place building
        const building = this.buildings.placeBuilding(
            this.selectedBuildingType,
            placePosition
        );

        if (building) {
            // Deduct resources
            this.resources.deductCosts(config.cost);
            console.log(`Placed ${config.name}!`);
            this.ui.showNotification(`✅ ${config.name} placed`, config.effect, 'success');
            this.audio.playAbsorption(1); // Use absorption sound for building placement
        } else {
            console.log('Cannot place building here - too close to another building!');
            this.ui.showNotification('❌ Cannot place here', 'Too close to another building', 'error');
        }
    }

    findNearestZonePosition() {
        // Get all zones
        const zones = this.environment.getZones();
        if (zones.length === 0) return null;

        // Calculate target position in front of player
        const camera = this.engine.camera;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.normalize();

        const targetPosition = this.playerPosition.clone()
            .add(direction.multiplyScalar(15));

        // Find nearest zone to target position
        let nearestZone = null;
        let minDistance = Infinity;

        zones.forEach(zone => {
            const distance = zone.position.distanceTo(targetPosition);
            if (distance < minDistance && distance < zone.radius + 20) {
                minDistance = distance;
                nearestZone = zone;
            }
        });

        if (!nearestZone) return null;

        // Calculate position on zone surface
        // Get direction from zone center to target
        const toTarget = new THREE.Vector3()
            .subVectors(targetPosition, nearestZone.position)
            .normalize();

        // Place on surface of zone
        const surfacePosition = nearestZone.position.clone()
            .add(toTarget.multiplyScalar(nearestZone.radius));

        return surfacePosition;
    }
    
    updateResourceDisplay(resources) {
        const resourcesEl = document.getElementById('resources');
        if (resourcesEl) {
            resourcesEl.innerHTML = `
                <div class="resource-item">
                    <span class="resource-icon">🔷</span>
                    <span class="resource-label">Plastic:</span>
                    <span class="resource-value">${Math.floor(resources.plastic)}</span>
                </div>
                <div class="resource-item">
                    <span class="resource-icon">⚙️</span>
                    <span class="resource-label">Metal:</span>
                    <span class="resource-value">${Math.floor(resources.metal)}</span>
                </div>
                <div class="resource-item">
                    <span class="resource-icon">🌿</span>
                    <span class="resource-label">Organic:</span>
                    <span class="resource-value">${Math.floor(resources.organic)}</span>
                </div>
                <div class="resource-item">
                    <span class="resource-icon">🌱</span>
                    <span class="resource-label">Seeds:</span>
                    <span class="resource-value">${Math.floor(resources.seeds)}</span>
                </div>
                <div class="resource-item ${resources.oxygen < 30 ? 'low-oxygen' : ''}">
                    <span class="resource-icon">💨</span>
                    <span class="resource-label">Oxygen:</span>
                    <span class="resource-value">${Math.floor(resources.oxygen)}%</span>
                </div>
            `;
        }
        
        // Update building costs display
        if (this.buildMode) {
            this.updateBuildingCostsDisplay(resources);
        }
    }
    
    updateBuildingCostsDisplay(resources) {
        Object.values(BuildingType).forEach(type => {
            const config = BUILDING_CONFIGS[type];
            const option = document.querySelector(`#build-ui .building-option[data-type="${type}"]`);
            if (option) {
                const canAfford = this.resources.canAfford(config.cost);
                option.classList.toggle('affordable', canAfford);
                option.classList.toggle('unaffordable', !canAfford);
            }
        });
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GravshiftGame();
    window.game = game; // For debugging
});
