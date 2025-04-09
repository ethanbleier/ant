import './style.css'
import { Engine } from './core/engine';

// Set up the basic HTML structure
document.querySelector('#app').innerHTML = `
  <h1>Ant Hill Invasion</h1>
  <div id="game-container" style="width: 80vw; height: 70vh;"></div>
`
// Get the container element
const gameContainer = document.getElementById('game-container');

// Initialize the engine, passing the container
const engine = new Engine(gameContainer);

// Check if engine initialized correctly
if (engine && engine.renderer) {
	// Game loop
	function animate() {
		requestAnimationFrame( animate );

		// Update game logic
		engine.update();

		// Render the scene
		engine.render();
	}
	animate();
} else {
	console.error("Failed to initialize the Engine.");
} 