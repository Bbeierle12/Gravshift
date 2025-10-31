/**
 * ResourceSystem - Manages all resources in the game
 * Resources: plastic, metal, organic, seeds, oxygen
 */
export class ResourceSystem {
    constructor() {
        this.resources = {
            plastic: 0,
            metal: 0,
            organic: 0,
            seeds: 0,
            oxygen: 100  // Start at 100%
        };
        
        this.listeners = new Set();
    }

    /**
     * Add resources of a specific type
     */
    addResource(type, amount) {
        if (type in this.resources) {
            this.resources[type] += amount;
            this.notifyListeners();
        }
    }

    /**
     * Remove resources (returns false if not enough)
     */
    removeResource(type, amount) {
        if (this.resources[type] >= amount) {
            this.resources[type] -= amount;
            this.notifyListeners();
            return true;
        }
        return false;
    }

    /**
     * Check if player can afford a cost
     */
    canAfford(costs) {
        return Object.entries(costs).every(
            ([type, amount]) => this.resources[type] >= amount
        );
    }

    /**
     * Deduct multiple resources at once
     */
    deductCosts(costs) {
        if (!this.canAfford(costs)) {
            return false;
        }
        
        Object.entries(costs).forEach(([type, amount]) => {
            this.removeResource(type, amount);
        });
        
        return true;
    }

    /**
     * Get all current resources
     */
    getResources() {
        return { ...this.resources };
    }

    /**
     * Get specific resource amount
     */
    getResource(type) {
        return this.resources[type] || 0;
    }

    /**
     * Subscribe to resource changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        // Immediately notify with current state
        callback(this.getResources());
        
        // Return unsubscribe function
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of resource changes
     */
    notifyListeners() {
        const resources = this.getResources();
        this.listeners.forEach(callback => callback(resources));
    }

    /**
     * Drain oxygen over time (can be countered by oxygen generators)
     */
    drainOxygen(deltaTime, drainRate = 0.5) {
        this.resources.oxygen = Math.max(0, this.resources.oxygen - drainRate * deltaTime);
        this.notifyListeners();
    }
}
