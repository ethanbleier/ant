import './style.css'
import { initializeGameEngine, setCurrentScene, getCurrentScene } from './core/engine.js'
import { setupInput } from './core/input.js'
import { MenuScene } from './scenes/menuScene.js'

// create game container
document.querySelector('#app').innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
  </div>
`

// game engine
const { canvas, ctx } = initializeGameEngine()

// user input handlers
setupInput()

// --- Resize Handler ---
function handleResize() {
  // Get the container size (or window size if container isn't styled)
  const container = document.getElementById('game-container');
  // Use window dimensions as a fallback or primary source
  const newWidth = window.innerWidth; 
  const newHeight = window.innerHeight;

  // Update canvas rendering resolution
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Notify current scene
  const currentScene = getCurrentScene();
  if (currentScene && typeof currentScene.onResize === 'function') {
    currentScene.onResize(newWidth, newHeight);
  }
}

// Add event listener
window.addEventListener('resize', handleResize);

// Load the menu scene as the starting scene
const menuScene = new MenuScene()
menuScene.initialize(canvas, ctx)
setCurrentScene(menuScene)

// Initial resize to set correct size on load
handleResize();
