import { loadResources } from './resources.js';

// Game state
let canvas, ctx;
let isGameRunning = false;
let currentScene = null;

// Game dimensions
let WIDTH = window.innerWidth;
let HEIGHT = window.innerHeight;

/**
 * Initialize the game engine with 2D Canvas
 */
export function initializeGameEngine() {
    // Set up canvas
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Load game resources
    loadResources().then(() => {
        // Start the game loop
        isGameRunning = true;
        animate();
    });

    return {
        canvas,
        ctx
    };
}

/**
 * Set the current game scene
 * @param {object} newScene - The scene to set as current
 */
export function setCurrentScene(newScene) {
    // Clear current scene if it exists
    if (currentScene && currentScene.cleanup) {
        currentScene.cleanup();
    }
    
    // Set and initialize new scene
    currentScene = newScene;
    if (currentScene && currentScene.initialize) {
        currentScene.initialize(canvas, ctx);
    }
}

/**
 * Game loop animation function
 */
function animate() {
    if (!isGameRunning) return;
    
    requestAnimationFrame(animate);
    
    // Clear the canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Update current scene if it exists
    if (currentScene && currentScene.update) {
        currentScene.update();
    }
    
    // Render the current scene
    if (currentScene && currentScene.render) {
        currentScene.render(ctx);
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
    
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    // Notify current scene of resize
    if (currentScene && currentScene.onResize) {
        currentScene.onResize(WIDTH, HEIGHT);
    }
}

/**
 * Stop the game
 */
export function stopGame() {
    isGameRunning = false;
}

/**
 * Resume the game
 */
export function resumeGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        animate();
    }
}
