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
            200
        );
    }

    createDebris() {
        const size = 0.5 + Math.random() * 1.5;
        const geometry = new THREE.IcosahedronGeometry(size, 0);
        
        // Random color based on tier
        const colors = [
            0x64c8ff, // Blue
            0x00ff88, // Green
            0xffc864, // Orange
            0xff6464, // Red
            0xc864ff  // Purple
        ];
        
        const material = new THREE.MeshStandardMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            emissive: colors[Math.floor(Math.random() * colors.length)],
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add glow effect
        const glowGeometry = new THREE.IcosahedronGeometry(size * 1.2, 0);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.2,
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
            glow: glow
        };
        
        return mesh;
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
