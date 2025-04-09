import './style.css'
import { initializeGameEngine, setCurrentScene } from './core/engine.js'
import { setupInput } from './core/input.js'
import { MenuScene } from './scenes/menuScene.js'

// Create container for our game
document.querySelector('#app').innerHTML = `
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
  </div>
`

// Initialize the game engine
initializeGameEngine()

// Set up user input handlers
setupInput()

// Load the menu scene as the starting scene
const menuScene = new MenuScene()
setCurrentScene(menuScene)
