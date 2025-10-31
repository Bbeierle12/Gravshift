import * as THREE from 'three';
import { BuildingType } from './BuildingSystem.js';

/**
 * EnvironmentalSystem - Manages environmental health zones
 * Zones improve when trees are nearby and degrade over time
 */
export class EnvironmentalSystem {
    constructor(scene) {
        this.scene = scene;
        this.zones = new Map();
        this.nextId = 0;
    }

    /**
     * Create a new environmental zone
     */
    createZone(position, radius, initialHealth = 0) {
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.15,
            wireframe: true,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        const zone = {
            id: `zone_${this.nextId++}`,
            position: position.clone(),
            radius,
            health: initialHealth,  // 0-100
            cleanRate: 0,
            degradeRate: 0.5,  // Health lost per second without trees
            mesh,
            particleSystem: null
        };
        
        this.zones.set(zone.id, zone);
        this.scene.add(mesh);
        
        return zone;
    }

    /**
     * Update all zones based on nearby buildings
     */
    updateZones(deltaTime, buildings) {
        this.zones.forEach(zone => {
            // Find nearby trees
            const nearbyTrees = buildings.filter(
                b => b.type === BuildingType.TREE && 
                     b.position.distanceTo(zone.position) <= zone.radius + 10
            );
            
            // Calculate clean rate based on number of trees
            zone.cleanRate = nearbyTrees.length * 3; // 3% per tree per second
            
            // Update health
            const healthChange = zone.cleanRate - zone.degradeRate;
            zone.health = Math.max(0, Math.min(100, zone.health + healthChange * deltaTime));
            
            // Update visual representation
            this.updateZoneVisual(zone);
        });
    }

    /**
     * Update zone visual based on health
     */
    updateZoneVisual(zone) {
        const material = zone.mesh.material;
        
        // Color transition: red (0%) -> yellow (50%) -> green (100%)
        const healthPercent = zone.health / 100;
        
        let r, g, b;
        if (healthPercent < 0.5) {
            // Red to yellow
            const t = healthPercent * 2;
            r = 1;
            g = t;
            b = 0;
        } else {
            // Yellow to green
            const t = (healthPercent - 0.5) * 2;
            r = 1 - t;
            g = 1;
            b = 0;
        }
        
        material.color.setRGB(r, g, b);
        material.opacity = 0.1 + (healthPercent * 0.2);
    }

    /**
     * Get all zones
     */
    getZones() {
        return Array.from(this.zones.values());
    }

    /**
     * Get zone by ID
     */
    getZone(id) {
        return this.zones.get(id);
    }

    /**
     * Get zones within range of a position
     */
    getZonesInRange(position, range) {
        return this.getZones().filter(
            zone => zone.position.distanceTo(position) <= range
        );
    }

    /**
     * Remove a zone
     */
    removeZone(id) {
        const zone = this.zones.get(id);
        if (zone) {
            this.scene.remove(zone.mesh);
            this.zones.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Get average health across all zones
     */
    getAverageHealth() {
        if (this.zones.size === 0) return 0;
        
        const totalHealth = this.getZones().reduce(
            (sum, zone) => sum + zone.health, 0
        );
        
        return totalHealth / this.zones.size;
    }

    /**
     * Check if position is in a healthy zone (>60% health)
     */
    isInHealthyZone(position) {
        return this.getZones().some(zone => {
            const distance = zone.position.distanceTo(position);
            return distance <= zone.radius && zone.health > 60;
        });
    }
}
