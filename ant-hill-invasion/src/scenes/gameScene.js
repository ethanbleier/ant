import { isKeyDown } from '../core/input.js';
import { getImage } from '../core/resources.js';
import { Invader } from '../scripts/invader.js';
import { Map } from '../components/game/Map.js';
import { EventBus } from '../scripts/eventBus.js';


export class GameScene {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;

        // Game mode (tower-defense or free-play)
        this.gameMode = 'tower-defense';

        // Game state
        this.isPaused = false;
        this.money = 100;
        this.lives = 10;
        this.wave = 1;
        this.waveInProgress = false;

        // Map and path
        this.path = [];
        this.cellSize = 32;

        // Game objects
        this.enemies = [];
        this.defenders = [];
        this.selectedDefender = null;
        this.draggingDefender = null;

        // Shop and UI
        this.shopItems = [
            { type: 'worker', cost: 20, damage: 5, range: 100, speed: 1, color: '#3D2817' },
            { type: 'soldier', cost: 50, damage: 15, range: 150, speed: 0.8, color: '#000000' },
            { type: 'sniper', cost: 100, damage: 30, range: 250, speed: 0.5, color: '#654321' },
            { type: 'dummy', cost: 0, damage: 0, range: 100, speed: 0.5, color: '#f5ca3d' }
        ];

        // UI state
        this.shopOpen = true;
        this.shopHeight = 80;

        // Free play mode player character
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            color: '#FF0000',
            speed: 5
        };

        // Bind methods
        this.handleInput = this.handleInput.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);

        //map.js stuff?
        this.showMap = false;
        
    }

    /**
     * Initialize the game scene
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // Initialize based on game mode
        if (this.gameMode === 'tower-defense') {
            this.initializeTowerDefense();
        } else {
            this.initializeFreePlay();
        }
    }

    /**
     * Initialize tower defense mode
     */
    initializeTowerDefense() {
        //cheeseFood
        if(this.showMap){
            this.map = new Map(20, 12, 32); // width, height, cellSize
            this.map.loadMap(1); // load level 1
        }
     

        // Create the path
        this.createPath();

        // Add event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);

        // Set up first wave
        this.setupWave();
    }

    /**
     * Initialize free play mode
     */
    initializeFreePlay() {
        // Set initial player position to center of screen
        this.player.x = (this.width - this.player.width) / 2;
        this.player.y = (this.height - this.player.height) / 2;

        // Create some example obstacles
        this.objects = [
            {
                type: 'obstacle',
                x: 100,
                y: 100,
                width: 80,
                height: 80,
                color: '#00FF00'
            },
            {
                type: 'obstacle',
                x: this.width - 200,
                y: 150,
                width: 60,
                height: 60,
                color: '#0000FF'
            },
            {
                type: 'obstacle',
                x: 300,
                y: this.height - 200,
                width: 70,
                height: 70,
                color: '#FFFF00'
            }
        ];
    }

    /**
     * Create the zigzag path for enemies
     */
    createPath() {
        // Calculate available map space (excluding shop area)
        const mapHeight = this.height - this.shopHeight;
        const horizontalSegments = 5;
        const verticalSegments = 3;

        // Start point (entrance)
        const startX = 0;
        const startY = Math.floor(mapHeight / 6);

        // Create a zigzag path
        this.path = [];

        // method to snap coord to grid
        const snap = (x, y) => ({
            x: Math.floor(x / this.cellSize) * this.cellSize,
            y: Math.floor(y / this.cellSize) * this.cellSize
        });

        // First point (entrance)
        this.path.push(snap(startX, startY));

        // Create zigzag segments
        for (let i = 1; i <= verticalSegments; i++) {
            // Right point
            const rightX = this.width - this.cellSize;
            const rightY = startY + ((i - 1) * Math.floor(mapHeight / 3));
            this.path.push(snap(rightX, rightY));

            // Connecting point (if not the last segment)
            if (i < verticalSegments) {
                const leftX = this.cellSize;
                const leftY = startY + (i * Math.floor(mapHeight / 3));
                this.path.push(snap(leftX, leftY));
            }
        }

        // Last point (anthill entrance - exit for enemies)
        const finalX = this.width / 2;
        const finalY = mapHeight - this.cellSize;
        this.path.push(snap(finalX, finalY));

        //  cheeseFood
        console.log("Path Cell Coordinates:");
        for (const point of this.path) {
            const col = Math.floor(point.x / this.cellSize);
            const row = Math.floor(point.y / this.cellSize);
            console.log(`Cell [${col}, ${row}]`);
        }
    }


    /**
     * Set up a wave of enemies
     */
    setupWave() {
        // Reset enemies
        this.enemies = [];
        this.waveInProgress = false;
    }

    /**
     * Start the current wave
     */
    startWave() {
        if (this.waveInProgress) return;

        this.waveInProgress = true;
        this.isPaused = false;

        // Create 10 enemies
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createEnemy();
            }, i * 1000); // Spawn one enemy per second
        }
    }

    /**
     * Create a new enemy
     */
    createEnemy() {
        const startPoint = this.path[0];
        const invader = new Invader(startPoint.x, startPoint.y, this.cellSize, this.path);
        this.enemies.push(invader);
        

        // this.enemies.push(enemy);
    }

    /**
     * Place a defender on the map
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} defenderType - Type of defender to place
     */
    placeDefender(x, y, defenderType) {
        // Don't place on the path
        if (this.isOnPath(x, y)) return false;

        // Don't place if not enough money
        if (this.money < defenderType.cost) return false;

        // Don't place if there's already a defender there
        if (this.getDefenderAt(x, y)) return false;

        // Round to grid
        const gridX = Math.floor(x / this.cellSize) * this.cellSize;
        const gridY = Math.floor(y / this.cellSize) * this.cellSize;

        // Create defender
        const defender = {
            x: gridX,
            y: gridY,
            width: this.cellSize,
            height: this.cellSize,
            type: defenderType.type,
            damage: defenderType.damage,
            range: defenderType.range,
            attackSpeed: defenderType.speed,
            attackCooldown: 0,
            target: null,
            color: defenderType.color
        };

        // Add defender and subtract cost
        this.defenders.push(defender);
        this.money -= defenderType.cost;

        return true;
    }

    /**
     * Check if a point is on the path
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if the point is on the path
     */
    isOnPath(x, y) {
        // Convert to grid coordinates
        const gridX = Math.floor(x / this.cellSize) * this.cellSize;
        const gridY = Math.floor(y / this.cellSize) * this.cellSize;

        // Check each path segment
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];

            // Check if horizontal segment
            if (start.y === end.y) {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);

                if (gridY === start.y && gridX >= minX && gridX <= maxX) {
                    return true;
                }
            }
            // Check if vertical segment
            else if (start.x === end.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);

                if (gridX === start.x && gridY >= minY && gridY <= maxY) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get a defender at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null} The defender at that position or null
     */
    getDefenderAt(x, y) {
        const gridX = Math.floor(x / this.cellSize) * this.cellSize;
        const gridY = Math.floor(y / this.cellSize) * this.cellSize;

        return this.defenders.find(d =>
            d.x === gridX && d.y === gridY
        );
    }

    /**
     * Handle mouse down events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseDown(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Check if clicked in shop area
        if (y > this.height - this.shopHeight) {
            // Determine which shop item was clicked
            const itemWidth = this.width / this.shopItems.length;
            const itemIndex = Math.floor(x / itemWidth);

            if (itemIndex >= 0 && itemIndex < this.shopItems.length) {
                this.draggingDefender = this.shopItems[itemIndex];
            }
        } else {
            // Check for UI buttons
            if (this.isPointInPauseButton(x, y)) {
                this.isPaused = !this.isPaused;
            } else if (this.isPointInStartButton(x, y) && !this.waveInProgress) {
                this.startWave();
            }
        }
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    /**
     * Handle mouse up events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseUp(event) {
        if (this.draggingDefender) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Only place if not in shop area
            if (y < this.height - this.shopHeight) {
                this.placeDefender(x, y, this.draggingDefender);
            }

            this.draggingDefender = null;
        }
    }

    /**
     * Check if a point is in the pause button
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if the point is in the pause button
     */
    isPointInPauseButton(x, y) {
        return x >= 10 && x <= 50 && y >= 10 && y <= 50;
    }

    /**
     * Check if a point is in the start wave button
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if the point is in the start wave button
     */
    isPointInStartButton(x, y) {
        return x >= 60 && x <= 150 && y >= 10 && y <= 50;
    }

    /**
     * Update game scene (called each frame)
     */
    update() {
        // Handle input for both modes
        this.handleInput();

        // Update based on game mode
        if (this.gameMode === 'tower-defense') {
            this.updateTowerDefense();
        } else {
            this.updateFreePlay();
        }
    }

    /**
     * Update tower defense mode
     */
    updateTowerDefense() {
        // Skip updates if paused
        if (this.isPaused) return;

        // Update enemies
        this.updateEnemies();

        // Update defenders
        this.updateDefenders();

        // Check if wave is complete
        if (this.waveInProgress && this.enemies.length === 0) {
            this.waveComplete();
        }
    }

    /**
     * Update free play mode
     */
    updateFreePlay() {
        // TODO: Free play mode updates
    }

    /**
     * Update enemy positions and state
     */
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const invader = this.enemies[i];
            invader.update();
        
            if (invader.pathIndex >= invader.waypoints.length - 1) {
                this.lives--;
                this.enemies.splice(i, 1);
            } else if (invader.health <= 0) {
                this.money += invader.reward;
                this.enemies.splice(i, 1);
            }
        }
        
    }

    /**
     * Move an enemy along the path
     * @param {object} enemy - The enemy to move
     */
    moveEnemyAlongPath(enemy) {
        const currentPoint = this.path[enemy.pathIndex];
        const nextPoint = this.path[enemy.pathIndex + 1];

        if (!nextPoint) return;

        // Calculate direction to next point
        const dx = nextPoint.x - enemy.x;
        const dy = nextPoint.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move toward next point
        if (distance <= enemy.speed) {
            // Reached point, move to next segment
            enemy.pathIndex++;
        } else {
            // Move along the segment
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    }

    /**
     * Update defender states
     */
    updateDefenders() {
        for (const defender of this.defenders) {
            // Decrease attack cooldown
            if (defender.attackCooldown > 0) {
                defender.attackCooldown--;
            }

            // Find target if none
            if (!defender.target || !this.isValidTarget(defender, defender.target)) {
                defender.target = this.findTarget(defender);
            }

            // Attack if has target and cooldown ready
            if (defender.target && defender.attackCooldown <= 0) {
                this.attackEnemy(defender, defender.target);
                defender.attackCooldown = 60 / defender.attackSpeed; // 60 frames per attack at speed 1
            }
        }
    }

    /**
     * Check if a target is valid for a defender
     * @param {object} defender - The defender
     * @param {object} target - The potential target
     * @returns {boolean} True if the target is valid
     */
    isValidTarget(defender, target) {
        // Check if target is dead or out of range
        if (target.health <= 0) return false;

        const dx = target.x - defender.x;
        const dy = target.y - defender.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= defender.range;
    }

    /**
     * Find a target for a defender
     * @param {object} defender - The defender searching for a target
     * @returns {object|null} The target enemy or null
     */
    findTarget(defender) {
        // Find the closest enemy in range
        let closestDistance = defender.range;
        let closestEnemy = null;

        for (const enemy of this.enemies) {
            const dx = enemy.x - defender.x;
            const dy = enemy.y - defender.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        return closestEnemy;
    }

    /**
     * Attack an enemy
     * @param {object} defender - The defender
     * @param {object} enemy - The enemy to attack
     */
    attackEnemy(defender, enemy) {
        enemy.health -= defender.damage;
        
        if(enemy.health<= enemy.maxHealth/2 && !enemy.invaderinvaderHasHalfHp){
            enemy.invaderinvaderHasHalfHp=true;
            
            EventBus.dispatchEvent(new CustomEvent('invaderHalfHealth', {
                detail: { id: enemy.id }
            }));
            
        }
    }

    /**
     * Handle wave completion
     */
    waveComplete() {
        this.waveInProgress = false;
        this.wave++;
        this.money += 50; // Bonus for completing the wave

        // Set up next wave (more difficult)
        this.setupWave();
    }

    /**
     * Handle keyboard input
     */
    handleInput() {
        // Toggle pause with 'p' key or escape for tower defense
        if (this.gameMode === 'tower-defense') {
            if (isKeyDown('p') || isKeyDown('escape')) {
                this.isPaused = !this.isPaused;
            }
        } else {
            // Free play movement controls
            this.handleFreePlayMovement();
        }
    }

    /**
     * Handle free play movement
     */
    handleFreePlayMovement() {
        // Move the player with arrow keys
        if (isKeyDown('arrowup')) {
            this.player.y -= this.player.speed;
            // Keep player within bounds
            this.player.y = Math.max(0, this.player.y);
        }
        if (isKeyDown('arrowdown')) {
            this.player.y += this.player.speed;
            // Keep player within bounds
            this.player.y = Math.min(this.height - this.player.height, this.player.y);
        }
        if (isKeyDown('arrowleft')) {
            this.player.x -= this.player.speed;
            // Keep player within bounds
            this.player.x = Math.max(0, this.player.x);
        }
        if (isKeyDown('arrowright')) {
            this.player.x += this.player.speed;
            // Keep player within bounds
            this.player.x = Math.min(this.width - this.player.width, this.player.x);
        }
    }

    /**
     * Render the game scene
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    render(ctx) {
        // Draw background
        ctx.fillStyle = '#87ceeb'; // Sky blue background
        ctx.fillRect(0, 0, this.width, this.height);

        // Render based on game mode
        if (this.gameMode === 'tower-defense') {
            this.renderTowerDefense(ctx);
        } else {
            this.renderFreePlay(ctx);
        }
    }

    /**
     * Render tower defense mode
     */
    renderTowerDefense(ctx) {

        //cheeseFood

        // Draw a red cell at grid coordinate [15, 15]
        if (false) {
            const redCellX = 3 * this.cellSize;
            const redCellY = 17 * this.cellSize;

            ctx.fillStyle = 'red';
            ctx.fillRect(redCellX, redCellY, this.cellSize, this.cellSize);
            ctx.fillStyle = 'magenta'; // Optional: make it stand out

            for (let i = 0; i < this.path.length; i++) {
                const point = this.path[i];

                const col = Math.floor(point.x / this.cellSize);
                const row = Math.floor(point.y / this.cellSize);

                const cellX = col * this.cellSize;
                const cellY = row * this.cellSize;

                ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
        if(this.showMap){
            this.map.render(ctx);
        }
        


        // Draw grid
        this.drawGrid(ctx);

        // Draw path
        this.drawPath(ctx);

        // Draw anthill (exit)
        this.drawAnthill(ctx);

        // Draw defenders
        this.drawDefenders(ctx);

        // Draw enemies
        this.drawEnemies(ctx);

        // Draw UI
        this.drawUI(ctx);

        // Draw shop
        this.drawShop(ctx);

        // Draw dragging defender if any
        if (this.draggingDefender && this.mouseX && this.mouseY) {
            this.drawDraggingDefender(ctx);
        }
    }

    /**
     * Render free play mode
     */
    renderFreePlay(ctx) {
        // Draw grid (8-bit style)
        ctx.strokeStyle = '#ADD8E6'; // Light blue grid
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = 0; x < this.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = 0; y < this.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        // Draw ground
        ctx.fillStyle = '#663300'; // Brown for dirt
        ctx.fillRect(0, this.height - 100, this.width, 100);

        // Draw pixel pattern on ground
        ctx.fillStyle = '#552200';
        for (let x = 0; x < this.width; x += 16) {
            for (let y = this.height - 100; y < this.height; y += 16) {
                if ((x + y) % 32 === 0) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }

        // Draw obstacles
        if (this.objects) {
            for (const object of this.objects) {
                ctx.fillStyle = object.color;
                ctx.fillRect(object.x, object.y, object.width, object.height);

                // Add 8-bit style border
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.strokeRect(object.x, object.y, object.width, object.height);
            }
        }

        // Draw player as an 8-bit ant
        this.drawPixelAnt(ctx, this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw game instructions
        this.drawInstructions(ctx);
    }

    /**
     * Draw an 8-bit ant for the player character
     */
    drawPixelAnt(ctx, x, y, width, height) {
        const pixelSize = Math.min(width, height) / 16;

        // Define a simple 16x16 pixel art of an ant (1 for black pixels, 2 for red pixels, 0 for empty)
        const pixelData = [
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 0, 2, 2, 0, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 2, 2, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 2, 2, 1, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
            [0, 1, 2, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 2, 1, 0],
            [1, 2, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 1],
            [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        // Draw each pixel
        for (let row = 0; row < 16; row++) {
            for (let col = 0; col < 16; col++) {
                if (pixelData[row][col] === 1) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                } else if (pixelData[row][col] === 2) {
                    ctx.fillStyle = '#AA0000';
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }

    /**
     * Draw instructions text for free play mode
     */
    drawInstructions(ctx) {
        // Draw instruction box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.width / 2 - 250, 20, 500, 60);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.width / 2 - 250, 20, 500, 60);

        // Draw text
        ctx.font = '16px "Press Start 2P", monospace, Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Use arrow keys to control. ESC to return to menu.', this.width / 2, 50);
    }

    /**
     * Draw the grid
     */
    drawGrid(ctx) {
        ctx.strokeStyle = '#ADD8E6'; // Light blue grid lines
        ctx.lineWidth = 1;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#000000'; // Black text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (let x = 0; x < this.width; x += this.cellSize) {
            for (let y = 0; y < this.height - this.shopHeight; y += this.cellSize) {
                // Draw grid border
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);

                // Draw grid coordinate label
                const col = Math.floor(x / this.cellSize);
                const row = Math.floor(y / this.cellSize);
                ctx.fillText(`${col},${row}`, x + 2, y + 2);
            }
        }
    }


    /**
     * Draw the path
     */
    drawPath(ctx) {
        // Connect the path points with segments
        ctx.strokeStyle = '#663300'; // Brown path
        ctx.lineWidth = this.cellSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        // Move to the first point
        ctx.moveTo(this.path[0].x, this.path[0].y);

        // Draw lines to each subsequent point
        for (let i = 1; i < this.path.length; i++) {
            ctx.lineTo(this.path[i].x, this.path[i].y);
        }

        ctx.stroke();

        // Draw path pattern
        ctx.strokeStyle = '#552200';
        ctx.lineWidth = 2;

        // Draw crossing lines on the path
        for (let i = 0; i < this.path.length - 1; i++) {
            const start = this.path[i];
            const end = this.path[i + 1];

            // Handle horizontal segments
            if (start.y === end.y) {
                const minX = Math.min(start.x, end.x);
                const maxX = Math.max(start.x, end.x);

                for (let x = minX; x <= maxX; x += this.cellSize / 2) {
                    ctx.beginPath();
                    ctx.moveTo(x, start.y - this.cellSize / 3);
                    ctx.lineTo(x, start.y + this.cellSize / 3);
                    ctx.stroke();
                }
            }
            // Handle vertical segments
            else if (start.x === end.x) {
                const minY = Math.min(start.y, end.y);
                const maxY = Math.max(start.y, end.y);

                for (let y = minY; y <= maxY; y += this.cellSize / 2) {
                    ctx.beginPath();
                    ctx.moveTo(start.x - this.cellSize / 3, y);
                    ctx.lineTo(start.x + this.cellSize / 3, y);
                    ctx.stroke();
                }
            }
        }
    }

    /**
     * Draw the anthill (exit)
     */
    drawAnthill(ctx) {
        const exitPoint = this.path[this.path.length - 1];

        // Draw the base
        ctx.fillStyle = '#654321'; // Brown for dirt
        ctx.beginPath();
        ctx.arc(exitPoint.x, exitPoint.y, this.cellSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw the entrance
        ctx.fillStyle = '#000000'; // Black for hole
        ctx.beginPath();
        ctx.arc(exitPoint.x, exitPoint.y, this.cellSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw the defenders
     */
    drawDefenders(ctx) {
        for (const defender of this.defenders) {
            // Draw base
            ctx.fillStyle = defender.color;
            ctx.fillRect(
                defender.x,
                defender.y,
                defender.width,
                defender.height
            );

            // Draw ant features
            this.drawAnt(ctx, defender);

            // Draw attack radius (when debugging)
            if (false) { // Set to true to debug ranges
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(
                    defender.x + defender.width / 2,
                    defender.y + defender.height / 2,
                    defender.range,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
            }
        }
    }

    /**
     * Draw the enemies
     */
    drawEnemies(ctx) {
        for (const enemy of this.enemies) {
            // Draw enemy body
            ctx.fillStyle = enemy.color;
            ctx.fillRect(
                enemy.x,
                enemy.y,
                enemy.width,
                enemy.height
            );

            // Draw enemy features (eyes, legs)
            this.drawFireAnt(ctx, enemy);

            // Draw health bar
            this.drawHealthBar(ctx, enemy);
        }
    }

    /**
     * Draw a health bar above an entity
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {object} entity - The entity to draw health for
     */
    drawHealthBar(ctx, entity) {
        const barWidth = entity.width;
        const barHeight = 5;
        const x = entity.x;
        const y = entity.y - barHeight - 2;
        const healthPercent = entity.health / entity.maxHealth;

        // Draw background
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw health
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    }

    /**
     * Draw an ant (for defenders)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {object} ant - The ant entity to draw
     */
    drawAnt(ctx, ant) {
        // Position for center of ant
        const centerX = ant.x + ant.width / 2;
        const centerY = ant.y + ant.height / 2;

        // Draw legs
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        // Draw 3 legs on each side
        for (let i = 0; i < 3; i++) {
            // Left legs
            ctx.beginPath();
            ctx.moveTo(centerX - 5, centerY + (i * 6) - 6);
            ctx.lineTo(centerX - 15, centerY + (i * 8) - 8);
            ctx.stroke();

            // Right legs
            ctx.beginPath();
            ctx.moveTo(centerX + 5, centerY + (i * 6) - 6);
            ctx.lineTo(centerX + 15, centerY + (i * 8) - 8);
            ctx.stroke();
        }

        // Draw eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 8, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 8, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 8, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a fire ant (for enemies)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {object} ant - The ant entity to draw
     */
    drawFireAnt(ctx, ant) {
        // Position for center of ant
        const centerX = ant.x + ant.width / 2;
        const centerY = ant.y + ant.height / 2;

        // Draw legs
        ctx.strokeStyle = '#BB3300';
        ctx.lineWidth = 2;

        // Draw 3 legs on each side
        for (let i = 0; i < 3; i++) {
            // Left legs
            ctx.beginPath();
            ctx.moveTo(centerX - 5, centerY + (i * 6) - 6);
            ctx.lineTo(centerX - 15, centerY + (i * 8) - 8);
            ctx.stroke();

            // Right legs
            ctx.beginPath();
            ctx.moveTo(centerX + 5, centerY + (i * 6) - 6);
            ctx.lineTo(centerX + 15, centerY + (i * 8) - 8);
            ctx.stroke();
        }

        // Draw eyes
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 8, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 8, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 8, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw the UI elements
     */
    drawUI(ctx) {
        // Draw UI background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, 60);

        // Draw stats
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        // Money
        ctx.fillText(`$${this.money}`, 170, 30);

        // Lives
        ctx.fillText(`Lives: ${this.lives}`, 300, 30);

        // Wave
        ctx.fillText(`Wave: ${this.wave}`, 500, 30);

        // Pause button
        this.drawPauseButton(ctx);

        // Start wave button
        if (!this.waveInProgress) {
            this.drawStartButton(ctx);
        }
    }

    /**
     * Draw the pause button
     */
    drawPauseButton(ctx) {
        ctx.fillStyle = this.isPaused ? '#FF0000' : '#00FF00';
        ctx.fillRect(10, 10, 40, 40);

        ctx.fillStyle = '#FFFFFF';
        if (this.isPaused) {
            // Draw play symbol
            ctx.beginPath();
            ctx.moveTo(20, 15);
            ctx.lineTo(20, 45);
            ctx.lineTo(40, 30);
            ctx.closePath();
            ctx.fill();
        } else {
            // Draw pause symbol
            ctx.fillRect(15, 15, 10, 30);
            ctx.fillRect(35, 15, 10, 30);
        }
    }

    /**
     * Draw the start wave button
     */
    drawStartButton(ctx) {
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(60, 10, 90, 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('START', 105, 30);
    }

    /**
     * Draw the shop area
     */
    drawShop(ctx) {
        // Draw shop background
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, this.height - this.shopHeight, this.width, this.shopHeight);

        // Draw shop title
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('DEFENDERS', this.width / 2, this.height - this.shopHeight + 5);

        // Draw shop items
        const itemWidth = this.width / this.shopItems.length;

        for (let i = 0; i < this.shopItems.length; i++) {
            const item = this.shopItems[i];
            const x = i * itemWidth;
            const y = this.height - this.shopHeight + 25;

            // Draw item background
            ctx.fillStyle = '#555555';
            ctx.fillRect(x + 10, y, itemWidth - 20, 45);

            // Draw ant
            ctx.fillStyle = item.color;
            ctx.fillRect(x + 20, y + 10, 25, 25);

            // Draw ant features
            this.drawAnt(ctx, {
                x: x + 20,
                y: y + 10,
                width: 25,
                height: 25
            });

            // Draw item cost
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`$${item.cost}`, x + itemWidth / 2, y + 35);
        }
    }

    /**
     * Draw the dragging defender
     */
    drawDraggingDefender(ctx) {
        if (!this.mouseX || !this.mouseY) return;

        // Get grid position
        const gridX = Math.floor(this.mouseX / this.cellSize) * this.cellSize;
        const gridY = Math.floor(this.mouseY / this.cellSize) * this.cellSize;

        // Don't draw in shop area
        if (gridY >= this.height - this.shopHeight) return;

        // Determine if placement is valid
        const isValid = !this.isOnPath(gridX, gridY) &&
            !this.getDefenderAt(gridX, gridY) &&
            this.money >= this.draggingDefender.cost;

        // Draw defender with transparency
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = isValid ? this.draggingDefender.color : '#FF0000';
        ctx.fillRect(gridX, gridY, this.cellSize, this.cellSize);

        // Draw ant features
        this.drawAnt(ctx, {
            x: gridX,
            y: gridY,
            width: this.cellSize,
            height: this.cellSize
        });

        // Draw range indicator
        ctx.strokeStyle = isValid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(
            gridX + this.cellSize / 2,
            gridY + this.cellSize / 2,
            this.draggingDefender.range,
            0,
            Math.PI * 2
        );
        ctx.stroke();

        // Reset alpha
        ctx.globalAlpha = 1.0;
    }

    /**
     * Handle window resize
     */
    onResize(width, height) {
        this.width = width;
        this.height = height;

        if (this.gameMode === 'tower-defense') {
            // Recalculate path for new dimensions
            this.createPath();
        } else {
            // Reposition player
            this.player.x = Math.min(this.player.x, this.width - this.player.width);
            this.player.y = Math.min(this.player.y, this.height - this.player.height);
        }
    }

    /**
     * Clean up scene resources
     */
    cleanup() {
        // Remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        }
    }
}
