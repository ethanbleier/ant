import { System } from '../System.js';
import { eventBus } from '../../core/EventBus.js';

const PLAYER_SPEED = 200; // pixels per second for free play mode

export class InputSystem extends System {
    constructor(entityManager, scene, canvas) {
        super(entityManager);
        this.scene = scene;
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.draggingDefender = null; // Information about the defender being dragged
        
        // Handle all input events
        canvas.addEventListener('click', this.handleClick.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Track key states for polling
        this.keysPressed = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // Bind event handlers
        this._handleKeyDown = this._onKeyDown.bind(this);
        this._handleKeyUp = this._onKeyUp.bind(this); // Added keyup handler

        // Track relevant game state locally
        this.isPaused = false;
        this.isWaveInProgress = false;

        this.unsubscribePause = eventBus.subscribe('pauseToggled', (pausedState) => {
            this.isPaused = pausedState;
        });
        this.unsubscribeWave = eventBus.subscribe('waveChanged', (waveData) => {
            this.isWaveInProgress = waveData.inProgress;
        });

        this.attachListeners();
    }

    attachListeners() {
        window.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('keyup', this._handleKeyUp); // Added keyup listener
    }

    cleanup() {
        // Remove event listeners
        this.canvas.removeEventListener('click', this.handleClick.bind(this));
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        if(this.unsubscribePause) this.unsubscribePause(); // Unsubscribe from pause event
        if(this.unsubscribeWave) this.unsubscribeWave();   // Unsubscribe from wave event
        console.log("InputSystem listeners removed.");
    }

    _getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    handleClick(event) {
        // Get mouse position relative to the canvas
        const rect = this.canvas.getBoundingClientRect();
        
        // Fix the scaling calculation to be more precise
        // Ensure pixel-perfect scaling based on DPI and canvas dimensions
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Apply scaling with proper rounding to prevent floating point errors
        const x = Math.round((event.clientX - rect.left) * scaleX);
        const y = Math.round((event.clientY - rect.top) * scaleY);

        // --- Button layout constants (should match UISystem ideally, or be derived) ---
        const buttonSize = 40;
        const buttonPadding = 15; // Padding between left buttons
        const playPauseButtonX = 10;
        const autoSkipButtonX = playPauseButtonX + buttonSize + buttonPadding;
        const topBarY = 10;

        // 1. Check Combined Play/Pause/Start Button
        if (x >= playPauseButtonX && x <= playPauseButtonX + buttonSize &&
            y >= topBarY && y <= topBarY + buttonSize) {
            if (!this.isWaveInProgress) {
                console.log("Input: Start Wave Requested");
                eventBus.publish('startWaveRequested');
            } else {
                console.log("Input: Toggle Pause Requested");
                eventBus.publish('togglePause');
            }
            return; // Click handled
        }

        // 2. Check Auto-Skip Button
        if (x >= autoSkipButtonX && x <= autoSkipButtonX + buttonSize &&
            y >= topBarY && y <= topBarY + buttonSize) {
            console.log("Input: Toggle Auto-Skip Requested");
            eventBus.publish('toggleAutoSkipRequested');
            return; // Click handled
        }

        // --- Dynamic Speed Button Click Detection ---
        const speedButtonWidth = 40;
        // NOTE: Speed padding might differ from left button padding
        const speedButtonPadding = 10; 
        const speedControlsStartX = this.canvas.width - (3 * speedButtonWidth + 2 * speedButtonPadding);

        // Define button areas dynamically (relative to speedControlsStartX)
        const button1x_EndX = speedControlsStartX + speedButtonWidth;
        const button2x_StartX = button1x_EndX + speedButtonPadding;
        const button2x_EndX = button2x_StartX + speedButtonWidth;
        const button4x_StartX = button2x_EndX + speedButtonPadding;
        const button4x_EndX = button4x_StartX + speedButtonWidth;

        if (y >= topBarY && y <= topBarY + buttonSize) { // Y check remains the same (top bar)
            // 1x speed button
            if (x >= speedControlsStartX && x < button1x_EndX) {
                eventBus.publish('speedChanged', 1);
                return;
            }
            // 2x speed button
            if (x >= button2x_StartX && x < button2x_EndX) {
                eventBus.publish('speedChanged', 2);
                return;
            }
            // 4x speed button
            if (x >= button4x_StartX && x < button4x_EndX) {
                eventBus.publish('speedChanged', 4);
                return;
            }
        }
        // --- End Dynamic Speed Button Click Detection ---

        // Check if clicking in the shop area
        const shopHeight = this.scene.shopHeight;
        if (y >= this.canvas.height - shopHeight) {
            this.handleShopClick(x, y);
            return;
        }

        // If dragging a defender, attempt to place it
        if (this.draggingDefender) {
            eventBus.publish('placeDefenderRequested', {
                x: x,
                y: y,
                typeData: this.draggingDefender
            });
            this.draggingDefender = null;
            eventBus.publish('defenderDragEnded');
        }
    }

    handleShopClick(x, y) {
        // Get shop layout details from the scene/UISystem drawing logic
        const shopItems = this.scene.shopItems;
        const shopHeight = this.scene.shopHeight;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // --- Replicate layout logic from UISystem._drawShop ---
        const historyWidth = Math.floor(width * 0.22); // Match UISystem calculation
        const shopMainWidth = width - historyWidth;    // Match UISystem calculation
        const padding = 8; // Match UISystem padding
        const itemCount = shopItems.length;
        const itemsPerRow = Math.min(itemCount, 5); // Match UISystem row limit
        const rows = Math.ceil(itemCount / itemsPerRow);
        const itemWidth = Math.floor((shopMainWidth - (padding * (itemsPerRow + 1))) / itemsPerRow);
        const itemHeight = Math.floor((shopHeight - 35) / rows); // Match UISystem height calculation (30px top offset + 5px title/separator)
        // --- End layout replication ---

        // Find the clicked item by checking bounds
        for (let i = 0; i < itemCount; i++) {
            const item = shopItems[i];
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;

            // Calculate item's top-left corner coordinates (matching UISystem._drawShop)
            const itemX = padding + col * (itemWidth + padding);
            const itemY = height - shopHeight + 30 + row * (itemHeight + padding);

            // Check if the click coordinates (x, y) fall within this item's bounds
            if (x >= itemX && x <= itemX + itemWidth &&
                y >= itemY && y <= itemY + itemHeight) 
            {
                const selectedItem = shopItems[i];
                // Check if affordable before starting drag (optional, but good UX)
                eventBus.publish('checkAffordable', { 
                    amount: selectedItem.cost, 
                    callback: (canAfford) => {
                        if (canAfford) {
                            this.draggingDefender = selectedItem;
                            console.log(`Input: Started dragging ${selectedItem.type}`);
                            eventBus.publish('defenderDragStarted', selectedItem);
                        } else {
                            console.log(`Input: Cannot afford ${selectedItem.type}, cost: ${selectedItem.cost}`);
                            // Optionally provide visual feedback for unaffordable click
                        }
                    }
                });
                return; // Exit loop once item is found and processed
            }
        }
        
        // If no item was matched (e.g., clicked padding), do nothing
        console.log("Input: Clicked in shop area, but missed an item.");
    }

    handleMouseMove(event) {
        // Update mouse position with the same precision as handleClick
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Apply same rounding to ensure consistent coordinates with click handling
        this.mouseX = Math.round((event.clientX - rect.left) * scaleX);
        this.mouseY = Math.round((event.clientY - rect.top) * scaleY);
        
        // Publish mouse position for other systems
        eventBus.publish('mouseMoved', { x: this.mouseX, y: this.mouseY });
    }

    _onKeyDown(event) {
        // Track relevant key presses
        if (event.key in this.keysPressed) {
            this.keysPressed[event.key] = true;
            event.preventDefault(); // Prevent arrow keys from scrolling page
        }

        // Handle non-movement keys (like pause)
        if (this.scene.gameMode === 'tower-defense') {
            // Use 'p' or 'Escape' to toggle pause via event bus
            if (event.key.toLowerCase() === 'p' || event.key === 'Escape') { 
                event.preventDefault(); // Prevent potential browser shortcuts
                eventBus.publish('togglePause');
            }
        }
    }
    
    _onKeyUp(event) {
        if (event.key in this.keysPressed) {
            this.keysPressed[event.key] = false;
            event.preventDefault();
        }
    }

    update(deltaTime) {
        // we removed free play mode
    }
} 