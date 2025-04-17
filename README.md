Ant Hill Invasion
A retro-styled tower defense game where you defend your ant colony from invading fire ants.

Description
Ant Hill Invasion is a 2D tower defense game with an 8-bit aesthetic. Players must strategically place defender ants to protect their colony from waves of invading fire ants.

The game features:

Complete 2D canvas-based rendering
8-bit pixel art style
Tower defense mechanics with multiple defender types
Strategically designed path system for enemy movement
Wave-based progression system
Game Modes
Tower Defense Mode
Defend your anthill from waves of enemy fire ants
Build and position different types of defender ants
Manage resources and upgrade your defenses
Complete increasingly difficult waves
Free Play Mode
Explore the ant colony environment
Control your ant character with arrow keys
Interact with the environment
How to Play
Starting the Game: Select "Tower Defense" or "Free Play" mode from the main menu.
Tower Defense Mode:
Click defender ants in the shop and drag them onto the map (not on the path)
Press the START button to begin a wave of enemy ants
Each defender has different stats (damage, range, attack speed)
Press the pause button or ESC key to pause the game
Each enemy that reaches your anthill costs you a life
Defeat all enemies to complete the wave and earn bonus money
Free Play Mode:
Use arrow keys to move your ant character
Explore the environment
Press ESC to return to the main menu
Development
Recent Changes
Completely removed THREE.js dependency and migrated to 2D Canvas rendering
Implemented a more efficient rendering pipeline for 8-bit style graphics
Added Map implementation with path finding for enemy movement
Added tower defense gameplay mechanics
Created a shop interface with three types of defender ants
Tech Stack
JavaScript
HTML5 Canvas for rendering
Matter.js for 2D physics
Pathfinding.js for enemy movement
Vite as the build tool
Installation and Running
Clone the repository:

git clone https://github.com/yourusername/ant-hill-invasion.git
cd ant-hill-invasion
Install dependencies:

npm install
Run the development server:

npm run dev
Build for production:

npm run build
Preview the production build:

npm run preview
Future Improvements
Implement sprite sheets for more efficient rendering
Add particle system for effects
Develop tower upgrade paths
Create a level editor for custom maps
Add save/load functionality for game progress
Add sound effects and background music
Add visual attack animations for defenders
Add more enemy types with different abilities