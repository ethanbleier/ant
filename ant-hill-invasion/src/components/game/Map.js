/**
 * Map class for tower defense game
 * Handles the game board, enemy paths, and tower placement grid
 */
export class Map {
    /**
     * Create a new Map
     * @param {number} width - Width of the map in grid cells
     * @param {number} height - Height of the map in grid cells
     * @param {number} cellSize - Size of each grid cell in pixels
     */
    constructor(width = 20, height = 12, cellSize = 32) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        
        // Grid representation of the map
        // 0 = path, 1 = buildable, 2 = obstacle, 3 = ant hill (goal)
        this.grid = [];
        
        // Path waypoints for enemies to follow
        this.waypoints = [];
        
        // Tiles used in the map
        this.tiles = {
            path: { id: 0, color: '#964B00' },     // Brown path
            buildable: { id: 1, color: '#7CFC00' }, // Lawn green
            obstacle: { id: 2, color: '#556B2F' },  // Dark olive green
            anthill: { id: 3, color: '#8B4513' }    // Saddle brown
        };
        
        // Initialize the grid with empty cells
        this.initializeGrid();
    }
    
    /**
     * Initialize the grid with default values
     */
    initializeGrid() {
        this.grid = [];
        
        // Create a 2D array representing the map grid
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                // Default to buildable terrain
                row.push(this.tiles.buildable.id);
            }
            this.grid.push(row);
        }
    }
    
    /**
     * Load a predefined map
     * @param {number} level - Level number to load
     */
    loadMap(level) {
        // Reset the grid
        this.initializeGrid();
        
        // Reset waypoints
        this.waypoints = [];
        
        // Load the specified level
        switch(level) {
            case 1:
                this.createLevel1();
                break;
            case 2:
                this.createLevel2();
                break;
            default:
                this.createLevel1();
                break;
        }
        
        // Generate waypoints from the path
        this.generateWaypoints();
    }
    
    /**
     * Create the first level map
     * Simple path from left to right with some obstacles
     */
    createLevel1() {
        // Create path from left to right
        for (let x = 0; x < this.width; x++) {
            // Make a winding path
            let y;
            if (x < this.width / 3) {
                y = Math.floor(this.height / 3);
            } else if (x < this.width * 2/3) {
                y = Math.floor(this.height * 2/3);
            } else {
                y = Math.floor(this.height / 2);
            }
            
            // Set the path tile
            this.grid[y][x] = this.tiles.path.id;
            
            // Add some width to the path
            if (y > 0) this.grid[y-1][x] = this.tiles.path.id;
            if (y < this.height - 1) this.grid[y+1][x] = this.tiles.path.id;
        }
        
        // Place the ant hill (goal) at the end of the path
        const antHillX = this.width - 1;
        const antHillY = Math.floor(this.height / 2);
        this.grid[antHillY][antHillX] = this.tiles.anthill.id;
        
        // Add some obstacles (non-buildable areas)
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // Don't place obstacles on the path
            if (this.grid[y][x] === this.tiles.buildable.id) {
                this.grid[y][x] = this.tiles.obstacle.id;
            }
        }
    }
    
    /**
     * Create the second level map
     * More complex path with multiple turns
     */
    createLevel2() {
        // Create starting point on the left
        const startY = Math.floor(this.height / 2);
        
        // Draw a more complex path
        // Horizontal path from left
        for (let x = 0; x < this.width / 4; x++) {
            this.grid[startY][x] = this.tiles.path.id;
        }
        
        // Vertical path down
        for (let y = startY; y < this.height - 2; y++) {
            this.grid[y][Math.floor(this.width / 4)] = this.tiles.path.id;
        }
        
        // Horizontal path to the right
        for (let x = Math.floor(this.width / 4); x < this.width - 2; x++) {
            this.grid[this.height - 3][x] = this.tiles.path.id;
        }
        
        // Vertical path up
        for (let y = this.height - 3; y >= 2; y--) {
            this.grid[y][this.width - 3] = this.tiles.path.id;
        }
        
        // Horizontal path to the right edge
        for (let x = this.width - 3; x < this.width; x++) {
            this.grid[2][x] = this.tiles.path.id;
        }
        
        // Place the ant hill (goal) at the end of the path
        this.grid[2][this.width - 1] = this.tiles.anthill.id;
        
        // Add some random obstacles
        for (let i = 0; i < 15; i++) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            
            // Don't place obstacles on the path
            if (this.grid[y][x] === this.tiles.buildable.id) {
                this.grid[y][x] = this.tiles.obstacle.id;
            }
        }
    }
    
    /**
     * Generate waypoints from the path for enemies to follow
     */
    generateWaypoints() {
        // Find the starting point (leftmost path tile)
        let startX = -1;
        let startY = -1;
        
        for (let y = 0; y < this.height; y++) {
            if (this.grid[y][0] === this.tiles.path.id) {
                startX = 0;
                startY = y;
                break;
            }
        }
        
        if (startX === -1) {
            console.error("No valid starting point found on the map!");
            return;
        }
        
        // Start with the entry point
        this.waypoints.push({
            x: startX * this.cellSize + this.cellSize / 2,
            y: startY * this.cellSize + this.cellSize / 2
        });
        
        // Find the path by following connected path tiles
        this.tracePathWaypoints(startX, startY);
    }
    
    /**
     * Trace the path and create waypoints at corners and ends
     * @param {number} startX - Starting X grid position
     * @param {number} startY - Starting Y grid position
     */
    tracePathWaypoints(startX, startY) {
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));
        let currentX = startX;
        let currentY = startY;
        let lastDirection = "right"; // Assume starting from left edge
        
        visited[currentY][currentX] = true;
        
        // Continue until we reach the end of the path or the ant hill
        while (true) {
            // Check the four possible directions
            const directions = [
                { dx: 0, dy: -1, name: "up" },
                { dx: 1, dy: 0, name: "right" },
                { dx: 0, dy: 1, name: "down" },
                { dx: -1, dy: 0, name: "left" }
            ];
            
            let foundNextStep = false;
            let newDirection = lastDirection;
            
            for (const dir of directions) {
                const newX = currentX + dir.dx;
                const newY = currentY + dir.dy;
                
                // Check if the new position is valid
                if (newX >= 0 && newX < this.width && 
                    newY >= 0 && newY < this.height && 
                    !visited[newY][newX] && 
                    (this.grid[newY][newX] === this.tiles.path.id || 
                     this.grid[newY][newX] === this.tiles.anthill.id)) {
                    
                    // Add a waypoint if there's a direction change
                    if (dir.name !== lastDirection) {
                        this.waypoints.push({
                            x: currentX * this.cellSize + this.cellSize / 2,
                            y: currentY * this.cellSize + this.cellSize / 2
                        });
                        newDirection = dir.name;
                    }
                    
                    // Move to the next position
                    visited[newY][newX] = true;
                    currentX = newX;
                    currentY = newY;
                    foundNextStep = true;
                    break;
                }
            }
            
            // If we found the next step, update the last direction
            if (foundNextStep) {
                lastDirection = newDirection;
            } else {
                // No more steps, add the final waypoint
                this.waypoints.push({
                    x: currentX * this.cellSize + this.cellSize / 2,
                    y: currentY * this.cellSize + this.cellSize / 2
                });
                break;
            }
            
            // If we've reached the ant hill, add the final waypoint and exit
            if (this.grid[currentY][currentX] === this.tiles.anthill.id) {
                this.waypoints.push({
                    x: currentX * this.cellSize + this.cellSize / 2,
                    y: currentY * this.cellSize + this.cellSize / 2
                });
                break;
            }
        }
    }
    
    /**
     * Check if a grid cell is buildable
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {boolean} True if the cell is buildable
     */
    isBuildable(gridX, gridY) {
        // Check if coordinates are within bounds
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }
        
        // Check if the cell is marked as buildable
        return this.grid[gridY][gridX] === this.tiles.buildable.id;
    }
    
    /**
     * Convert screen coordinates to grid coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} Object with grid x and y coordinates
     */
    screenToGrid(screenX, screenY) {
        return {
            x: Math.floor(screenX / this.cellSize),
            y: Math.floor(screenY / this.cellSize)
        };
    }
    
    /**
     * Convert grid coordinates to screen coordinates (center of cell)
     * @param {number} gridX - Grid X coordinate
     * @param {number} gridY - Grid Y coordinate
     * @returns {Object} Object with screen x and y coordinates (center of cell)
     */
    gridToScreen(gridX, gridY) {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }
    
    /**
     * Get the enemy path waypoints
     * @returns {Array} Array of waypoint objects with x and y coordinates
     */
    getWaypoints() {
        return [...this.waypoints];
    }
    
    /**
     * Render the map
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    render(ctx) {
        // Render each grid cell
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const cellType = this.grid[y][x];
                
                // Get the color for this cell type
                let color = '#000000';
                for (const tileType in this.tiles) {
                    if (this.tiles[tileType].id === cellType) {
                        color = this.tiles[tileType].color;
                        break;
                    }
                }
                
                // Draw the cell
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * this.cellSize, 
                    y * this.cellSize, 
                    this.cellSize, 
                    this.cellSize
                );
                
                // Draw grid lines
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    x * this.cellSize, 
                    y * this.cellSize, 
                    this.cellSize, 
                    this.cellSize
                );
            }
        }
        
        // Optionally, render the waypoints for debugging
        /*
        ctx.fillStyle = '#FF0000';
        for (const waypoint of this.waypoints) {
            ctx.beginPath();
            ctx.arc(waypoint.x, waypoint.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        */
    }
} 