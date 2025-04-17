# 🐜 Ant Hill Invasion

A retro-styled tower defense game where you defend your ant colony from invading fire ants.

---

## 🕹️ Description

**Ant Hill Invasion** is a 2D tower defense game with an 8-bit aesthetic. Players must strategically place defender ants to protect their colony from waves of invading fire ants.

### 🎯 Features

- 🖼️ Complete 2D canvas-based rendering  
- 🎨 8-bit pixel art style  
- 🏰 Tower defense mechanics with multiple defender types  
- 🛣️ Strategically designed path system for enemy movement  
- 🌊 Wave-based progression system  

---

## 🎮 Game Modes

### 🛡️ Tower Defense Mode

- Defend your anthill from waves of enemy fire ants  
- Build and position different types of defender ants  
- Manage resources and upgrade your defenses  
- Complete increasingly difficult waves  

### 🐜 Free Play Mode

- Explore the ant colony environment  
- Control your ant character with arrow keys  
- Interact with the environment  

---

## 🧠 How to Play

### 🚀 Starting the Game

Select **"Tower Defense"** or **"Free Play"** mode from the main menu.

### 🛡️ Tower Defense Mode

- Click defender ants in the shop and drag them onto the map (not on the path)  
- Press the **START** button to begin a wave  
- Each defender has different stats (damage, range, attack speed)  
- Press the **pause** button or `ESC` key to pause  
- Each enemy that reaches your anthill costs you a life  
- Defeat all enemies to earn bonus money  

### 🐜 Free Play Mode

- Use arrow keys to move your ant character  
- Explore the environment  
- Press `ESC` to return to the main menu  

---

## 🛠️ Development

### 🔄 Recent Changes

- Removed `THREE.js` dependency and migrated to 2D Canvas rendering  
- Optimized rendering pipeline for 8-bit graphics  
- Implemented map system with pathfinding  
- Added tower defense gameplay mechanics  
- Created a shop interface with three defender types  

---

## 🧰 Tech Stack

- JavaScript  
- HTML5 Canvas for rendering  
- [Matter.js](https://brm.io/matter-js/) for 2D physics  
- [Pathfinding.js](https://github.com/qiao/PathFinding.js) for enemy movement  
- [Vite](https://vitejs.dev/) as the build tool  

---

## 💻 Installation and Running

```bash
# Clone the repository
git clone https://github.com/yourusername/ant-hill-invasion.git
cd ant-hill-invasion

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
