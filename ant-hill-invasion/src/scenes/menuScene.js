import { setCurrentScene } from '../core/engine.js';
import { GameScene } from './gameScene.js';

export class MenuScene {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.buttons = [];
        
        // Animation properties
        this.titleBounce = 0;
        this.titleBounceDir = 1;
        this.titleVisible = true;
        
        // Bind methods to this
        this.onClick = this.onClick.bind(this);
    }

    /**
     * Initialize the menu scene
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Add event listeners
        canvas.addEventListener('click', this.onClick);
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        
        // Create buttons
        const buttonWidth = 240;
        const buttonHeight = 60;
        const buttonSpacing = 20;
        
        // Tower defense button
        this.buttons.push({
            x: (this.width - buttonWidth) / 2,
            y: this.height / 2 + 20,
            width: buttonWidth,
            height: buttonHeight,
            text: 'TOWER DEFENSE',
            action: 'tower-defense',
            hovered: false
        });
        
        // Free play button
        this.buttons.push({
            x: (this.width - buttonWidth) / 2,
            y: this.height / 2 + 20 + buttonHeight + buttonSpacing,
            width: buttonWidth,
            height: buttonHeight,
            text: 'FREE PLAY',
            action: 'free-play',
            hovered: false
        });
    }
    
    /**
     * Update menu scene (called each frame)
     */
    update() {
        // Update title animation
        this.titleBounce += 0.1 * this.titleBounceDir;
        if (this.titleBounce > 5 || this.titleBounce < 0) {
            this.titleBounceDir *= -1;
        }
        
        // Update button hover state
        const mouseX = this.mouseX || 0;
        const mouseY = this.mouseY || 0;
        
        for (const button of this.buttons) {
            button.hovered = mouseX >= button.x && 
                             mouseX <= button.x + button.width &&
                             mouseY >= button.y && 
                             mouseY <= button.y + button.height;
        }
    }
    
    /**
     * Render the menu scene
     * @param {CanvasRenderingContext2D} ctx - The canvas context
     */
    render(ctx) {
        // Background - dark pattern with grid lines
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid (8-bit style)
        ctx.strokeStyle = '#333333';
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
        
        // Draw title
        if (this.titleVisible) {
            ctx.font = 'bold 48px "Press Start 2P", monospace, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Shadow
            ctx.fillStyle = '#000000';
            ctx.fillText('ANT HILL INVASION', this.width / 2 + 4, this.height / 4 + this.titleBounce + 4);
            
            // Gradient for title
            const gradient = ctx.createLinearGradient(
                this.width / 2 - 200, 
                this.height / 4, 
                this.width / 2 + 200, 
                this.height / 4 + 48
            );
            gradient.addColorStop(0, '#FF0000');
            gradient.addColorStop(0.5, '#FFFF00');
            gradient.addColorStop(1, '#FF0000');
            
            ctx.fillStyle = gradient;
            ctx.fillText('ANT HILL INVASION', this.width / 2, this.height / 4 + this.titleBounce);
            
            // Add subtitle
            ctx.font = 'bold 20px "Press Start 2P", monospace, Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('DEFEND YOUR COLONY', this.width / 2, this.height / 4 + 60);
        }
        
        // Draw 8-bit ant icon
        this.drawPixelArt(ctx, this.width / 2 - 50, this.height / 2 - 100, 100, 100);
        
        // Draw buttons
        for (const button of this.buttons) {
            // Button background
            ctx.fillStyle = button.hovered ? '#AA0000' : '#880000';
            ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // Button border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            
            // Button inner border (8-bit style)
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x + 4, button.y + 4, button.width - 8, button.height - 8);
            
            // Button text
            ctx.font = 'bold 16px "Press Start 2P", monospace, Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
        }
        
        // Draw game version
        ctx.font = '10px "Press Start 2P", monospace, Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Ver 1.0.0', this.width - 10, this.height - 10);
    }
    
    /**
     * Draw a simple 8-bit ant icon
     */
    drawPixelArt(ctx, x, y, width, height) {
        const pixelSize = Math.min(width, height) / 16;
        
        // Define a simple 16x16 pixel art of an ant (1 for black pixels, 0 for empty)
        const pixelData = [
            [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
            [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
            [0,0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],
            [0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,1,1,1,1,0,1,0,0,0,0],
            [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
            [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
            [0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0],
            [1,1,0,0,0,1,1,1,1,1,1,0,0,0,1,1],
            [1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1],
            [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
            [0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0],
            [0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
            [0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
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
                }
            }
        }
    }
    
    /**
     * Handle mouse movement to track for hovering
     */
    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }
    
    /**
     * Handle click events
     */
    onClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Check button clicks
        for (const button of this.buttons) {
            if (mouseX >= button.x && 
                mouseX <= button.x + button.width &&
                mouseY >= button.y && 
                mouseY <= button.y + button.height) {
                
                if (button.action === 'tower-defense') {
                    this.startTowerDefenseGame();
                } else if (button.action === 'free-play') {
                    this.startFreePlayGame();
                }
            }
        }
    }
    
    /**
     * Handle window resize
     */
    onResize(width, height) {
        this.width = width;
        this.height = height;
        
        // Reposition buttons
        const buttonWidth = 240;
        const buttonHeight = 60;
        const buttonSpacing = 20;
        
        if (this.buttons.length >= 2) {
            this.buttons[0].x = (width - buttonWidth) / 2;
            this.buttons[0].y = height / 2 + 20;
            
            this.buttons[1].x = (width - buttonWidth) / 2;
            this.buttons[1].y = height / 2 + 20 + buttonHeight + buttonSpacing;
        }
    }

    /**
     * Start the tower defense game
     */
    startTowerDefenseGame() {
        const gameScene = new GameScene();
        gameScene.gameMode = 'tower-defense';
        setCurrentScene(gameScene);
    }
    
    /**
     * Start the free play game mode
     */
    startFreePlayGame() {
        const gameScene = new GameScene();
        gameScene.gameMode = 'free-play';
        setCurrentScene(gameScene);
    }

    /**
     * Clean up scene resources
     */
    cleanup() {
        // Remove event listeners
        this.canvas.removeEventListener('click', this.onClick);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
    }
}
