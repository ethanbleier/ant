import { System } from '../System.js';
import { Velocity } from '../components/Velocity.js';
import { Position } from '../components/Position.js';
import { PlayerControlled } from '../components/PlayerControlled.js';
import { eventBus } from '../../core/EventBus.js';
// Assuming core input helper exists - we use event listeners mainly now
// import { isKeyDown } from '../../core/input.js'; 

const PLAYER_SPEED = 200; // Pixels per second for free play mode

export class InputSystem extends System {
    constructor(entityManager, scene, canvas) {
        super(entityManager);
        this.scene = scene;
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.draggingDefenderInfo = null; // Local state for dragging

        // Track key states for polling
        this.keysPressed = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // Bind event handlers
        this._handleMouseDown = this._onMouseDown.bind(this);
        this._handleMouseMove = this._onMouseMove.bind(this);
        this._handleMouseUp = this._onMouseUp.bind(this);
        this._handleKeyDown = this._onKeyDown.bind(this);
        this._handleKeyUp = this._onKeyUp.bind(this); // Added keyup handler

        // Need to listen for pause state changes to update internal logic if needed
        // (e.g., maybe disable certain inputs when paused)
        this.isPaused = false;
        this.unsubscribePause = eventBus.subscribe('pauseToggled', (pausedState) => {
            this.isPaused = pausedState;
        });

        this.attachListeners();
    }

    attachListeners() {
        this.canvas.addEventListener('mousedown', this._handleMouseDown);
        this.canvas.addEventListener('mousemove', this._handleMouseMove);
        this.canvas.addEventListener('mouseup', this._handleMouseUp);
        window.addEventListener('keydown', this._handleKeyDown);
        window.addEventListener('keyup', this._handleKeyUp); // Added keyup listener
    }

    cleanup() {
        this.canvas.removeEventListener('mousedown', this._handleMouseDown);
        this.canvas.removeEventListener('mousemove', this._handleMouseMove);
        this.canvas.removeEventListener('mouseup', this._handleMouseUp);
        window.removeEventListener('keydown', this._handleKeyDown);
        window.removeEventListener('keyup', this._handleKeyUp); // Remove keyup listener
        if(this.unsubscribePause) this.unsubscribePause(); // Unsubscribe from pause event
        console.log("InputSystem listeners removed.");
    }

    _getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _onMouseDown(event) {
        this.isMouseDown = true;
        const { x, y } = this._getMousePos(event);
        this.mouseX = x;
        this.mouseY = y;

        // Always check for pause button click first, regardless of pause state
        if (this._isPointInPauseButton(x, y)) {
            eventBus.publish('togglePause'); // Publish pause toggle request
            return; // Don't process other clicks if pause button was clicked
        }

        // Only process shop/start clicks if in tower-defense mode AND not paused
        if (this.scene.gameMode === 'tower-defense' && !this.isPaused) { 
             if (y > this.scene.height - this.scene.shopHeight) {
                 // Clicked in shop
                 const itemWidth = this.scene.width / this.scene.shopItems.length;
                 const itemIndex = Math.floor(x / itemWidth);
                
                 if (itemIndex >= 0 && itemIndex < this.scene.shopItems.length) {
                     const selectedShopItem = this.scene.shopItems[itemIndex];
                     // Check affordability via event
                     eventBus.publish('checkAffordable', {
                         amount: selectedShopItem.cost,
                         callback: (canAfford) => {
                             if (canAfford) {
                                 this.draggingDefenderInfo = selectedShopItem; // Start drag locally
                                 eventBus.publish('defenderDragStarted', this.draggingDefenderInfo);
                             } else {
                                 console.log("Cannot afford - Drag not started.");
                                 this.draggingDefenderInfo = null;
                             }
                         }
                     });
                 }
             } else {
                 // Clicked in game area (but not pause button, checked above)
                 if (this._isPointInStartButton(x, y)) { 
                     // Assume button is only shown when wave not in progress (handled by UISystem)
                     eventBus.publish('startWaveRequested'); // Publish start wave request
                 }
                 // Other potential game area clicks could go here (e.g., selecting a defender)
             }
        } 
        // No mouse down for free play currently
    }

    _onMouseMove(event) {
        const { x, y } = this._getMousePos(event);
        this.mouseX = x;
        this.mouseY = y;
        // Publish mouse move event for UI drag preview
        if (this.draggingDefenderInfo) {
             eventBus.publish('mouseMoved', { x, y });
        }
    }

    _onMouseUp(event) {
        this.isMouseDown = false;
        const { x, y } = this._getMousePos(event);
        this.mouseX = x;
        this.mouseY = y;

        if (this.draggingDefenderInfo) {
             // Publish place request if releasing in game area
             if (y < this.scene.height - this.scene.shopHeight) {
                 eventBus.publish('placeDefenderRequested', { 
                     typeData: this.draggingDefenderInfo, // Pass the shop item data
                     x: x, 
                     y: y 
                 });
             }
             // End drag regardless
             eventBus.publish('defenderDragEnded');
             this.draggingDefenderInfo = null;
        }
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
        } else if (this.scene.gameMode === 'free-play') {
             if (event.key === 'Escape') {
                 // TODO: Logic to return to menu scene?
                 console.log("Escape pressed in free play");
                 // Optionally publish an event to trigger menu transition
                 // eventBus.publish('requestReturnToMenu'); 
             }
        }
    }
    
    _onKeyUp(event) {
        // Track relevant key releases
        if (event.key in this.keysPressed) {
            this.keysPressed[event.key] = false;
            event.preventDefault();
        }
    }

    _isPointInPauseButton(x, y) {
        return x >= 10 && x <= 50 && y >= 10 && y <= 50;
    }
    
    _isPointInStartButton(x, y) {
        return x >= 60 && x <= 150 && y >= 10 && y <= 50;
    }

    update(deltaTime) {
        // Handle Free Play movement based on polled key states
        if (this.scene.gameMode === 'free-play' && !this.scene.isPaused) {
            const players = this.entityManager.queryEntities(['PlayerControlled', 'Velocity', 'Position']);
            if (players.length > 0) {
                const playerEntity = players[0]; // Assuming single player
                const velocity = playerEntity.getComponent('Velocity');
                const position = playerEntity.getComponent('Position');
                // Renderable needed for width/height in bounds check
                const renderable = playerEntity.getComponent('Renderable'); 
                
                let targetDx = 0;
                let targetDy = 0;

                if (this.keysPressed.ArrowUp) targetDy = -1;
                if (this.keysPressed.ArrowDown) targetDy = 1;
                if (this.keysPressed.ArrowLeft) targetDx = -1;
                if (this.keysPressed.ArrowRight) targetDx = 1;

                // Normalize diagonal movement
                if (targetDx !== 0 && targetDy !== 0) {
                    const length = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                    targetDx = (targetDx / length);
                    targetDy = (targetDy / length);
                }

                velocity.dx = targetDx * PLAYER_SPEED;
                velocity.dy = targetDy * PLAYER_SPEED;
                
                // Basic Bounds Checking (integrates with MovementSystem)
                // Predict next position slightly to prevent getting stuck at edge
                const nextX = position.x + velocity.dx * deltaTime;
                const nextY = position.y + velocity.dy * deltaTime;
                const halfWidth = renderable ? renderable.width / 2 : 0;
                const halfHeight = renderable ? renderable.height / 2 : 0;
                
                if (nextX - halfWidth < 0) velocity.dx = Math.max(0, velocity.dx);
                if (nextX + halfWidth > this.scene.width) velocity.dx = Math.min(0, velocity.dx);
                if (nextY - halfHeight < 0) velocity.dy = Math.max(0, velocity.dy);
                if (nextY + halfHeight > this.scene.height) velocity.dy = Math.min(0, velocity.dy);
            }
        }
    }
} 