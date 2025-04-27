import { t, loadLanguage } from '../core/localization/localizationManager.js';
import { TEXT_KEYS } from '../core/localization/TEXT_KEYS.js'; //consistency for languages 

export class SettingsScene {
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

    initialize(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // Add event listeners
        canvas.addEventListener('click', this.onClick);
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Create small buttons
        const smallButtonWidth = 120;
        const smallButtonHeight = 60;
        const smallButtonSpacing = 20;

        // Create buttons
        const buttonWidth = 240;
        const buttonHeight = 60;
        const buttonSpacing = 20;

        // english
        this.buttons.push({
            x: (this.width - smallButtonWidth) / 2,
            y: this.height / 2 + 50,
            width: smallButtonWidth,
            height: smallButtonHeight,
            text: "EN",
            action: 'en',
            hovered: false
        });
        //spanish button
        this.buttons.push({
            x: this.buttons[0].x + smallButtonWidth,
            y: (this.height / 2 + 50),
            width: smallButtonWidth,
            height: smallButtonHeight,
            text: "ES",
            action: 'es',
        });
        //idk button
        this.buttons.push({
            x: this.buttons[0].x + (smallButtonWidth * 2),
            y: (this.height / 2 + 50),
            width: smallButtonWidth,
            height: smallButtonHeight,
            text: "IDK",
            action: 'idk',
            hovered: false
        });
        //accessiblity 2
        this.buttons.push({
            x: (this.width - buttonWidth) / 2,
            y: (this.height / 2 + 50) + buttonSpacing + buttonHeight,
            width: buttonWidth,
            height: buttonHeight,
            text: t(TEXT_KEYS.SAVE_GAME),
            action: 'accessibilty2',
            hovered: false
        });
        //accessiblity 3
        this.buttons.push({
            x: (this.width - buttonWidth) / 2,
            y: (this.height / 2 + 50) + buttonSpacing + buttonHeight,
            width: buttonWidth,
            height: buttonHeight,
            text: t(TEXT_KEYS.SAVE_GAME),
            action: 'accessibilty3',
            hovered: false
        });
        //save button
        this.buttons.push({
            x: (this.width - buttonWidth) / 2,
            //should be at bottom adjacent to exit
            y: (this.height / 2 + 50) + buttonSpacing + buttonHeight,
            width: buttonWidth,
            height: buttonHeight,
            text: t(TEXT_KEYS.SAVE_GAME),
            action: 'save',
            hovered: false
        });
        //exit button
        this.buttons.push({
            x: ((this.width - buttonWidth) / 2) +buttonSpacing+ buttonWidth ,
            //should be at bottom adjacent to save
            y: (this.height / 2 + 50) + buttonSpacing + buttonHeight,
            width: buttonWidth,
            height: buttonHeight,
            text: t(TEXT_KEYS.EXIT_MENU),
            action: 'exit',
            hovered: false
        });

    }

    update() {
        this.titleBounce += 0.1 * this.titleBounceDir;
        if (this.titleBounce > 5 || this.titleBounce < 0) {
            this.titleBounceDir *= -1;
        }

        const mouseX = this.mouseX || 0;
        const mouseY = this.mouseY || 0;

        for (const button of this.buttons) {
            button.hovered = mouseX >= button.x &&
                mouseX <= button.x + button.width &&
                mouseY >= button.y &&
                mouseY <= button.y + button.height;
        }
    }

    render(ctx) {
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;

        for (let x = 0; x < this.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = 0; y < this.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        if (this.titleVisible) {
            ctx.font = 'bold 48px "Press Start 2P", monospace, Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = '#000000';
            ctx.fillText(t(TEXT_KEYS.SETTINGS), this.width / 2 + 4, this.height / 4 + this.titleBounce + 4);

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
            ctx.fillText(t(TEXT_KEYS.SETTINGS), this.width / 2, this.height / 4 + this.titleBounce);

            ctx.font = 'bold 20px "Press Start 2P", monospace, Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(t(TEXT_KEYS.SETTINGS_SUBTITLE), this.width / 2, this.height / 4 + 60);
        }

        this.drawPixelArt(ctx, this.width / 2 - 50, this.height / 2 - 100, 100, 100);

        for (const button of this.buttons) {
            ctx.fillStyle = button.hovered ? '#AA0000' : '#880000';
            ctx.fillRect(button.x, button.y, button.width, button.height);

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.strokeRect(button.x, button.y, button.width, button.height);

            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x + 4, button.y + 4, button.width - 8, button.height - 8);

            ctx.font = 'bold 16px "Press Start 2P", monospace, Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2);
        }

        ctx.font = '10px "Press Start 2P", monospace, Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Ver 1.0.0', this.width - 10, this.height - 10);
    }

    onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
    }

    onClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        for (const button of this.buttons) {
            if (mouseX >= button.x &&
                mouseX <= button.x + button.width &&
                mouseY >= button.y &&
                mouseY <= button.y + button.height) {

                if (button.action === 'tower-defense') {
                    this.startTowerDefenseGame();
                }
                if (button.action === 'settings') {
                    this.openSettingsPage();
                }
            }
        }
    }

    onResize(width, height) {
        this.width = width;
        this.height = height;

        const buttonWidth = 240;
        const buttonHeight = 60;
        const buttonSpacing = 20;

        if (this.buttons.length >= 1) {
            this.buttons[0].x = (width - buttonWidth) / 2;
            this.buttons[0].y = height / 2 + 50;
        }
    }


    drawPixelArt(ctx, x, y, width, height) {
        const pixelSize = Math.min(width, height) / 16;

        const pixelData = [
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
            [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

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

                switch (button.action) {
                    case 'en':
                        //call localizationManager and change language to english
                        console.log("Hi");
                        break;
                    case 'es':
                        //call localizationManager and change language to english
                        console.log("Hola");
                        break;
                    case 'idk':
                        //call localizationManager and change language to english
                        console.log("kjrbpiureUER");
                        break;
                    case 'save':
                        //do back end stuff to save player settings
                        console.log("SAVING...");
                        break;
                    case 'exit':
                        console.log("Bye Bye");
                        //leave to menuScene w/ saving
                        break;
                    default:
                        // optional: handle unknown actions
                        break;
                }
            }
        }
    }
}
