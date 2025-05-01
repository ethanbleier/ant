// Input state tracking
const keys = {};
const mouse = {
    x: 0,
    y: 0,
    isDown: false
};

// Registered event callbacks
const keyCallbacks = {};
const mouseCallbacks = {};

/**
 * Initialize input handlers
 */
export function setupInput() {
    // Keyboard event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Mouse event listeners
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Touch event listeners for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove);
}

/**
 * Register a callback for a key event
 * @param {string} key - The key to listen for
 * @param {string} eventType - 'down' or 'up'
 * @param {Function} callback - Function to call when event occurs
 */
export function onKey(key, eventType, callback) {
    if (!keyCallbacks[key]) {
        keyCallbacks[key] = {
            down: [],
            up: []
        };
    }
    
    keyCallbacks[key][eventType].push(callback);
}

/**
 * Register a callback for a mouse event
 * @param {string} eventType - 'down', 'up', or 'move'
 * @param {Function} callback - Function to call when event occurs
 */
export function onMouse(eventType, callback) {
    if (!mouseCallbacks[eventType]) {
        mouseCallbacks[eventType] = [];
    }
    
    mouseCallbacks[eventType].push(callback);
}

/**
 * Check if a key is currently pressed
 * @param {string} key - The key to check
 * @returns {boolean} True if the key is pressed
 */
export function isKeyDown(key) {
    return keys[key] === true;
}

/**
 * Get the current mouse position
 * @returns {Object} Object with x and y properties in canvas coordinates
 */
export function getMousePosition() {
    return { ...mouse };
}

// Internal event handlers
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    keys[key] = true;
    
    if (keyCallbacks[key] && keyCallbacks[key].down) {
        keyCallbacks[key].down.forEach(callback => callback(event));
    }
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    keys[key] = false;
    
    if (keyCallbacks[key] && keyCallbacks[key].up) {
        keyCallbacks[key].up.forEach(callback => callback(event));
    }
}

function handleMouseDown(event) {
    mouse.isDown = true;
    
    if (mouseCallbacks.down) {
        mouseCallbacks.down.forEach(callback => callback(event));
    }
}

function handleMouseUp(event) {
    mouse.isDown = false;
    
    if (mouseCallbacks.up) {
        mouseCallbacks.up.forEach(callback => callback(event));
    }
}

function handleMouseMove(event) {
    const canvas = event.target;
    if (!canvas) return;                           // <-- guard fixes it
    const rect = canvas.getBoundingClientRect();
    
    // Use actual canvas pixel coordinates (not normalized coordinates)
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    
    if (mouseCallbacks.move) {
        mouseCallbacks.move.forEach(callback => callback(event));
    }
}

// Touch event handlers (convert to mouse events for simplicity)
function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    
    handleMouseDown(mouseEvent);
}

function handleTouchEnd(event) {
    event.preventDefault();
    const mouseEvent = new MouseEvent('mouseup');
    
    handleMouseUp(mouseEvent);
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    
    handleMouseMove(mouseEvent);
}
