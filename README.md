# 🐜 Ant Hill Invasion 🐜 

A retro-styled tower defense game where you defend your ant colony from invading fire ants.

---

## Description

**Ant Hill Invasion** is a 2D tower defense game with an 8-bit aesthetic. Players must strategically place defender ants to protect their colony from waves of invading fire ants.

### Features

- Complete 2D canvas-based rendering  
- 8-bit pixel art style  
- Tower defense mechanics with multiple defender types  
- Strategically designed path system for enemy movement  
- Wave-based progression system  

---

## Game Modes

### Tower Defense Mode

- Defend your anthill from waves of enemy fire ants  
- Build and position different types of defender ants  
- Manage resources and upgrade your defenses  
- Complete increasingly difficult waves  

---

## How to Play

### Starting the Game

Select **"Tower Defense"** mode from the main menu.

### Tower Defense

- Objective: Protect the queen ant from enemy fire ants by allocating defenders within tunnels and paths in the anthill
- Click defender ants in the shop and place on playable tiles on the map  
- Press the **START** button to begin a wave  
- Press 2x or 4x speed buttons to speed up the game  
  - **How We Solved Speed Control:** Clicking the speed buttons (1x, 2x, 4x) triggers an event handled by the `InputSystem`. This event updates the `gameSpeed` state in the `GameStateSystem`, which then notifies other systems. The core `GameScene` uses this speed factor to scale the `deltaTime` (time between frames) passed to game logic systems (like movement and combat), effectively accelerating or decelerating the game clock. Time-sensitive actions like enemy spawn rates in `GameStateSystem` are also directly adjusted by the `gameSpeed`. The `UISystem` listens for changes to highlight the active speed button.
- Each defender has different stats (damage, range, attack speed)  
- Press the **pause** button or `ESC` or `p`key to pause/play
- Each enemy that reaches the queen ant costs you a life  
- Defeat all enemies to earn bonus money  
- Gain $65 for each wave cleared after the first wave  

---

## tech

- JavaScript  
- HTML5 Canvas for rendering  
- [Matter.js](https://brm.io/matter-js/) for 2D physics  
- [Pathfinding.js](https://github.com/qiao/PathFinding.js) for enemy movement  
- [Vite](https://vitejs.dev/) as the build tool  

---

## quick start

```bash

# Clone the repository
cd ant-hill-invasion

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

```

## Project Structure

```
├── ant-hill-invasion/        # Main application directory
│   ├── node_modules/         # Project dependencies (managed by npm/yarn)
│   ├── public/               # Static assets served directly (e.g., images, CSS, level files)
│   │   └── levels/           # Contains JSON files defining game levels
│   ├── src/                  # Source code for the game
│   │   ├── components/       # Reusable UI or game components (if using a framework)
│   │   ├── core/             # Core game engine parts (e.g., EventBus)
│   │   ├── ecs/              # Entity Component System implementation
│   │   │   ├── components/   # Data components defining entity properties (e.g., Position, Health, Enemy)
│   │   │   ├── entities/     # Entity definitions or factories (if used)
│   │   │   └── systems/      # Logic systems operating on entities (e.g., MovementSystem, CombatSystem, GameStateSystem, UISystem)
│   │   ├── scenes/           # Different game states or screens (e.g., MainMenuScene, GameScene)
│   │   ├── utils/            # Utility functions
│   │   └── main.js           # Main entry point for the application (or index.js)
│   ├── .gitignore            # Specifies intentionally untracked files that Git should ignore
│   ├── index.html            # Root HTML file for the web application (served from here or public/)
│   ├── package.json          # Node.js manifest file (dependencies, scripts)
│   └── package-lock.json     # Records exact versions of dependencies
├── .git/                     # Git repository metadata
├── index.html                # Alternative root HTML file (if served from root)
├── README.md                 # This file: project documentation
└── start.sh                  # Script to start the development server or build the project
```

### Understanding the Code:

*   **`ant-hill-invasion/`**: The heart of the game. Contains all the code and assets.
*   **`ant-hill-invasion/src/`**: This is where the JavaScript/TypeScript code lives.
    *   **`ecs/`**: Implements the Entity Component System pattern, a common architectural pattern in game development.
        *   `components/`: Define the data associated with game objects (entities). For example, an enemy might have `Health`, `Position`, and `Enemy` components. Money rewards are defined in `Enemy.js`.
        *   `systems/`: Contain the logic that operates on entities possessing specific components. `GameStateSystem.js` manages the player's money, `CombatSystem.js` handles fighting and awarding money, and `UISystem.js` displays the money and purchase options.
    *   **`scenes/`**: Manages different parts of the game experience. `gameScene.js` orchestrates the main gameplay loop, including defining defender costs and handling defender placement logic (checking affordability).
    *   **`core/`**: Foundational code like the `EventBus.js` which enables different parts of the game to communicate without being directly coupled (e.g., signaling a 'moneyChanged' event).
*   **`ant-hill-invasion/public/levels/`**: This directory contains `.json` files that define the parameters for each game level, such as starting money (`"money": ...`), enemy waves, and map layout.
*   **`ant-hill-invasion/public/`**: Files here are typically served directly by the web server. This often includes the main `index.html`, CSS files, images, and the level data files.
*   **`start.sh`**: A shell script likely used to simplify the process of building the game or starting a local development server.
