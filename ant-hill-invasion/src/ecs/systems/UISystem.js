import { System } from '../System.js';
import { eventBus } from '../../core/EventBus.js';
import { drawImage } from '../../core/resources.js'; // Import drawImage
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
        this.isGameOver = false; // track game over state
        this.isGameWon = false; // track game won state
        this.gameSpeed = 1; // track game speed locally (1 = normal, 2 = 2x, 4 = 4x)
        this.isAutoSkipEnabled = false; // track auto-skip state locally
        this.draggingDefenderInfo = null; // Updated by events
        this.mouseX = 0; // Updated by events
        this.mouseY = 0; // Updated by events
        this.finalLives = null; // Store final lives for star rating
        
        // state for wave income accumulator
        this.waveIncomeAccumulator = 0;

        // purchase history tracking
        this.purchaseHistory = [];                // array to track purchased defenders
        this.maxHistoryItems = 5;                 // maximum number of purchases to display

        this.unsubscribeMoney = null;
        this.unsubscribeLives = null;
        this.unsubscribeWave = null;
        this.unsubscribePause = null;             // for pause state
        this.unsubscribeSpeed = null;             // for game speed state
        this.unsubscribeAutoSkip = null;          // for auto-skip state
        this.unsubscribeDragStart = null;
        this.unsubscribeDragEnd = null;
        this.unsubscribeMouseMove = null;
        this.unsubscribeDefenderPurchased = null; // subscription for purchases
        this.unsubscribeGameOver = null;          // subscription for game over
        this.unsubscribeGameWin = null;           // subscription for game win
        this.unsubscribeMoneyEarned = null;       // subscription for wave income

        this.subscribeToEvents();
        this.requestInitialState(); // Ask GameStateSystem for initial values
    }

    subscribeToEvents() {
        this.unsubscribeMoney = eventBus.subscribe('moneyChanged', (m) => { this.currentMoney = m; });
        this.unsubscribeLives = eventBus.subscribe('livesChanged', (l) => { this.currentLives = l; });
        this.unsubscribeWave = eventBus.subscribe('waveChanged', (wd) => { 
            this.currentWave = wd.wave;
            this.isWaveInProgress = wd.inProgress;
            // reset accumulator when a new wave starts (or when game loads initially with wave 0/inProgress false)
            if (this.isWaveInProgress) {
                this.waveIncomeAccumulator = 0;
            } 
            // note: accumulator display is handled in _drawStatsBar based on isWaveInProgress
        });
        this.unsubscribePause = eventBus.subscribe('pauseToggled', (p) => { this.isPaused = p; });
        this.unsubscribeSpeed = eventBus.subscribe('speedChanged', (s) => { this.gameSpeed = s; });
        this.unsubscribeAutoSkip = eventBus.subscribe('autoSkipToggled', (enabled) => { this.isAutoSkipEnabled = enabled; });
        this.unsubscribeGameOver = eventBus.subscribe('gameOver', () => { this.isGameOver = true; }); // Listen for game over
        this.unsubscribeGameWin = eventBus.subscribe('gameWin', (payload) => { 
            this.isGameWon = true; 
            this.finalLives = payload.finalLives; // Store final lives
        }); // Listen for game win
        
        // added drag/move listeners
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
         
         // added purchase history listener
         this.unsubscribeDefenderPurchased = eventBus.subscribe('defenderPurchased', (defenderData) => {
             // add new purchase at the beginning of the array
             this.purchaseHistory.unshift({
                 type: defenderData.type || 'Defender',
                 color: defenderData.color,
                 cost: defenderData.cost,
                 wave: this.currentWave,
                 spriteName: defenderData.spriteName || 'defenderSprite', // Store spriteName
                 timestamp: Date.now()
             });
             
             // limit history size
             if (this.purchaseHistory.length > this.maxHistoryItems) {
                 this.purchaseHistory.pop();
             }
         });
         
         // NEW: subscription for wave income
         this.unsubscribeMoneyEarned = eventBus.subscribe('moneyEarnedDuringWave', (payload) => {
            this.waveIncomeAccumulator += payload.amount;
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
        if (this.unsubscribeSpeed) this.unsubscribeSpeed();
        if (this.unsubscribeAutoSkip) this.unsubscribeAutoSkip();
        if (this.unsubscribeDragStart) this.unsubscribeDragStart();
        if (this.unsubscribeDragEnd) this.unsubscribeDragEnd();
        if (this.unsubscribeMouseMove) this.unsubscribeMouseMove();
        if (this.unsubscribeDefenderPurchased) this.unsubscribeDefenderPurchased();
        if (this.unsubscribeGameOver) this.unsubscribeGameOver(); // Cleanup game over listener
        if (this.unsubscribeGameWin) this.unsubscribeGameWin(); // Cleanup game win listener
        if (this.unsubscribeMoneyEarned) this.unsubscribeMoneyEarned(); // Cleanup wave income listener
        console.log("UISystem listeners removed.");
    }

    update(deltaTime) {
        // Render UI elements based on game mode using local state
        if (this.scene.gameMode === 'tower-defense') {
            this._drawTowerDefenseUI();
        }
        
        // Draw Pause Overlay if paused
        if (this.isPaused && this.scene.gameMode === 'tower-defense') {
            this._drawPauseButton(true); // Draw in paused state overlay
        }
        
        // draw game over popup if game is over
        if (this.isGameOver) {
            this._drawGameOverPopup();
        }
        
        // draw game win popup if game is won
        if (this.isGameWon) {
            this._drawGameWinPopup();
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
    
    // --- Drawing methods now use local state (this.currentMoney etc.) ---

    _drawStatsBar() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.scene.width, 60);
        
        this.ctx.font = '16px "Press Start 2P", monospace'; 
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        // --- Left Controls Positioning ---
        const padding = 15; // Shared padding
        const buttonWidth = 40; // Standard button width
        const autoSkipButtonWidth = 40; // Explicit width for auto-skip

        // 1. Play/Pause/Start Button
        this._drawPlayPauseStartButton(); // At fixed position (10, 10)
        let currentX = 10 + buttonWidth + padding; // Position after the first button

        // 2. Auto-Skip Button
        this._drawAutoSkipButton(currentX);
        let leftControlsEndX = currentX + autoSkipButtonWidth; // Update end position after auto-skip button

        // --- Right Controls --- Determine start position
        const speedButtonWidth = 40;
        const speedControlTotalWidth = 3 * speedButtonWidth + 2 * padding; // Width of 3 buttons + 2 gaps
        const speedControlsStartX = this.scene.width - speedControlTotalWidth - padding; // Position from right edge
        this._drawSpeedControls(speedControlsStartX);

        // --- Money Text --- Positioned after left controls
        this.ctx.textAlign = 'left'; // Ensure left alignment for money
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P", monospace';

        const moneyText = `$${this.currentMoney}`;
        const moneyStartX = leftControlsEndX + padding * 1.5; // Position money after left controls
        this.ctx.fillText(moneyText, moneyStartX, 30);

        let moneyDisplayEndX = moneyStartX + this.ctx.measureText(moneyText).width;

        // Draw wave income accumulator if needed
        if (this.isWaveInProgress && this.waveIncomeAccumulator > 0) {
            const accumulatorText = `+$${this.waveIncomeAccumulator}`;
            this.ctx.font = '14px "Press Start 2P", monospace';
            const accumulatorTextWidth = this.ctx.measureText(accumulatorText).width;
            const accumulatorX = moneyDisplayEndX + padding / 2;

            this.ctx.fillStyle = `rgba(0, 255, 0, 1)`; // green
            this.ctx.fillText(accumulatorText, accumulatorX, 30);

            moneyDisplayEndX = accumulatorX + accumulatorTextWidth; // Update end position

            // restore default style
            this.ctx.font = '16px "Press Start 2P", monospace';
            this.ctx.fillStyle = '#FFFFFF';
        }

        // --- lives and wave text --- centered between money and speed controls
        const availableCenterSpace = speedControlsStartX - moneyDisplayEndX;
        const centerPointX = moneyDisplayEndX + availableCenterSpace / 2;

        const livesText = t(TEXT_KEYS.LIVES)+`: ${this.currentLives}`;
        const waveText = t(TEXT_KEYS.WAVE)+`: ${this.currentWave}`;
        const combinedText = `${livesText}    ${waveText}`; // Add spacing between them

        this.ctx.font = '16px "Press Start 2P", monospace';
        const combinedTextWidth = this.ctx.measureText(combinedText).width;

        const centeredTextStartX = centerPointX - combinedTextWidth / 2;

        // draw lives and wave text together, starting at the calculated centered position
        this.ctx.textAlign = 'left'; // keep left align but position the block centered
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText(combinedText, centeredTextStartX, 30);
    }

    _drawPlayPauseStartButton() {
        const buttonX = 10;
        const buttonY = 10;
        const buttonSize = 40;

        // determine state: paused/start (triangle) or playing (bars)
        const showPlayIcon = this.isPaused || !this.isWaveInProgress;

        this.ctx.fillStyle = showPlayIcon ? '#00FF00' : '#FF0000'; // green for play/start, red for pause
        this.ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);

        this.ctx.fillStyle = '#FFFFFF';
        if (showPlayIcon) {
            // draw play/start triangle
            this.ctx.beginPath();
            this.ctx.moveTo(buttonX + 10, buttonY + 10); // top point
            this.ctx.lineTo(buttonX + 10, buttonY + buttonSize - 10); // bottom-left point
            this.ctx.lineTo(buttonX + buttonSize - 10, buttonY + buttonSize / 2); // mid-right point
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // draw pause bars
            const barWidth = 8; // slightly thinner bars
            const barHeight = 26; // slightly shorter bars
            const barSpacing = 8; // adjust spacing
            const totalWidth = barWidth * 2 + barSpacing;
            const startX = buttonX + Math.floor((buttonSize - totalWidth) / 2); // center calculation
            const startY = buttonY + Math.floor((buttonSize - barHeight) / 2); // center calculation

            this.ctx.fillRect(startX, startY, barWidth, barHeight);
            this.ctx.fillRect(startX + barWidth + barSpacing, startY, barWidth, barHeight);
        }
    }

    _drawAutoSkipButton(xPosition) {
        const buttonY = 10;
        const buttonWidth = 40;
        const buttonHeight = 40;

        // style based on enabled state
        this.ctx.fillStyle = this.isAutoSkipEnabled ? '#4CAF50' : '#666666'; // green if enabled, grey otherwise
        this.ctx.fillRect(xPosition, buttonY, buttonWidth, buttonHeight);

        // draw icon (e.g., double arrows >> or a different symbol)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px "Press Start 2P", monospace'; // use standard icon size font
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('>>', xPosition + buttonWidth / 2, buttonY + buttonHeight / 2 + 2); // adjusted text alignment

        // optional: add border for clarity
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(xPosition, buttonY, buttonWidth, buttonHeight);
    }

    _drawSpeedControls(xPosition) {
        const buttonWidth = 40;
        const padding = 20; // Increased padding for consistency
        
        // draw 1x speed button (normal)
        const isNormalSpeed = this.gameSpeed === 1;
        this.ctx.fillStyle = isNormalSpeed ? '#4CAF50' : '#666666';
        this.ctx.fillRect(xPosition, 10, buttonWidth, 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('1x', xPosition + buttonWidth/2, 30);
        
        // draw 2x speed button
        const is2xSpeed = this.gameSpeed === 2;
        this.ctx.fillStyle = is2xSpeed ? '#2196F3' : '#666666';
        this.ctx.fillRect(xPosition + buttonWidth + padding, 10, buttonWidth, 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('2x', xPosition + buttonWidth + padding + buttonWidth/2, 30);
        
        // draw 4x speed button
        const is4xSpeed = this.gameSpeed === 4;
        this.ctx.fillStyle = is4xSpeed ? '#FF9800' : '#666666';
        this.ctx.fillRect(xPosition + 2 * (buttonWidth + padding), 10, buttonWidth, 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('4x', xPosition + 2 * (buttonWidth + padding) + buttonWidth/2, 30);
    }

    _drawShop() {
        // uses local money state, but still needs scene for layout/items
        const shopHeight = this.scene.shopHeight;
        const width = this.scene.width;
        const height = this.scene.height;
        const shopItems = this.scene.shopItems;

        // draw shop background - more retro dark blue
        this.ctx.fillStyle = '#0A1045';
        this.ctx.fillRect(0, height - shopHeight, width, shopHeight);
        
        // draw pixelated border around shop (2px border)
        this.ctx.fillStyle = '#FFD700'; // gold arcade-style border
        // top border
        this.ctx.fillRect(0, height - shopHeight, width, 2);
        
        // calculate shop sections - main shop area and purchase history
        const historyWidth = Math.floor(width * 0.22); // 22% of width for history
        const shopMainWidth = width - historyWidth;
        
        // divider between shop and history
        this.ctx.fillRect(shopMainWidth, height - shopHeight + 2, 2, shopHeight - 2);
        
        // draw 8-bit style shop title with "shadow"
        this.ctx.font = '16px "Press Start 2P", monospace';
        // text shadow
        this.ctx.fillStyle = '#FF5500'; // orange shadow
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(t(TEXT_KEYS.DEFENDERS), Math.floor(shopMainWidth / 2) + 2, height - shopHeight + 7);
        // main text
        this.ctx.fillStyle = '#FFFF00'; // yellow text
        this.ctx.fillText(t(TEXT_KEYS.DEFENDERS), Math.floor(shopMainWidth / 2), height - shopHeight + 5);
        
        // draw purchase history title
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#00FFFF'; // cyan for history title
        this.ctx.textAlign = 'center';
        this.ctx.fillText(t(TEXT_KEYS.PURCHACES), shopMainWidth + Math.floor(historyWidth / 2), height - shopHeight + 5);
        
        // draw pixelated separator under titles (horizontal line)
        this.ctx.fillStyle = '#666677'; // subtle separator color
        this.ctx.fillRect(2, height - shopHeight + 25, shopMainWidth - 4, 2);
        this.ctx.fillRect(shopMainWidth + 2, height - shopHeight + 25, historyWidth - 4, 2);

        // 8-bit palette for shop items
        const retroColors = {
            background: '#444477',
            backgroundDisabled: '#442222',
            highlight: '#888899',
            textBright: '#FFFFFF',
            textDim: '#AAAAAA'
        };
        
        // Draw improved shop items with 8-bit styling
        const itemCount = shopItems.length;
        const padding = 8;
        const itemsPerRow = Math.min(itemCount, 5); // Max 5 items per row
        const rows = Math.ceil(itemCount / itemsPerRow);
        
        // Calculate item dimensions for proper pixel alignment
        const itemWidth = Math.floor((shopMainWidth - (padding * (itemsPerRow + 1))) / itemsPerRow);
        const itemHeight = Math.floor((shopHeight - 35) / rows);
        
        // Draw shop grid
        for (let i = 0; i < itemCount; i++) {
            const item = shopItems[i];
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            
            // Pixel-perfect positioning
            const x = padding + col * (itemWidth + padding);
            const y = height - shopHeight + 30 + row * (itemHeight + padding);
            
            // Draw item background - darker if can't afford
            const canAfford = this.currentMoney >= item.cost;
            this.ctx.fillStyle = canAfford ? retroColors.background : retroColors.backgroundDisabled;
            this.ctx.fillRect(x, y, itemWidth, itemHeight);
            
            // Draw pixelated border (1px)
            this.ctx.fillStyle = canAfford ? '#FFD700' : '#AA3333';
            this.ctx.fillRect(x, y, itemWidth, 1);
            this.ctx.fillRect(x, y, 1, itemHeight);
            this.ctx.fillRect(x + itemWidth - 1, y, 1, itemHeight);
            this.ctx.fillRect(x, y + itemHeight - 1, itemWidth, 1);
            
            // Draw selector highlight on hover (add mouse detection later)
            this.ctx.fillStyle = retroColors.highlight;
            this.ctx.fillRect(x + 2, y + 2, itemWidth - 4, 2); // Top highlight
            this.ctx.fillRect(x + 2, y + 2, 2, itemHeight - 4); // Left highlight
            
            // Draw ant with retro style
            const antSize = Math.min(Math.floor(itemWidth * 0.6), Math.floor(itemHeight * 0.6));
            const antX = x + Math.floor((itemWidth - antSize) / 2);
            const antY = y + Math.floor(itemHeight * 0.2);
            
            // Draw the actual sprite
            drawImage(this.ctx, item.spriteName, antX, antY, antSize, antSize);
            
            // Draw item cost with 8-bit style
            this.ctx.font = '10px "Press Start 2P", monospace';
            
            // Retro price tag with shadow
            const priceY = y + itemHeight - 12;
            this.ctx.fillStyle = '#000000';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`$${item.cost}`, x + Math.floor(itemWidth / 2) + 1, priceY + 1);
            
            this.ctx.fillStyle = canAfford ? '#00FF00' : '#FF0000';
            this.ctx.fillText(`$${item.cost}`, x + Math.floor(itemWidth / 2), priceY);
        }
        
        // draw purchase history section
        this._drawPurchaseHistory(shopMainWidth, historyWidth, height - shopHeight, shopHeight);
    }
    
    _drawRetroAntFeatures(x, y, width, height) {
        // pixelated ant features for 8-bit style
        const blockSize = Math.max(1, Math.floor(width / 16)); // pixel size for features
        
        // draw features with pixel blocks
        const centerX = x + Math.floor(width / 2);
        const centerY = y + Math.floor(height / 2);
        
        // draw legs as pixel blocks (3 on each side)
        this.ctx.fillStyle = '#000000';
        
        // draw pixelated legs
        for (let i = 0; i < 3; i++) {
            // left legs - pixelated
            const leftLegX = centerX - blockSize * 3;
            const leftLegY = centerY + (i * blockSize * 2) - blockSize * 3;
            this.ctx.fillRect(leftLegX, leftLegY, blockSize * 2, blockSize);
            this.ctx.fillRect(leftLegX - blockSize * 2, leftLegY + blockSize, blockSize * 2, blockSize);
            
            // right legs - pixelated
            const rightLegX = centerX + blockSize;
            const rightLegY = centerY + (i * blockSize * 2) - blockSize * 3;
            this.ctx.fillRect(rightLegX, rightLegY, blockSize * 2, blockSize);
            this.ctx.fillRect(rightLegX + blockSize * 2, rightLegY + blockSize, blockSize * 2, blockSize);
        }
        
        // draw pixelated eyes (white blocks)
        this.ctx.fillStyle = '#FFFFFF';
        const eyeY = centerY - blockSize * 3;
        // left eye
        this.ctx.fillRect(centerX - blockSize * 3, eyeY, blockSize * 2, blockSize * 2);
        // right eye
        this.ctx.fillRect(centerX + blockSize, eyeY, blockSize * 2, blockSize * 2);
        
        // draw pixelated pupils (black pixels inside eyes)
        this.ctx.fillStyle = '#000000';
        // left pupil
        this.ctx.fillRect(centerX - blockSize * 2, eyeY + blockSize / 2, blockSize, blockSize);
        // right pupil
        this.ctx.fillRect(centerX + blockSize * 2, eyeY + blockSize / 2, blockSize, blockSize);
    }
    
    _drawPurchaseHistory(x, width, y, height) {
        // background for purchase history area
        this.ctx.fillStyle = '#000033'; // dark blue background
        this.ctx.fillRect(x + 2, y + 30, width - 4, height - 32);
        
        // draw history items
        const itemHeight = 38;
        const padding = 5;
        
        if (this.purchaseHistory.length === 0) {
            // show "no purchases" message if empty
            this.ctx.font = '8px "Press Start 2P", monospace';
            this.ctx.fillStyle = '#888888';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(t(TEXT_KEYS.NO_REC_PURCHASES), x + Math.floor(width / 2), y + Math.floor(height / 2));
            return;
        }
        
        // draw each purchase item
        for (let i = 0; i < this.purchaseHistory.length; i++) {
            const purchase = this.purchaseHistory[i];
            const itemY = y + 35 + (i * (itemHeight + padding));
            
            // skip if would render beyond shop area
            if (itemY + itemHeight > y + height) break;
            
            // draw item background
            this.ctx.fillStyle = '#222255';
            this.ctx.fillRect(x + padding, itemY, width - padding * 2, itemHeight);
            
            // draw pixelated border
            this.ctx.fillStyle = '#555577';
            this.ctx.fillRect(x + padding, itemY, width - padding * 2, 1);
            this.ctx.fillRect(x + padding, itemY, 1, itemHeight);
            this.ctx.fillRect(x + width - padding - 1, itemY, 1, itemHeight);
            this.ctx.fillRect(x + padding, itemY + itemHeight - 1, width - padding * 2, 1);
            
            // draw ant icon
            const iconSize = 20;
            const iconX = x + padding + 5;
            const iconY = itemY + Math.floor((itemHeight - iconSize) / 2);
            
            // draw the actual sprite from history (with fallback)
            const spriteToDraw = purchase.spriteName || 'defenderSprite';
            drawImage(this.ctx, spriteToDraw, iconX, iconY, iconSize, iconSize);
            
            // draw purchase info
            this.ctx.font = '7px "Press Start 2P", monospace';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            // display type and cost
            this.ctx.fillText(purchase.type.toUpperCase(), iconX + iconSize + 8, itemY + 8);
            this.ctx.fillStyle = '#00FF00'; // green for cost
            this.ctx.fillText(`$${purchase.cost}`, iconX + iconSize + 8, itemY + 20);
            
            // display wave purchased
            this.ctx.fillStyle = '#FFFF00'; // yellow for wave info
            this.ctx.textAlign = 'right';
            this.ctx.fillText(t(TEXT_KEYS.WAVE)+` ${purchase.wave}`, x + width - padding - 8, itemY + 14);
        }
    }

    _drawDraggingDefenderPreview() {
        // Use local state for mouse position and dragging info
        const mouseX = this.mouseX;
        const mouseY = this.mouseY;
        const cellSize = this.cellSize; // Use cell size from levelData
        const draggingDefender = this.draggingDefenderInfo; // Use local state

        if (!draggingDefender || !this.levelData) return; // Check local state and levelData
        
        // use integer grid coordinates for consistency
        const gridCol = Math.floor(mouseX / cellSize);
        const gridRow = Math.floor(mouseY / cellSize);
        
        // calculate consistent pixel positions
        const gridX = gridCol * cellSize;
        const gridY = gridRow * cellSize;
        const centerX = gridX + cellSize / 2;
        const centerY = gridY + cellSize / 2;

        // check if outside grid bounds or in shop area first
        if (gridRow < 0 || gridRow >= this.levelData.grid.rows || 
            gridCol < 0 || gridCol >= this.levelData.grid.cols ||
            mouseY >= this.scene.height - this.scene.shopHeight) {
            // optionally draw invalid preview outside bounds/in shop
            this.ctx.globalAlpha = 0.4;
            // removed fillRect and _drawAntFeatures
            // draw sprite with transparency
            drawImage(this.ctx, draggingDefender.spriteName || 'defenderSprite', gridX, gridY, cellSize, cellSize); // Added fallback
            this.ctx.globalAlpha = 1.0;
            return;
        }
        
        // use the scene's validation method which incorporates levelData checks
        const isValidPlacement = this.scene.isValidPlacement(mouseX, mouseY);
        const canAfford = this.currentMoney >= draggingDefender.cost; // check affordability locally
        
        const finalIsValid = isValidPlacement && canAfford;

        // draw defender preview with transparency
        this.ctx.globalAlpha = 0.6;
        // keep background color fill to indicate validity
        this.ctx.fillStyle = finalIsValid ? draggingDefender.color : '#FF0000'; 
        this.ctx.fillRect(gridX, gridY, cellSize, cellSize);
        
        // draw ant features scaled to cell size - REPLACED with drawImage
        // this._drawAntFeatures(gridX, gridY, cellSize, cellSize);
        // draw the actual sprite over the background fill
        drawImage(this.ctx, draggingDefender.spriteName || 'defenderSprite', gridX, gridY, cellSize, cellSize); // Added fallback
        
        // draw range indicator with proper scaling based on cell size
        const rangeInPixels = draggingDefender.range;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = finalIsValid ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            centerX,
            centerY,
            rangeInPixels,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0;
    }

    _drawGameOverPopup() {
        const centerX = this.scene.width / 2;
        const centerY = this.scene.height / 2 - 50; // adjusted slightly up
        
        // retro popup background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(centerX - 200, centerY - 75, 400, 150);
        
        // retro border
        this.ctx.strokeStyle = '#FF0000'; // red border
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(centerX - 198, centerY - 73, 396, 146);

        // game over text style
        this.ctx.font = '48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // shadow effect for game over text
        this.ctx.fillStyle = '#550000'; // dark red shadow
        this.ctx.fillText(t(TEXT_KEYS.GAME_OVER), centerX + 4, centerY + 4);

        // main game over text
        this.ctx.fillStyle = '#FF0000'; // bright red text
        this.ctx.fillText(t(TEXT_KEYS.GAME_OVER), centerX, centerY);
    }
    
    _drawGameWinPopup() {
        const centerX = this.scene.width / 2;
        const centerY = this.scene.height / 2 - 50; // adjusted slightly up
        const popupHeight = 200; // increase height for stars
        const starY = centerY + 60; // y position for stars

        // retro popup background (increased height)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(centerX - 200, centerY - 75, 400, popupHeight);

        // retro border (adjusted for new height)
        this.ctx.strokeStyle = '#FFD700'; // gold border
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(centerX - 198, centerY - 73, 396, popupHeight - 4);

        // game win text style
        this.ctx.font = '48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // shadow effect for game win text (using a dark green/blue shadow)
        this.ctx.fillStyle = '#005500'; // dark green shadow
        this.ctx.fillText(t(TEXT_KEYS.YOU_WIN), centerX + 4, centerY + 4);

        // main game win text (using a bright green/cyan color)
        this.ctx.fillStyle = '#00FF00'; // bright green text
        this.ctx.fillText(t(TEXT_KEYS.YOU_WIN), centerX, centerY);

        // --- star rating logic ---
        let stars = 0;
        const initialLives = this.levelData.initialResources.lives;
        if (this.finalLives !== null) {
            if (this.finalLives === initialLives) { // 10 lives (no damage)
                stars = 3;
            } else if (this.finalLives >= initialLives - 2) { // 8 or 9 lives (<3 damage)
                stars = 2;
            } else if (this.finalLives > 0) { // 1 to 7 lives (>3 damage, but still won)
                stars = 1;
            }
        }

        // draw stars
        this.ctx.font = '40px "Press Start 2P", monospace';
        this.ctx.fillStyle = '#FFD700'; // gold color for stars
        let starsText = '';
        for (let i = 0; i < stars; i++) {
            starsText += '★'; // filled star character
        }
        for (let i = stars; i < 3; i++) {
            starsText += '☆'; // empty star character (optional, or just leave blank)
        }
        this.ctx.fillText(starsText, centerX, starY);
    }

    _drawAntFeatures(x, y, width, height) {
        // keep original method for non-shop displays
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        // draw legs
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