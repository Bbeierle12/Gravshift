// Input Manager - Consolidated keyboard and mouse input handling
export class InputManager {
    constructor() {
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = {};
        this.listeners = {
            keydown: [],
            keyup: [],
            mousemove: [],
            mousedown: [],
            mouseup: [],
            click: []
        };
        
        // Hotkey bindings
        this.hotkeys = new Map();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('click', (e) => this.handleClick(e));
    }

    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        
        // Check hotkeys first
        if (this.hotkeys.has(key)) {
            const callback = this.hotkeys.get(key);
            if (callback(e) === false) {
                e.preventDefault();
                return;
            }
        }
        
        this.keys[key] = true;
        
        // Notify listeners
        this.listeners.keydown.forEach(callback => callback(e, key));
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
        
        // Notify listeners
        this.listeners.keyup.forEach(callback => callback(e, key));
    }

    handleMouseMove(e) {
        this.mousePosition.x = e.clientX;
        this.mousePosition.y = e.clientY;
        
        // Notify listeners
        this.listeners.mousemove.forEach(callback => callback(e, this.mousePosition));
    }

    handleMouseDown(e) {
        this.mouseButtons[e.button] = true;
        
        // Notify listeners
        this.listeners.mousedown.forEach(callback => callback(e));
    }

    handleMouseUp(e) {
        this.mouseButtons[e.button] = false;
        
        // Notify listeners
        this.listeners.mouseup.forEach(callback => callback(e));
    }

    handleClick(e) {
        // Notify listeners
        this.listeners.click.forEach(callback => callback(e));
    }

    // Check if key is currently pressed
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] === true;
    }

    // Check if any of the provided keys are pressed
    isAnyKeyPressed(...keys) {
        return keys.some(key => this.isKeyPressed(key));
    }

    // Check if mouse button is pressed
    isMouseButtonPressed(button = 0) {
        return this.mouseButtons[button] === true;
    }

    // Get current mouse position
    getMousePosition() {
        return { ...this.mousePosition };
    }

    // Register event listener
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    // Unregister event listener
    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    // Register global hotkey
    registerHotkey(key, callback, description = '') {
        this.hotkeys.set(key.toLowerCase(), callback);
        return () => this.unregisterHotkey(key);
    }

    // Unregister hotkey
    unregisterHotkey(key) {
        this.hotkeys.delete(key.toLowerCase());
    }

    // Get all registered hotkeys
    getHotkeys() {
        return Array.from(this.hotkeys.keys());
    }

    // Clear all hotkeys
    clearHotkeys() {
        this.hotkeys.clear();
    }

    // Movement vector helper (WASD + Arrow keys)
    getMovementVector() {
        const vector = { x: 0, y: 0, z: 0 };
        
        // Forward/Backward
        if (this.isAnyKeyPressed('w', 'arrowup')) {
            vector.z -= 1;
        }
        if (this.isAnyKeyPressed('s', 'arrowdown')) {
            vector.z += 1;
        }
        
        // Left/Right
        if (this.isAnyKeyPressed('a', 'arrowleft')) {
            vector.x -= 1;
        }
        if (this.isAnyKeyPressed('d', 'arrowright')) {
            vector.x += 1;
        }
        
        // Normalize if moving diagonally
        if (vector.x !== 0 && vector.z !== 0) {
            const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
            vector.x /= length;
            vector.z /= length;
        }
        
        return vector;
    }

    // Check for boost input
    isBoostPressed() {
        return this.isKeyPressed(' ');
    }

    // Check for recycle input
    isRecyclePressed() {
        return this.isKeyPressed('r');
    }

    // Reset all input states
    reset() {
        this.keys = {};
        this.mouseButtons = {};
    }

    // Clean up
    dispose() {
        this.reset();
        this.clearHotkeys();
        // Note: We don't remove window event listeners as they're global
    }
}
