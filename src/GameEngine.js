import * as THREE from 'three';

// Object Pool for efficient memory management
export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];
        
        // Pre-create objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }

    getActive() {
        return this.active;
    }
}

// Optimized 3D Engine
export class GameEngine {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.setupScene();
        this.setupObjectPools();
        this.setupLighting();
        
        // Camera settings
        this.camera.position.z = 50;
        this.cameraDistance = 50; // Initial camera distance
        this.cameraAngleH = 0; // Horizontal rotation angle (yaw)
        this.cameraAngleV = 0.3; // Vertical rotation angle (pitch), slight downward angle
        this.cameraOffset = new THREE.Vector3(0, 15, 50);
        this.cameraShake = { x: 0, y: 0, intensity: 0 };
        
        // Window resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupScene() {
        // Space background with stars
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];
        
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 400;
            const y = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            starVertices.push(x, y, z);
        }
        
        starGeometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(starVertices, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
        
        // Nebula effect
        this.scene.fog = new THREE.FogExp2(0x000511, 0.002);
        this.scene.background = new THREE.Color(0x000511);
    }

    setupObjectPools() {
        // Debris pool
        this.debrisPool = new ObjectPool(
            () => this.createDebris(),
            (debris) => this.resetDebris(debris),
            100
        );
        
        // Particle pool
        this.particlePool = new ObjectPool(
            () => this.createParticle(),
            (particle) => this.resetParticle(particle),
            400
        );
        
        // Debris nodes and recyclers
        this.debrisNodes = [];
        this.recyclers = [];
    }

    createDebris() {
        const size = 0.5 + Math.random() * 1.5;
        const geometry = new THREE.IcosahedronGeometry(size, 0);
        
        // Determine if this is resource or pollution (10% resource, 90% pollution)
        const isResource = Math.random() < 0.1;
        
        let color, emissiveColor;
        
        if (isResource) {
            // Resource debris - bright, valuable colors
            const resourceColors = [
                { color: 0x00ff88, emissive: 0x00aa44 }, // Green - organic
                { color: 0xffc864, emissive: 0xaa8432 }, // Gold - metal
                { color: 0x64c8ff, emissive: 0x3264aa }, // Blue - plastic
                { color: 0xc864ff, emissive: 0x8432aa }  // Purple - seeds
            ];
            const chosen = resourceColors[Math.floor(Math.random() * resourceColors.length)];
            color = chosen.color;
            emissiveColor = chosen.emissive;
        } else {
            // Pollution debris - dull, gray/brown colors
            const pollutionColors = [
                { color: 0x4a4a4a, emissive: 0x2a2a2a }, // Dark gray
                { color: 0x665544, emissive: 0x332211 }, // Brown
                { color: 0x554455, emissive: 0x221122 }, // Dark purple-gray
                { color: 0x444444, emissive: 0x222222 }  // Darker gray
            ];
            const chosen = pollutionColors[Math.floor(Math.random() * pollutionColors.length)];
            color = chosen.color;
            emissiveColor = chosen.emissive;
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissiveColor,
            emissiveIntensity: isResource ? 0.5 : 0.2,
            roughness: isResource ? 0.3 : 0.7,
            metalness: isResource ? 0.7 : 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add glow effect (brighter for resources)
        const glowGeometry = new THREE.IcosahedronGeometry(size * 1.2, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: isResource ? 0.3 : 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        // Store properties
        mesh.userData = {
            velocity: new THREE.Vector3(),
            rotation: new THREE.Vector3(
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01,
                Math.random() * 0.02 - 0.01
            ),
            mass: size,
            glow: glow,
            isResource: isResource, // New property
            resourceType: isResource ? this.getResourceType(color) : null
        };
        
        return mesh;
    }
    
    getResourceType(color) {
        // Map colors to resource types
        if (color === 0x00ff88) return 'organic';
        if (color === 0xffc864) return 'metal';
        if (color === 0x64c8ff) return 'plastic';
        if (color === 0xc864ff) return 'seeds';
        return 'plastic'; // default
    }

    resetDebris(debris) {
        debris.position.set(0, 0, 0);
        debris.userData.velocity.set(0, 0, 0);
        debris.visible = false;
        this.scene.remove(debris);
    }

    createParticle() {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = {
            velocity: new THREE.Vector3(),
            life: 1.0,
            maxLife: 1.0
        };
        
        return mesh;
    }

    resetParticle(particle) {
        particle.position.set(0, 0, 0);
        particle.userData.velocity.set(0, 0, 0);
        particle.userData.life = 1.0;
        particle.visible = false;
        this.scene.remove(particle);
    }

    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x404040, 1);
        this.scene.add(ambient);
        
        // Directional light
        const directional = new THREE.DirectionalLight(0xffffff, 0.5);
        directional.position.set(10, 10, 10);
        this.scene.add(directional);
        
        // Point light for player glow
        this.playerLight = new THREE.PointLight(0x64c8ff, 1, 50);
        this.scene.add(this.playerLight);
    }

    createPlayer(mass) {
        if (this.player) {
            this.scene.remove(this.player);
        }
        
        const radius = Math.max(1, Math.cbrt(mass));
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x64c8ff,
            emissive: 0x0088ff,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.7
        });
        
        this.player = new THREE.Mesh(geometry, material);
        
        // Add glow
        const glowGeometry = new THREE.SphereGeometry(radius * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x64c8ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.player.add(glow);
        
        this.player.userData = {
            mass: mass,
            radius: radius,
            glow: glow
        };
        
        this.scene.add(this.player);
        return this.player;
    }

    updatePlayer(mass) {
        if (!this.player) return;
        
        const newRadius = Math.max(1, Math.cbrt(mass));
        this.player.scale.set(
            newRadius / this.player.userData.radius,
            newRadius / this.player.userData.radius,
            newRadius / this.player.userData.radius
        );
        
        this.player.userData.mass = mass;
        this.player.userData.radius = newRadius;
        
        // Update glow intensity based on mass
        const emissiveIntensity = 0.5 + (mass / 100) * 0.5;
        this.player.material.emissiveIntensity = Math.min(emissiveIntensity, 1);
    }

    spawnDebris(position, velocity, difficulty = 1) {
        const debris = this.debrisPool.acquire();
        debris.position.copy(position);
        debris.userData.velocity.copy(velocity);
        debris.visible = true;
        
        // Scale size based on difficulty
        const scale = 0.8 + difficulty * 0.2;
        debris.scale.set(scale, scale, scale);
        
        this.scene.add(debris);
        return debris;
    }

    spawnParticles(position, count = 10, color = 0x64c8ff) {
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const particle = this.particlePool.acquire();
            particle.position.copy(position);
            
            // Random velocity
            particle.userData.velocity.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            
            particle.material.color.setHex(color);
            particle.userData.life = 1.0;
            particle.userData.maxLife = 1.0 + Math.random();
            particle.visible = true;
            
            this.scene.add(particle);
            particles.push(particle);
        }
        
        return particles;
    }

    updateDebris(deltaTime) {
        const debris = this.debrisPool.getActive();
        const toRemove = [];
        
        debris.forEach(d => {
            // Update position
            d.position.add(d.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Rotation
            d.rotation.x += d.userData.rotation.x;
            d.rotation.y += d.userData.rotation.y;
            d.rotation.z += d.userData.rotation.z;
            
            // Remove if too far
            if (d.position.length() > 150) {
                toRemove.push(d);
            }
        });
        
        toRemove.forEach(d => this.debrisPool.release(d));
    }

    updateParticles(deltaTime) {
        const particles = this.particlePool.getActive();
        const toRemove = [];
        
        particles.forEach(p => {
            // Update position
            p.position.add(p.userData.velocity.clone().multiplyScalar(deltaTime));
            
            // Update life
            p.userData.life -= deltaTime / p.userData.maxLife;
            p.material.opacity = p.userData.life;
            p.scale.setScalar(p.userData.life);
            
            if (p.userData.life <= 0) {
                toRemove.push(p);
            }
        });
        
        toRemove.forEach(p => this.particlePool.release(p));
    }

    updateCamera(playerPosition, deltaTime) {
        if (!this.player) return;
        
        // Calculate camera offset based on angles and distance
        const offsetX = Math.sin(this.cameraAngleH) * this.cameraDistance;
        const offsetZ = Math.cos(this.cameraAngleH) * this.cameraDistance;
        const offsetY = Math.sin(this.cameraAngleV) * this.cameraDistance * 0.5 + this.cameraDistance * 0.2;
        
        this.cameraOffset.set(offsetX, offsetY, offsetZ);
        
        // Smooth camera follow
        const targetPosition = playerPosition.clone().add(this.cameraOffset);
        this.camera.position.lerp(targetPosition, deltaTime * 2);
        
        // Apply camera shake
        if (this.cameraShake.intensity > 0) {
            this.camera.position.x += (Math.random() - 0.5) * this.cameraShake.intensity;
            this.camera.position.y += (Math.random() - 0.5) * this.cameraShake.intensity;
            this.cameraShake.intensity *= 0.9;
        }
        
        // Look at player
        this.camera.lookAt(playerPosition);
        
        // Update player light
        this.playerLight.position.copy(playerPosition);
    }
    
    getCameraDistance() {
        return this.cameraDistance;
    }
    
    setCameraDistance(distance) {
        this.cameraDistance = Math.max(5, Math.min(100, distance));
    }
    
    rotateCameraH(deltaAngle) {
        this.cameraAngleH += deltaAngle;
    }
    
    rotateCameraV(deltaAngle) {
        // Clamp vertical angle to prevent camera flipping
        this.cameraAngleV = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraAngleV + deltaAngle));
    }
    
    screenShake(intensity = 1) {
        this.cameraShake.intensity = intensity;
    }

    createDebrisNode(position, spawnRate = 2000, maxDebris = 5) {
        // Create node geometry - a crystalline structure
        const nodeGeometry = new THREE.OctahedronGeometry(3, 0);
        const nodeMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(position);
        
        // Add glow effect
        const glowGeometry = new THREE.OctahedronGeometry(3.5, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        node.add(glow);
        
        // Add rotating rings around node
        const ringGeometry = new THREE.TorusGeometry(5, 0.2, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });
        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring2.rotation.x = Math.PI / 2;
        node.add(ring1);
        node.add(ring2);
        
        // Node data
        node.userData = {
            type: 'debrisNode',
            spawnRate: spawnRate,
            maxDebris: maxDebris,
            lastSpawn: 0,
            activeDebris: [],
            rings: [ring1, ring2],
            glow: glow
        };
        
        this.debrisNodes.push(node);
        this.scene.add(node);
        return node;
    }
    
    createRecycler(position, radius = 8) {
        // Create red wireframe globe
        const recyclerGeometry = new THREE.SphereGeometry(radius, 16, 16);
        const recyclerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });
        
        const recycler = new THREE.Mesh(recyclerGeometry, recyclerMaterial);
        recycler.position.copy(position);
        
        // Add inner glow sphere
        const innerGeometry = new THREE.SphereGeometry(radius * 0.9, 16, 16);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.1
        });
        const innerGlow = new THREE.Mesh(innerGeometry, innerMaterial);
        recycler.add(innerGlow);
        
        // Add particle effect in center
        const coreGeometry = new THREE.SphereGeometry(1, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 1
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        recycler.add(core);
        
        // Recycler data
        recycler.userData = {
            type: 'recycler',
            radius: radius,
            pullStrength: 100,
            core: core,
            innerGlow: innerGlow,
            pulsePhase: Math.random() * Math.PI * 2
        };
        
        this.recyclers.push(recycler);
        this.scene.add(recycler);
        return recycler;
    }
    
    updateDebrisNodes(currentTime, playerPosition) {
        this.debrisNodes.forEach(node => {
            // Rotate the node
            node.rotation.y += 0.01;
            node.rotation.x += 0.005;
            
            // Rotate rings
            node.userData.rings[0].rotation.z += 0.02;
            node.userData.rings[1].rotation.y += 0.02;
            
            // Pulse glow
            const pulse = Math.sin(currentTime * 0.002) * 0.2 + 0.3;
            node.userData.glow.material.opacity = pulse;
            
            // Check if should spawn debris
            if (currentTime - node.userData.lastSpawn > node.userData.spawnRate &&
                node.userData.activeDebris.length < node.userData.maxDebris) {
                
                // Spawn debris near node
                const angle = Math.random() * Math.PI * 2;
                const distance = 5 + Math.random() * 3;
                const spawnPos = new THREE.Vector3(
                    node.position.x + Math.cos(angle) * distance,
                    node.position.y + (Math.random() - 0.5) * 3,
                    node.position.z + Math.sin(angle) * distance
                );
                
                const velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5
                );
                
                const debris = this.spawnDebris(spawnPos, velocity);
                node.userData.activeDebris.push(debris);
                node.userData.lastSpawn = currentTime;
                
                // Spawn effect
                this.spawnParticles(spawnPos, 5, 0x00ffff);
            }
            
            // Clean up collected debris from tracking
            node.userData.activeDebris = node.userData.activeDebris.filter(debris => 
                this.debrisPool.getActive().includes(debris)
            );
        });
    }
    
    updateRecyclers(currentTime, carriedDebris) {
        const absorbed = []; // Track absorbed debris
        const allDebris = this.debrisPool.getActive();
        
        this.recyclers.forEach(recycler => {
            // Rotate wireframe globe
            recycler.rotation.y += 0.005;
            recycler.rotation.x += 0.003;
            
            // Pulse core
            const pulse = Math.sin(currentTime * 0.003 + recycler.userData.pulsePhase) * 0.5 + 1;
            recycler.userData.core.scale.set(pulse, pulse, pulse);
            
            // Pulse wireframe opacity
            const opacity = Math.sin(currentTime * 0.002) * 0.2 + 0.6;
            recycler.material.opacity = opacity;
            
            const recyclerPos = recycler.position;
            
            // Check carried debris for absorption
            if (carriedDebris && carriedDebris.length > 0) {
                carriedDebris.forEach(debris => {
                    const distance = debris.position.distanceTo(recyclerPos);
                    
                    if (distance < recycler.userData.radius * 1.5) {
                        // Pull debris towards recycler
                        const direction = recyclerPos.clone().sub(debris.position).normalize();
                        const pullForce = (1 - distance / (recycler.userData.radius * 1.5)) * 
                                        recycler.userData.pullStrength;
                        
                        debris.userData.velocity.add(
                            direction.multiplyScalar(pullForce * 0.01)
                        );
                        
                        // Absorb if very close
                        if (distance < recycler.userData.radius * 0.5) {
                            absorbed.push({
                                debris: debris,
                                recycler: recycler
                            });
                        }
                    }
                });
            }
            
            // Check debris seeking recyclers
            allDebris.forEach(debris => {
                if (debris.userData.seekingRecycler) {
                    const distance = debris.position.distanceTo(recyclerPos);
                    
                    // Pull seeking debris strongly
                    if (distance < recycler.userData.radius * 2) {
                        const direction = recyclerPos.clone().sub(debris.position).normalize();
                        const pullForce = recycler.userData.pullStrength * 2;
                        
                        debris.userData.velocity.add(
                            direction.multiplyScalar(pullForce * 0.02)
                        );
                        
                        // Absorb if close
                        if (distance < recycler.userData.radius * 0.7) {
                            absorbed.push({
                                debris: debris,
                                recycler: recycler,
                                seeking: true
                            });
                        }
                    }
                }
            });
        });
        
        return absorbed; // Return list of absorbed debris for game logic to handle
    }
    
    absorbDebris(debris, recycler) {
        // Create absorption effect
        this.spawnParticles(debris.position, 20, 0xff6600);
        
        // Flash the recycler
        recycler.userData.innerGlow.material.opacity = 0.5;
        setTimeout(() => {
            if (recycler.userData.innerGlow && recycler.userData.innerGlow.material) {
                recycler.userData.innerGlow.material.opacity = 0.1;
            }
        }, 200);
        
        // Store debris data before release
        const debrisData = {
            mass: debris.userData.mass || 1,
            position: debris.position.clone()
        };
        
        // Remove debris
        this.debrisPool.release(debris);
        
        // Return debris data for rewards
        return debrisData;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update(deltaTime) {
        // Rotate stars slowly
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.01;
        }
        
        this.updateDebris(deltaTime);
        this.updateParticles(deltaTime);
    }

    dispose() {
        this.debrisPool.releaseAll();
        this.particlePool.releaseAll();
        this.renderer.dispose();
    }
}
