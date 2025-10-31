// Render Manager - Handles all rendering logic separately from game loop
export class RenderManager {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.renderStats = {
            fps: 0,
            frameTime: 0,
            drawCalls: 0
        };
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = 0;
    }

    // Main render call
    render(deltaTime) {
        // Update stats
        this.updateRenderStats(deltaTime);
        
        // Perform actual render
        this.engine.render();
    }

    // Update render statistics
    updateRenderStats(deltaTime) {
        this.frameCount++;
        const now = performance.now();
        this.renderStats.frameTime = deltaTime * 1000; // Convert to ms
        
        // Update FPS counter every second
        if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.renderStats.fps = Math.round(this.frameCount / ((now - this.lastFpsUpdate) / 1000));
            this.renderStats.drawCalls = this.engine.renderer.info.render.calls;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
    }

    // Get current render stats for debugging
    getStats() {
        return this.renderStats;
    }

    // Toggle debug info display
    toggleDebugInfo() {
        let debugElement = document.getElementById('debug-info');
        
        if (!debugElement) {
            debugElement = document.createElement('div');
            debugElement.id = 'debug-info';
            debugElement.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff88;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                border-radius: 5px;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(debugElement);
        }

        if (debugElement.style.display === 'none') {
            debugElement.style.display = 'block';
            this.debugInterval = setInterval(() => {
                this.updateDebugDisplay(debugElement);
            }, 100);
        } else {
            debugElement.style.display = 'none';
            if (this.debugInterval) {
                clearInterval(this.debugInterval);
            }
        }
    }

    updateDebugDisplay(element) {
        const stats = this.getStats();
        const pool = this.engine.debrisPool;
        const particles = this.engine.particlePool;
        
        element.innerHTML = `
            <div><strong>RENDER STATS</strong></div>
            <div>FPS: ${stats.fps}</div>
            <div>Frame Time: ${stats.frameTime.toFixed(2)}ms</div>
            <div>Draw Calls: ${stats.drawCalls}</div>
            <div><strong>OBJECT POOLS</strong></div>
            <div>Debris: ${pool.getActive().length}/${pool.pool.length + pool.getActive().length}</div>
            <div>Particles: ${particles.getActive().length}/${particles.pool.length + particles.getActive().length}</div>
        `;
    }

    // Clean up
    dispose() {
        if (this.debugInterval) {
            clearInterval(this.debugInterval);
        }
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            debugElement.remove();
        }
    }
}
