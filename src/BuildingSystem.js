import * as THREE from 'three';

/**
 * Building types available in the game
 */
export const BuildingType = {
    RECYCLER: 'recycler',
    TREE: 'tree',
    OXYGEN_GENERATOR: 'oxygen_generator'
};

/**
 * Configuration for each building type
 */
export const BUILDING_CONFIGS = {
    [BuildingType.RECYCLER]: {
        name: 'Recycler',
        cost: { plastic: 10, metal: 5 },
        color: 0x00ff88,
        emissive: 0x00ff88,
        radius: 8,
        effect: 'Converts nearby debris into seeds',
        conversionRate: 0.1  // seeds per second per debris
    },
    [BuildingType.TREE]: {
        name: 'Tree',
        cost: { seeds: 1, organic: 5 },
        color: 0x228b22,
        emissive: 0x104010,
        radius: 12,
        effect: 'Cleans area and produces oxygen',
        oxygenRate: 1.0  // oxygen per second
    },
    [BuildingType.OXYGEN_GENERATOR]: {
        name: 'Oxygen Generator',
        cost: { metal: 20, plastic: 10 },
        color: 0x00ffff,
        emissive: 0x00aaaa,
        radius: 15,
        effect: 'Generates oxygen constantly',
        oxygenRate: 2.5  // oxygen per second
    }
};

/**
 * BuildingSystem - Manages placeable structures in 3D space
 */
export class BuildingSystem {
    constructor(scene) {
        this.scene = scene;
        this.buildings = new Map();
        this.nextId = 0;
        this.minBuildingDistance = 5;  // Minimum distance between buildings
    }

    /**
     * Try to place a building at a position
     */
    placeBuilding(type, position) {
        const config = BUILDING_CONFIGS[type];
        
        if (!config) {
            console.error(`Unknown building type: ${type}`);
            return null;
        }

        // Check if position is valid
        if (!this.isPositionValid(position, this.minBuildingDistance)) {
            return null;
        }

        const building = this.createBuilding(type, position);
        this.buildings.set(building.id, building);
        this.scene.add(building.mesh);
        
        return building;
    }

    /**
     * Create the 3D mesh for a building
     */
    createBuilding(type, position) {
        const config = BUILDING_CONFIGS[type];
        let mesh;

        if (type === BuildingType.TREE) {
            // Create tree with trunk and foliage
            const group = new THREE.Group();
            
            // Trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 3, 8),
                new THREE.MeshPhongMaterial({ 
                    color: 0x8b4513,
                    emissive: 0x442200,
                    emissiveIntensity: 0.1
                })
            );
            trunk.position.y = 1.5;
            
            // Foliage
            const foliage = new THREE.Mesh(
                new THREE.ConeGeometry(2.5, 5, 8),
                new THREE.MeshPhongMaterial({ 
                    color: config.color,
                    emissive: config.emissive,
                    emissiveIntensity: 0.2
                })
            );
            foliage.position.y = 4.5;
            
            group.add(trunk);
            group.add(foliage);
            mesh = group;
            
        } else if (type === BuildingType.RECYCLER) {
            // Recycler as rotating box
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 2.5, 2.5),
                new THREE.MeshPhongMaterial({ 
                    color: config.color,
                    emissive: config.emissive,
                    emissiveIntensity: 0.3
                })
            );
            
        } else if (type === BuildingType.OXYGEN_GENERATOR) {
            // Oxygen generator as pulsing sphere
            mesh = new THREE.Mesh(
                new THREE.SphereGeometry(2, 16, 16),
                new THREE.MeshPhongMaterial({ 
                    color: config.color,
                    emissive: config.emissive,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    opacity: 0.8
                })
            );
        }

        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return {
            id: `building_${this.nextId++}`,
            type,
            position: position.clone(),
            mesh,
            active: true,
            level: 1,
            config,
            animationTime: 0
        };
    }

    /**
     * Check if a position is valid for building
     */
    isPositionValid(position, minDistance) {
        for (const building of this.buildings.values()) {
            if (building.position.distanceTo(position) < minDistance) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get all buildings
     */
    getBuildings() {
        return Array.from(this.buildings.values());
    }

    /**
     * Get buildings of a specific type
     */
    getBuildingsByType(type) {
        return this.getBuildings().filter(b => b.type === type);
    }

    /**
     * Get buildings within range of a position
     */
    getBuildingsInRange(position, range) {
        return this.getBuildings().filter(
            building => building.position.distanceTo(position) <= range
        );
    }

    /**
     * Remove a building
     */
    removeBuilding(id) {
        const building = this.buildings.get(id);
        if (building) {
            this.scene.remove(building.mesh);
            this.buildings.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Update building animations
     */
    update(deltaTime) {
        this.buildings.forEach(building => {
            building.animationTime += deltaTime;
            
            if (building.type === BuildingType.RECYCLER) {
                // Rotate recycler
                building.mesh.rotation.y += deltaTime * 0.5;
                building.mesh.rotation.x = Math.sin(building.animationTime) * 0.1;
                
            } else if (building.type === BuildingType.OXYGEN_GENERATOR) {
                // Pulse oxygen generator
                const scale = 1 + Math.sin(building.animationTime * 2) * 0.1;
                building.mesh.scale.set(scale, scale, scale);
                
                // Update emissive intensity
                const material = building.mesh.material;
                material.emissiveIntensity = 0.4 + Math.sin(building.animationTime * 3) * 0.2;
                
            } else if (building.type === BuildingType.TREE) {
                // Gentle sway for tree
                const foliage = building.mesh.children[1];
                if (foliage) {
                    foliage.rotation.z = Math.sin(building.animationTime * 0.5) * 0.05;
                }
            }
        });
    }

    /**
     * Process recycler buildings - convert nearby debris to seeds
     */
    processRecyclers(deltaTime, debrisList, resourceSystem) {
        const recyclers = this.getBuildingsByType(BuildingType.RECYCLER);
        
        recyclers.forEach(recycler => {
            const config = recycler.config;
            const nearbyDebris = debrisList.filter(
                debris => debris.position.distanceTo(recycler.position) <= config.radius
            );
            
            if (nearbyDebris.length > 0) {
                const seedsGenerated = nearbyDebris.length * config.conversionRate * deltaTime;
                resourceSystem.addResource('seeds', seedsGenerated);
            }
        });
    }

    /**
     * Process tree and oxygen generator buildings - generate oxygen
     */
    processOxygenGeneration(deltaTime, resourceSystem) {
        const trees = this.getBuildingsByType(BuildingType.TREE);
        const generators = this.getBuildingsByType(BuildingType.OXYGEN_GENERATOR);
        
        trees.forEach(tree => {
            resourceSystem.addResource('oxygen', tree.config.oxygenRate * deltaTime);
        });
        
        generators.forEach(gen => {
            resourceSystem.addResource('oxygen', gen.config.oxygenRate * deltaTime);
        });
    }

    /**
     * Get building count by type
     */
    getBuildingCount(type) {
        return this.getBuildingsByType(type).length;
    }
}
