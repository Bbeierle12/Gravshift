import * as THREE from 'three';

// Visual Effects Manager
export class EffectsManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.activeEffects = [];
    }

    // Absorption effect
    createAbsorptionEffect(position, playerPosition, color = 0x64c8ff) {
        // Spawn particles that move towards player
        const particleCount = 15;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.engine.particlePool.acquire();
            
            // Start at debris position with slight offset
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            particle.position.copy(position).add(offset);
            
            // Calculate velocity towards player
            const direction = new THREE.Vector3()
                .subVectors(playerPosition, particle.position)
                .normalize();
            
            particle.userData.velocity = direction.multiplyScalar(20 + Math.random() * 10);
            particle.userData.life = 1.0;
            particle.userData.maxLife = 0.3 + Math.random() * 0.3;
            particle.material.color.setHex(color);
            particle.visible = true;
            
            this.engine.scene.add(particle);
            particles.push(particle);
        }
        
        // Light flash at absorption point
        const light = new THREE.PointLight(color, 2, 20);
        light.position.copy(position);
        this.engine.scene.add(light);
        
        // Fade out light
        const fadeEffect = {
            light: light,
            life: 1.0,
            update: (deltaTime) => {
                fadeEffect.life -= deltaTime * 5;
                light.intensity = fadeEffect.life * 2;
                
                if (fadeEffect.life <= 0) {
                    this.engine.scene.remove(light);
                    return true; // Effect complete
                }
                return false;
            }
        };
        
        this.activeEffects.push(fadeEffect);
        
        // Screen shake
        this.engine.screenShake(0.3);
        
        return particles;
    }

    // Tier up effect
    createTierUpEffect(playerPosition, tier) {
        // Explosion of particles
        const particleCount = 50;
        const colors = [0x64c8ff, 0x00ff88, 0xffc864];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.engine.particlePool.acquire();
            particle.position.copy(playerPosition);
            
            // Random outward velocity
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 10 + Math.random() * 10;
            particle.userData.velocity.set(
                Math.cos(angle) * speed,
                (Math.random() - 0.5) * speed,
                Math.sin(angle) * speed
            );
            
            particle.userData.life = 1.0;
            particle.userData.maxLife = 1.0 + Math.random() * 0.5;
            particle.material.color.setHex(colors[i % colors.length]);
            particle.scale.setScalar(1.5);
            particle.visible = true;
            
            this.engine.scene.add(particle);
        }
        
        // Expanding ring effect
        const ringGeometry = new THREE.TorusGeometry(1, 0.1, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffc864,
            transparent: true,
            opacity: 1
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(playerPosition);
        ring.rotation.x = Math.PI / 2;
        this.engine.scene.add(ring);
        
        const ringEffect = {
            ring: ring,
            scale: 1,
            life: 1.0,
            update: (deltaTime) => {
                ringEffect.scale += deltaTime * 30;
                ringEffect.life -= deltaTime * 2;
                
                ring.scale.set(ringEffect.scale, ringEffect.scale, ringEffect.scale);
                ring.material.opacity = ringEffect.life;
                
                if (ringEffect.life <= 0) {
                    this.engine.scene.remove(ring);
                    ringGeometry.dispose();
                    ringMaterial.dispose();
                    return true;
                }
                return false;
            }
        };
        
        this.activeEffects.push(ringEffect);
        
        // Strong screen shake
        this.engine.screenShake(2);
        
        // Trigger DOM tier-up effect
        this.triggerTierUpFlash();
    }

    // Recycle effect
    createRecycleEffect(playerPosition) {
        // Spiral particles
        const particleCount = 30;
        const baseColor = 0x00ff88;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.engine.particlePool.acquire();
            particle.position.copy(playerPosition);
            
            const angle = (Math.PI * 2 * i) / particleCount;
            const radius = 5;
            const speed = 15;
            
            particle.userData.velocity.set(
                Math.cos(angle) * speed,
                5 + Math.random() * 5,
                Math.sin(angle) * speed
            );
            
            particle.userData.life = 1.0;
            particle.userData.maxLife = 0.8 + Math.random() * 0.4;
            particle.material.color.setHex(baseColor);
            particle.visible = true;
            
            this.engine.scene.add(particle);
        }
        
        // Pulse player glow
        if (this.engine.player && this.engine.player.userData.glow) {
            const glow = this.engine.player.userData.glow;
            const originalOpacity = glow.material.opacity;
            
            const glowEffect = {
                glow: glow,
                originalOpacity: originalOpacity,
                time: 0,
                update: (deltaTime) => {
                    glowEffect.time += deltaTime * 10;
                    const pulse = Math.sin(glowEffect.time) * 0.3 + 0.3;
                    glow.material.opacity = originalOpacity + pulse;
                    
                    if (glowEffect.time >= Math.PI * 2) {
                        glow.material.opacity = originalOpacity;
                        return true;
                    }
                    return false;
                }
            };
            
            this.activeEffects.push(glowEffect);
        }
        
        this.engine.screenShake(0.5);
    }

    // Boost effect
    createBoostEffect(playerPosition, direction) {
        // Trail particles
        const particleCount = 8;
        const color = 0x64c8ff;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.engine.particlePool.acquire();
            particle.position.copy(playerPosition);
            
            // Velocity opposite to direction
            const velocity = direction.clone().multiplyScalar(-10);
            velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            ));
            
            particle.userData.velocity.copy(velocity);
            particle.userData.life = 1.0;
            particle.userData.maxLife = 0.3;
            particle.material.color.setHex(color);
            particle.visible = true;
            
            this.engine.scene.add(particle);
        }
    }

    // Collision effect
    createCollisionEffect(position) {
        const particleCount = 10;
        const color = 0xff6464;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.engine.particlePool.acquire();
            particle.position.copy(position);
            
            particle.userData.velocity.set(
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 15
            );
            
            particle.userData.life = 1.0;
            particle.userData.maxLife = 0.4;
            particle.material.color.setHex(color);
            particle.visible = true;
            
            this.engine.scene.add(particle);
        }
        
        this.engine.screenShake(0.5);
    }

    // Update glow based on player mass
    updatePlayerGlow(mass) {
        if (!this.engine.player) return;
        
        const intensity = 0.5 + (mass / 100) * 0.5;
        this.engine.player.material.emissiveIntensity = Math.min(intensity, 1);
        
        if (this.engine.player.userData.glow) {
            const glow = this.engine.player.userData.glow;
            const opacity = 0.3 + (mass / 100) * 0.2;
            glow.material.opacity = Math.min(opacity, 0.6);
        }
    }

    // DOM effects
    triggerTierUpFlash() {
        const effectElement = document.getElementById('tier-up-effect');
        if (effectElement) {
            effectElement.classList.remove('active');
            // Force reflow
            void effectElement.offsetWidth;
            effectElement.classList.add('active');
            
            setTimeout(() => {
                effectElement.classList.remove('active');
            }, 1000);
        }
    }

    screenShake() {
        const container = document.getElementById('game-container');
        if (container) {
            container.classList.add('screen-shake');
            setTimeout(() => {
                container.classList.remove('screen-shake');
            }, 300);
        }
    }

    // Update all active effects
    update(deltaTime) {
        this.activeEffects = this.activeEffects.filter(effect => {
            return !effect.update(deltaTime);
        });
    }

    // Clear all effects
    clear() {
        this.activeEffects.forEach(effect => {
            if (effect.ring) {
                this.engine.scene.remove(effect.ring);
            }
            if (effect.light) {
                this.engine.scene.remove(effect.light);
            }
        });
        this.activeEffects = [];
    }
}
