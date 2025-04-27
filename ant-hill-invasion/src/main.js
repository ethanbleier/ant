import './style.css'
import { initializeGameEngine, setCurrentScene, getCurrentScene } from './core/engine.js'
import { setupInput } from './core/input.js'
import { MenuScene } from './scenes/menuScene.js'
import { t, loadLanguage } from './core/localization/localizationManager.js';

// Create container for our game
document.querySelector('#app').innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
  </div>
`

// Initialize the game engine
const { canvas, ctx } = initializeGameEngine()

// Set up user input handlers
setupInput()

// --- Add Resize Handler ---
function handleResize() {
  // Get the container size (or window size if container isn't styled)
  const container = document.getElementById('game-container');
  // Use window dimensions as a fallback or primary source
  const newWidth = window.innerWidth; 
  const newHeight = window.innerHeight;

  // Update canvas rendering resolution
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Optional: If using CSS to scale canvas, update style too (might not be needed)
  // canvas.style.width = `${newWidth}px`;
  // canvas.style.height = `${newHeight}px`;

  // Notify the current scene
  const currentScene = getCurrentScene();
  if (currentScene && typeof currentScene.onResize === 'function') {
    currentScene.onResize(newWidth, newHeight);
  }
}

// Add event listener
window.addEventListener('resize', handleResize);
// --- End Resize Handler ---

// Load the menu scene as the starting scene
async function startGame() {
  //await userData to load their saved language
  await loadLanguage('es');  //english is default for now

  const menuScene = new MenuScene();
  menuScene.initialize(canvas, ctx);
  setCurrentScene(menuScene);

  handleResize();
}

// Call it
startGame();

// Initial resize to set correct size on load
handleResize();
