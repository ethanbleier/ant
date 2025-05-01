import { System } from '../System.js';
import { eventBus } from '../../core/EventBus.js'; // Import eventBus

export class MapRenderingSystem extends System {
    // Needs scene reference for map data (path, dimensions) and context for drawing
    constructor(entityManager, scene, context, levelData) {
        super(entityManager);
        this.scene = scene;
        this.ctx = context;
        if (!levelData) {
            throw new Error("MapRenderingSystem requires levelData.");
        }
        this.levelData = levelData;
        console.log("MapRenderingSystem Constructor: Received levelData:", this.levelData);
        this.cellSize = levelData.grid.cellSize;
        this.gridPath = levelData.path; // Grid path
        this.pixelPath = this.gridPath.map(p => this.getPixelCoords(p)); // Convert to pixel path for drawing

        // Queen Ant properties
        this.queenAntImage = null;
        this.isQueenAntImageLoaded = false;
        this.loadQueenAntImage();

        // Health properties
        this.maxLives = levelData.initialResources.lives;
        this.currentLives = levelData.initialResources.lives; // Start with max lives

        // Subscribe to lives changes
        this.unsubscribeLivesChanged = eventBus.subscribe('livesChanged', (lives) => {
            this.currentLives = lives;
        });
    }

    /**
     * Load the queen ant image
     */
     loadQueenAntImage() {
        this.queenAntImage = new Image();
        this.queenAntImage.src = 'assets/models/queen_ant.png';
        this.queenAntImage.onload = () => {
            this.isQueenAntImageLoaded = true;
            console.log("MapRenderingSystem: Queen Ant image loaded successfully.");
        };
        this.queenAntImage.onerror = () => {
            console.error("MapRenderingSystem: Failed to load Queen Ant image.");
            this.isQueenAntImageLoaded = false;
        };
    }

    // Helper to convert grid to pixel (center)
    getPixelCoords(gridPoint) {
        if (!gridPoint) return null;
        return {
            x: gridPoint.col * this.cellSize + this.cellSize / 2,
            y: gridPoint.row * this.cellSize + this.cellSize / 2
        };
    }

    update(deltaTime) {
        // Only render map elements in tower defense mode for now
        if (this.scene.gameMode === 'tower-defense') {
            this._drawGrid();
            this._drawPlacementAreas(); // Optionally draw allowed placement areas
            this._drawPath();
            this._drawAnthill();
        }
        // Could add free-play background/grid drawing here if needed
    }

    // --- Drawing methods adapted for levelData --- 

    _drawGrid() {
        const width = this.levelData.grid.cols * this.cellSize; // Use level grid dimensions
        const height = this.levelData.grid.rows * this.cellSize; // Use level grid dimensions
        const cellSize = this.cellSize;
        // const shopHeight = this.scene.shopHeight; // Maybe shop area is outside grid?

        this.ctx.strokeStyle = '#ADD8E6'; // Light blue grid
        this.ctx.lineWidth = 0.5; // Thinner lines
        
        // Vertical grid lines
        for (let x = 0; x <= width; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 0; y <= height; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    _drawPlacementAreas() {
        if (!this.levelData.placementAreas) return;
        
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Light green semi-transparent
        for (const area of this.levelData.placementAreas) {
            const x = area.col * this.cellSize;
            const y = area.row * this.cellSize;
            this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
        }
    }
    
    _drawPath() {
        const path = this.pixelPath; // Use pre-calculated pixel path
        const cellSize = this.cellSize;

        if (!path || path.length < 2) return;

        // Connect the path points with segments
        this.ctx.strokeStyle = '#663300'; // Brown path
        this.ctx.lineWidth = cellSize * 0.8; // Slightly thinner than cell
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        
        // Move to the first point
        this.ctx.moveTo(path[0].x, path[0].y);
        
        // Draw lines to each subsequent point
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        
        this.ctx.stroke();
        
        // // Draw path pattern (optional visual detail - remove/adapt if needed)
        // this.ctx.strokeStyle = '#552200';
        // this.ctx.lineWidth = 2;
        // ... (keep or remove the pattern drawing logic) ...
    }
    
    _drawAnthill() {
        console.log("MapRenderingSystem _drawAnthill: Checking this.levelData:", this.levelData);
        // Use levelData.anthillPos for the top-left corner of the 3x3 area
        if (!this.levelData || !this.levelData.anthillPos) {
            console.error("MapRenderingSystem: Cannot draw anthill, missing levelData.anthillPos.");
            return;
        }
        // Apply offsets: move 2 rows down, 2 columns left
        const rowOffset = 2;
        const colOffset = -2; 
        const anthillRow = this.levelData.anthillPos.row + rowOffset;
        const anthillCol = this.levelData.anthillPos.col + colOffset;
        const cellSize = this.cellSize;

        // Calculate top-left pixel coordinates for the 3x3 area
        const drawX = anthillCol * cellSize;
        const drawY = anthillRow * cellSize;
        const drawWidth = 3 * cellSize;
        const drawHeight = 3 * cellSize;

        // Render Queen Ant image if loaded
        if (this.isQueenAntImageLoaded && this.queenAntImage) {
            // Draw the queen ant image covering the 3x3 grid area
            this.ctx.drawImage(
                this.queenAntImage,
                drawX,
                drawY,
                drawWidth,
                drawHeight
            );

            // Draw Health Bar (position adjusted, size/color modified)
            const currentLives = this.currentLives;
            const maxLives = this.maxLives;
            
            // --- Health Bar Modifications ---
            const healthBarWidth = cellSize * 2.0; // Make it wider (2 cells wide)
            const healthBarHeight = 10; // Make it taller
            const healthBarX = drawX + (drawWidth / 2) - (healthBarWidth / 2); // Centered above 3x3 image
            const healthBarY = drawY - healthBarHeight - 5; // Positioned 5px above the image
            const healthPercentage = Math.max(0, currentLives / maxLives);

            // Background of health bar
            this.ctx.fillStyle = '#555555'; // Dark grey background
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

            // Foreground (actual health)
            this.ctx.fillStyle = '#00FF00'; // Changed to Green health
            this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

            // Optional: Health bar border
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            // --- End Health Bar Modifications ---

        } else {
             // Fallback: Draw a 3x3 colored rectangle if image fails
             this.ctx.fillStyle = '#A0522D'; // Sienna brown fallback
             this.ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
             this.ctx.strokeStyle = '#000000';
             this.ctx.strokeRect(drawX, drawY, drawWidth, drawHeight); 

             // Draw simple text indication
             this.ctx.fillStyle = '#FFFFFF';
             this.ctx.font = '12px Arial';
             this.ctx.textAlign = 'center';
             this.ctx.fillText('Anthill', drawX + drawWidth / 2, drawY + drawHeight / 2);
        }
    }

    cleanup() {
        // Unsubscribe from events when the system is no longer needed
        if (this.unsubscribeLivesChanged) {
            this.unsubscribeLivesChanged();
            this.unsubscribeLivesChanged = null; // Clear reference
        }
        console.log("MapRenderingSystem listeners removed.");
    }
} 