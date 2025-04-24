import { isKeyDown } from '../core/input.js';
import { getImage } from '../core/resources.js';
import { EntityManager } from '../ecs/EntityManager.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { PathFollowingSystem } from '../ecs/systems/PathFollowingSystem.js';
import { CombatSystem } from '../ecs/systems/CombatSystem.js';
import { GameStateSystem } from '../ecs/systems/GameStateSystem.js';
import { InputSystem } from '../ecs/systems/InputSystem.js';
import { UISystem } from '../ecs/systems/UISystem.js';
import { MapRenderingSystem } from '../ecs/systems/MapRenderingSystem.js';
import { CollisionSystem } from '../ecs/systems/CollisionSystem.js';
import { ProjectileSystem } from '../ecs/systems/ProjectileSystem.js';
import { eventBus } from '../core/EventBus.js';
import { loadLevelData } from '../core/levelLoader.js';

// Components
import { Position, Velocity, Renderable, Health, Collider, Defender } from '../ecs/components/index.js';
import { PathFollower } from '../ecs/components/PathFollower.js';
import { Enemy } from '../ecs/components/Enemy.js';
import { PlayerControlled } from '../ecs/components/PlayerControlled.js';
import { Obstacle } from '../ecs/components/Obstacle.js';
import { CollidingWith } from '../ecs/components/CollidingWith.js';
// TODO: Import PlayerControlled, AI, etc.

export class GameScene {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        this.entityManager = new EntityManager();
        this.systems = [];
        
        this.gameMode = 'tower-defense';
        
        this.path = [];
        this.cellSize = 32;
        this.levelData = null;
        
        this.selectedDefender = null;
        this.draggingDefender = null;
        this.mouseX = 0; 
        this.mouseY = 0;
        
        // Local pause state synchronized via events
        this.isPaused = false; 

        this.shopItems = [
            { type: 'worker', cost: 20, damage: 5, range: 100, speed: 2.0, color: '#3D2817' },
            { type: 'soldier', cost: 50, damage: 25, range: 150, speed: 0.8, color: '#000000' },
            { type: 'sniper', cost: 100, damage: 60, range: 250, speed: 0.5, color: '#654321' }
        ];
        
        this.shopHeight = 80;

        // Scene subscriptions
        this.unsubscribePlaceDefender = null;
        this.unsubscribeSpawnSingleEnemy = null;
        this.unsubscribePauseToggle = null; // Add subscription for pause state
    }

    /**
     * Initialize the game scene
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     * @param {string} levelId - The ID of the level to load
     */
    async initialize(canvas, ctx, levelId) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        this.entityManager = new EntityManager();

        // Load level data FIRST
        try {
            this.levelData = await loadLevelData(levelId);
            if (!this.levelData) throw new Error('Level data is null after loading.');
            this.cellSize = this.levelData.grid.cellSize; // Update cell size from level data
            console.log(`GameScene initialized with level: ${levelId}, cell size: ${this.cellSize}`);
        } catch (error) {
            console.error("FATAL: Failed to initialize GameScene due to level loading error:", error);
            // Handle error appropriately (e.g., show an error message, load a default level)
            // Prevent the game from continuing if level fails to load
            return; 
        }

        // Now initialize systems, passing levelData where needed
        // Note: Systems might need modification to accept/use levelData
        const gameStateSystem = new GameStateSystem(this.entityManager, this.levelData); // Pass levelData
        const pathFollowingSystem = new PathFollowingSystem(this.entityManager, this.levelData); // Pass levelData
        const mapRenderingSystem = new MapRenderingSystem(this.entityManager, this, this.ctx, this.levelData); // Pass levelData

        this.systems = [
            new InputSystem(this.entityManager, this, this.canvas),
            pathFollowingSystem, // Use instance
            new MovementSystem(this.entityManager),
            new CollisionSystem(this.entityManager),
            new CombatSystem(this.entityManager),
            new ProjectileSystem(this.entityManager, this.ctx),
            gameStateSystem,    // Use instance
            mapRenderingSystem, // Use instance
            new RenderSystem(this.entityManager, this.ctx), 
            new UISystem(this.entityManager, this, this.ctx, this.levelData) // Pass levelData
        ];
        
        gameStateSystem.initializeState(); // Initialize after system creation

        // Subscribe to placement requests
        this.unsubscribePlaceDefender = eventBus.subscribe('placeDefenderRequested', (payload) => {
             // Pass scene context for validation
             this.placeDefender(payload.x, payload.y, payload.typeData);
        });

        // Subscribe to single enemy spawn requests from GameStateSystem
        this.unsubscribeSpawnSingleEnemy = eventBus.subscribe('spawnSingleEnemy', (payload) => {
            if (!this.isPaused && this.levelData) {
                // Pass levelData and specific enemy type/properties if needed
                this.createEnemy(this.levelData, payload.type);
            }
        });

        // Subscribe to pause state changes
        this.unsubscribePauseToggle = eventBus.subscribe('pauseToggled', (pausedState) => {
            this.isPaused = pausedState;
            console.log(`GameScene pause state updated: ${this.isPaused}`);
        });

        // No need for gameMode specific init if TD is the only mode using levels
        // if (this.gameMode === 'tower-defense') {
        //     this.initializeTowerDefense(); 
        // } else {
        //     this.initializeFreePlay();
        // }
    }
    
    /**
     * Create a new enemy (potentially adapted for level data and type)
     * @param {object} levelData - The loaded level data.
     * @param {string} enemyType - The type of enemy to create (e.g., "fireAnt").
     */
    createEnemy(levelData, enemyType) {
        if (!levelData || !levelData.path || levelData.path.length === 0) {
            console.error("Cannot create enemy: Invalid level data or path.");
            return;
        }

        // Get start coordinates from level data (row, col)
        const startGridPoint = levelData.path[0];
        // Convert grid coords to pixel coords (center of the cell)
        const startPixelX = startGridPoint.col * this.cellSize + this.cellSize / 2;
        const startPixelY = startGridPoint.row * this.cellSize + this.cellSize / 2;

        // TODO: Get enemy properties based on enemyType from a definition registry/config
        // Example properties (replace with actual data lookup)
        let enemyProps = { 
            speed: 50, 
            health: 100, 
            reward: 10, 
            sprite: 'fireAntSprite', 
            color: '#FF0000' // Red for fire ants
        };
        if (enemyType === 'leafCutterAnt') {
            enemyProps = { 
                speed: 40, 
                health: 150, 
                reward: 15, 
                sprite: 'leafCutterAntSprite', 
                color: '#00FF00' // Green for leaf cutters
            }; 
        }
        // Add more types as needed...

        const enemyEntity = this.entityManager.createEntity();

        this.entityManager.addComponent(enemyEntity.id, new Position(startPixelX, startPixelY));
        this.entityManager.addComponent(enemyEntity.id, new Velocity(0, 0));
        // Pass the fallback color to Renderable
        this.entityManager.addComponent(enemyEntity.id, new Renderable(enemyProps.sprite, this.cellSize, this.cellSize, 1, 1, enemyProps.color)); 
        this.entityManager.addComponent(enemyEntity.id, new Health(enemyProps.health, enemyProps.health));
        this.entityManager.addComponent(enemyEntity.id, new Collider(this.cellSize * 0.8, this.cellSize * 0.8));
        // Pass the grid path to PathFollower, system handles pixel conversion
        this.entityManager.addComponent(enemyEntity.id, new PathFollower(levelData.path, 0, enemyProps.speed)); 
        this.entityManager.addComponent(enemyEntity.id, new Enemy(enemyProps.reward, enemyType)); // Store type in component

        console.log(`Created enemy ${enemyEntity.id} of type ${enemyType}`);
    }
    
    /**
     * Place a defender on the map
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {object} defenderType - Type of defender to place (from shopItems)
     */
    placeDefender(x, y, defenderType) {
        if (!this.levelData) {
            console.error("Cannot place defender: Level data not loaded.");
            return;
        }
        
        // Use checkAffordable with a callback
        eventBus.publish('checkAffordable', { 
            amount: defenderType.cost, 
            callback: (canAfford) => {
                if (!canAfford) {
                    console.log("Cannot afford defender.");
                    return; 
                }

                // Perform placement validation using the dedicated method
                if (!this.isValidPlacement(x, y)) {
                    console.log(`Invalid placement location at (${x}, ${y})`);
                    return;
                }

                // Placement is valid and affordable, proceed
                const gridX = Math.floor(x / this.cellSize) * this.cellSize;
                const gridY = Math.floor(y / this.cellSize) * this.cellSize;
                const centerX = gridX + this.cellSize / 2;
                const centerY = gridY + this.cellSize / 2;
        
                const defenderEntity = this.entityManager.createEntity();
                this.entityManager.addComponent(defenderEntity.id, new Position(centerX, centerY));
                this.entityManager.addComponent(defenderEntity.id, new Velocity(0, 0)); 
                // TODO: Use defender specific sprite if available
                this.entityManager.addComponent(defenderEntity.id, new Renderable('defenderSprite', this.cellSize, this.cellSize, 1, 1, defenderType.color || '#0000FF')); 
                this.entityManager.addComponent(defenderEntity.id, new Health(100, 100)); // TODO: Use defender specific health?
                this.entityManager.addComponent(defenderEntity.id, new Collider(this.cellSize, this.cellSize));
                this.entityManager.addComponent(defenderEntity.id, new Defender( defenderType.type, defenderType.damage, defenderType.range, defenderType.speed, 0, null ));

                eventBus.publish('spendMoney', defenderType.cost);
                console.log(`Placed defender ${defenderEntity.id} (${defenderType.type}) at grid (${Math.floor(x/this.cellSize)}, ${Math.floor(y/this.cellSize)})`);
            }
        });
    }
    
    /**
     * Check if a placement position is valid based on level data.
     * @param {number} x - X coordinate (pixel)
     * @param {number} y - Y coordinate (pixel)
     * @returns {boolean} True if the placement is valid.
     */
    isValidPlacement(x, y) {
        if (!this.levelData) return false; // Cannot validate without level data

        const gridCol = Math.floor(x / this.cellSize);
        const gridRow = Math.floor(y / this.cellSize);

        // Check bounds
        if (gridRow < 0 || gridRow >= this.levelData.grid.rows || gridCol < 0 || gridCol >= this.levelData.grid.cols) {
            return false;
        }

        // 1. Check if it's within a defined placement area
        const isInPlacementArea = this.levelData.placementAreas.some(area => 
            area.row === gridRow && area.col === gridCol
        );

        if (!isInPlacementArea) {
            return false; 
        }

        // 2. Check if it overlaps with the path 
        // (This check is redundant if placementAreas are guaranteed not to overlap path, but safe to keep)
        const isOnPath = this.levelData.path.some(point => 
            point.row === gridRow && point.col === gridCol
        );

        if (isOnPath) {
            return false;
        }

        // 3. Check if another defender is already there (using getDefenderAt)
        if (this.getDefenderAt(x, y)) {
            return false;
        }

        // 4. Check if within shop area
        if (y >= this.height - this.shopHeight) { // Use >= for safety
            return false;
        }

        return true; // All checks passed
    }
    
    /**
     * Get a defender at a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {object|null} The defender entity or null
     */
    getDefenderAt(x, y) {
        const gridX = Math.floor(x / this.cellSize) * this.cellSize;
        const gridY = Math.floor(y / this.cellSize) * this.cellSize;
        const tolerance = 1; // Tolerance for position check

        // Query entities with Position and Defender components
        const defenderEntities = this.entityManager.queryEntities(['Position', 'Defender']);

        // Find an entity close to the grid center
        // Note: This assumes Position component stores center coordinates
        for (const entity of defenderEntities) {
            const position = entity.getComponent('Position');
            // Check if entity's center position matches the grid cell's center
            if (Math.abs(position.x - (gridX + this.cellSize / 2)) < tolerance &&
                Math.abs(position.y - (gridY + this.cellSize / 2)) < tolerance) {
                return entity; // Return the found entity
            }
        }

        return null; // No defender found at this grid cell
    }
    
    /**
     * Update game scene (called each frame)
     */
    update() {
        const deltaTime = 1 / 60; // TODO: Get actual delta time

        // Use local isPaused flag synced by events
        if (!this.isPaused) { // Now uses the synchronized isPaused property
            // Update game logic systems only if not paused
            for (const system of this.systems) {
                // Ensure systems that should run when paused are excluded
                if (!(system instanceof MapRenderingSystem) && 
                    !(system instanceof RenderSystem) && 
                    !(system instanceof UISystem)) 
                {
                    system.update(deltaTime);
                }
            }
        }
        
        // Always update Rendering and UI Systems regardless of pause state
        this.systems.forEach(system => {
            if (system instanceof MapRenderingSystem || system instanceof RenderSystem || system instanceof UISystem) {
                system.update(deltaTime);
            }
        });
    }

    /**
     * Render the game scene
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    render(ctx) {
        // Clear background (still done here before systems render)
        // ctx.fillStyle = '#87ceeb'; // Sky blue background <-- REMOVE
        // ctx.fillRect(0, 0, this.width, this.height); <-- REMOVE

        // Rendering is now fully handled by systems called in the update loop:
        // MapRenderingSystem -> RenderSystem -> UISystem
        
        // Removed map drawing calls (drawGrid, drawPath, drawAnthill)
    }
    
    /**
     * Handle window resize
     */
    onResize(width, height) {
        this.width = width;
        this.height = height;
        
        if (this.gameMode === 'tower-defense') {
             // If path calculation based on dimensions is needed, it should use levelData grid info
            // For fixed-size grid levels, resizing might not affect gameplay logic, only viewport.
            console.warn("onResize: Ensure rendering and UI adapt correctly. Gameplay logic assumes fixed grid from levelData.");
        } else {
            // Reposition player
            // this.player.x = Math.min(this.player.x, this.width - this.player.width);
            // this.player.y = Math.min(this.player.y, this.height - this.player.height);
        }
    }

    /**
     * Clean up scene resources
     */
    cleanup() {
        console.log("Cleaning up GameScene and Systems...");
        // Unsubscribe scene-specific listeners
        if (this.unsubscribePlaceDefender) this.unsubscribePlaceDefender();
        if (this.unsubscribeSpawnSingleEnemy) this.unsubscribeSpawnSingleEnemy();
        if (this.unsubscribePauseToggle) this.unsubscribePauseToggle(); // Unsubscribe pause listener
        
        // Clean up systems
        this.systems.forEach(system => {
            if (typeof system.cleanup === 'function') {
                system.cleanup();
            }
        });
        console.log("GameScene cleanup complete.");
    }
}
