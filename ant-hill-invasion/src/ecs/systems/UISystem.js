import { System } from '../System.js';
import { eventBus } from '../../core/EventBus.js';
import { TEXT_KEYS } from '../../core/localization/TEXT_KEYS.js';
import { t } from '../../core/localization/localizationManager.js';


export class UISystem extends System {
    // Needs scene for dimensions/context, but gets state via events
    constructor(entityManager, scene, context, levelData) {
        super(entityManager);
        // Keep scene ref for static layout info (dimensions, shopItems, cellSize) 
        // and placement validation methods
        this.scene = scene; 
        this.ctx = context;
        // Store levelData if needed for UI elements (like grid dimensions for bounds?)
        this.levelData = levelData;
        this.cellSize = levelData ? levelData.grid.cellSize : 32; // Use level cell size or default

        // Local state updated by events
        this.currentMoney = 0;
        this.currentLives = 0;
        this.currentWave = 1;
        this.isWaveInProgress = false;
        this.isPaused = false; // Track pause state locally
        this.draggingDefenderInfo = null; // Updated by events
        this.mouseX = 0; // Updated by events
        this.mouseY = 0; // Updated by events

        this.unsubscribeMoney = null;
        this.unsubscribeLives = null;
        this.unsubscribeWave = null;
        this.unsubscribePause = null; // For pause state
        this.unsubscribeDragStart = null;
        this.unsubscribeDragEnd = null;
        this.unsubscribeMouseMove = null;

        this.subscribeToEvents();
        this.requestInitialState(); // Ask GameStateSystem for initial values
    }

    subscribeToEvents() {
        this.unsubscribeMoney = eventBus.subscribe('moneyChanged', (m) => { this.currentMoney = m; });
        this.unsubscribeLives = eventBus.subscribe('livesChanged', (l) => { this.currentLives = l; });
        this.unsubscribeWave = eventBus.subscribe('waveChanged', (wd) => { this.currentWave = wd.wave; this.isWaveInProgress = wd.inProgress; });
        this.unsubscribePause = eventBus.subscribe('pauseToggled', (p) => { this.isPaused = p; });
        
        // Added Drag/Move Listeners
        this.unsubscribeDragStart = eventBus.subscribe('defenderDragStarted', (itemData) => {
             this.draggingDefenderInfo = itemData;
             // console.log("UISystem: Drag started", this.draggingDefenderInfo);
         });
         this.unsubscribeDragEnd = eventBus.subscribe('defenderDragEnded', () => {
             this.draggingDefenderInfo = null;
             // console.log("UISystem: Drag ended");
         });
         this.unsubscribeMouseMove = eventBus.subscribe('mouseMoved', (pos) => {
             this.mouseX = pos.x;
             this.mouseY = pos.y;
             // console.log(`UISystem: Mouse at ${this.mouseX}, ${this.mouseY}`);
         });
    }

    requestInitialState() {
        // Publish requests for initial state. GameStateSystem should listen.
        eventBus.publish('requestInitialGameState');
    }

    cleanup() {
        // Unsubscribe from all events
        if (this.unsubscribeMoney) this.unsubscribeMoney();
        if (this.unsubscribeLives) this.unsubscribeLives();
        if (this.unsubscribeWave) this.unsubscribeWave();
        if (this.unsubscribePause) this.unsubscribePause();
        if (this.unsubscribeDragStart) this.unsubscribeDragStart();
        if (this.unsubscribeDragEnd) this.unsubscribeDragEnd();
        if (this.unsubscribeMouseMove) this.unsubscribeMouseMove();
        console.log("UISystem listeners removed.");
    }

    update(deltaTime) {
        // Render UI elements based on game mode using local state
        if (this.scene.gameMode === 'tower-defense') {
            this._drawTowerDefenseUI();
        } else {
            this._drawFreePlayUI();
        }
        
        // Draw Pause Overlay if paused
        if (this.isPaused && this.scene.gameMode === 'tower-defense') {
            this._drawPauseButton(true); // Draw in paused state overlay
        }
    }

    _drawTowerDefenseUI() {
        // Draw Stats Bar (was drawUI)
        this._drawStatsBar();
        
        // Draw Shop (was drawShop)
        this._drawShop();
        
        // Draw Dragging Defender Preview (was drawDraggingDefender)
        if (this.draggingDefenderInfo) {
            this._drawDraggingDefenderPreview();
        }
    }

    _drawFreePlayUI() {
        // Draw Instructions (was drawInstructions)
        this._drawInstructions();
        // Add any other free-play specific UI here
    }
    
    // --- Drawing methods now use local state (this.currentMoney etc.) ---

    _drawStatsBar() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.scene.width, 60);
        
        this.ctx.font = '16px "Press Start 2P", monospace'; 
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // Use local state
        this.ctx.fillText(`$${this.currentMoney}`, 170, 30); 
        this.ctx.fillText(`${t(TEXT_KEYS.LIVES)}: ${this.currentLives}`, 300, 30); 
        this.ctx.fillText(`${t(TEXT_KEYS.WAVES)}: ${this.currentWave}`, 500, 30);
        
        // Pass local pause state
        this._drawPauseButton(this.isPaused); 
        
        // Use local wave state
        if (!this.isWaveInProgress) { 
            this._drawStartButton();
        }
    }

    _drawPauseButton(isPaused) { // Uses local isPaused state passed in
        this.ctx.fillStyle = isPaused ? '#FF0000' : '#00FF00';
        this.ctx.fillRect(10, 10, 40, 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        if (isPaused) {
            this.ctx.beginPath();
            this.ctx.moveTo(20, 15); 
            this.ctx.lineTo(20, 45); 
            this.ctx.lineTo(40, 30); 
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            this.ctx.fillRect(15, 15, 10, 30);
            this.ctx.fillRect(35, 15, 10, 30);
        }
    }

    _drawStartButton() {
        this.ctx.fillStyle = '#0000FF';
        this.ctx.fillRect(60, 10, 90, 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(t(TEXT_KEYS.START_WAVE), 105, 30);
    }

    _drawShop() {
        // Uses local money state, but still needs scene for layout/items
        const shopHeight = this.scene.shopHeight;
        const width = this.scene.width;
        const height = this.scene.height;
        const shopItems = this.scene.shopItems;

        // Draw shop background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, height - shopHeight, width, shopHeight);
        
        // Draw shop title
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(t(TEXT_KEYS.DEFENDERS), width / 2, height - shopHeight + 5);
        
        // Draw shop items
        const itemWidth = width / shopItems.length;
        
        for (let i = 0; i < shopItems.length; i++) {
            const item = shopItems[i];
            const x = i * itemWidth;
            const y = height - shopHeight + 25;
            
            // Use local money state to dim if too expensive
            this.ctx.fillStyle = this.currentMoney >= item.cost ? '#555555' : '#773333'; 
            this.ctx.fillRect(x + 10, y, itemWidth - 20, 45);
            
            // Draw ant graphic
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(x + 20, y + 10, 25, 25); // Simple rect for base color
            
            // Draw ant features using the helper
            this._drawAntFeatures(x + 20, y + 10, 25, 25);
            
            // Draw item cost
            this.ctx.font = '10px "Press Start 2P", monospace';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`$${item.cost}`, x + itemWidth / 2, y + 35);
        }
    }

    _drawDraggingDefenderPreview() {
        // Use local state for mouse position and dragging info
        const mouseX = this.mouseX;
        const mouseY = this.mouseY;
        const cellSize = this.cellSize; // Use cell size from levelData
        const draggingDefender = this.draggingDefenderInfo; // Use local state

        if (!draggingDefender || !this.levelData) return; // Check local state and levelData
        
        const gridCol = Math.floor(mouseX / cellSize);
        const gridRow = Math.floor(mouseY / cellSize);

        // Check if outside grid bounds or in shop area first
        if (gridRow < 0 || gridRow >= this.levelData.grid.rows || 
            gridCol < 0 || gridCol >= this.levelData.grid.cols ||
            mouseY >= this.scene.height - this.scene.shopHeight) {
            // Optionally draw invalid preview outside bounds/in shop
            this.ctx.globalAlpha = 0.4;
            this.ctx.fillStyle = '#FF0000'; 
            this.ctx.fillRect(gridCol * cellSize, gridRow * cellSize, cellSize, cellSize);
            this._drawAntFeatures(gridCol * cellSize, gridRow * cellSize, cellSize, cellSize);
            this.ctx.globalAlpha = 1.0;
            return;
        }
        
        // Use the scene's validation method which incorporates levelData checks
        const isValidPlacement = this.scene.isValidPlacement(mouseX, mouseY);
        const canAfford = this.currentMoney >= draggingDefender.cost; // Check affordability locally
        
        const finalIsValid = isValidPlacement && canAfford;

        // Draw defender preview with transparency
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = finalIsValid ? draggingDefender.color : '#FF0000'; 
        this.ctx.fillRect(gridCol * cellSize, gridRow * cellSize, cellSize, cellSize);
        
        // Draw ant features
        this._drawAntFeatures(gridCol * cellSize, gridRow * cellSize, cellSize, cellSize);
        
        // Draw range indicator
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = finalIsValid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            gridCol * cellSize + cellSize / 2,
            gridRow * cellSize + cellSize / 2,
            draggingDefender.range,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
    }

     _drawInstructions() {
        // Draw instruction box
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(this.scene.width / 2 - 250, 20, 500, 60);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.scene.width / 2 - 250, 20, 500, 60);
        
        // Draw text
        this.ctx.font = '16px "Press Start 2P", monospace, Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Use arrow keys to control. ESC to return to menu.', this.scene.width / 2, 50);
    }

    _drawAntFeatures(x, y, width, height) {
        // Moved drawAnt logic here, drawing features over the base rect
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // Draw legs
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        
        // Draw 3 legs on each side
        for (let i = 0; i < 3; i++) {
            // Left legs
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 5, centerY + (i * 6) - 6);
            this.ctx.lineTo(centerX - 15, centerY + (i * 8) - 8);
            this.ctx.stroke();
            
            // Right legs
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 5, centerY + (i * 6) - 6);
            this.ctx.lineTo(centerX + 15, centerY + (i * 8) - 8);
            this.ctx.stroke();
        }
        
        // Draw eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5, centerY - 8, 3, 0, Math.PI * 2);
        this.ctx.arc(centerX + 5, centerY - 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 5, centerY - 8, 1, 0, Math.PI * 2);
        this.ctx.arc(centerX + 5, centerY - 8, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }
} 