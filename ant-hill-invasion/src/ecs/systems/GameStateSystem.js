import { System } from '../System.js';
import { eventBus } from '../../core/EventBus.js';

export class GameStateSystem extends System {
    constructor(entityManager, levelData) {
        super(entityManager);
        
        if (!levelData) {
            throw new Error("GameStateSystem requires levelData to initialize.");
        }
        this.levelData = levelData;
        this.cellSize = levelData.grid.cellSize;

        this.gameOver = false;
        this.lives = levelData.initialResources.lives;
        this.money = levelData.initialResources.money;
        this.wave = 0;
        this.maxWaves = levelData.waves.length;
        this.waveInProgress = false;
        this.isPaused = false;
        this.gameSpeed = 1; // Game speed tracking (1=normal, 2=2x, 4=4x)
        this.isAutoSkipEnabled = false; // Auto-skip wave state
        this.autoSkipTimeout = null; // Timeout reference for auto-skip
        
        this.unsubscribeAddMoney = eventBus.subscribe('addMoney', (amount) => this.addMoney(amount));
        this.unsubscribeSpendMoney = eventBus.subscribe('spendMoney', (amount) => this.spendMoney(amount));
        this.unsubscribeCheckAffordable = eventBus.subscribe('checkAffordable', ({ amount, callback }) => { callback(this.canAfford(amount)); });
        this.unsubscribeGetMoney = eventBus.subscribe('getMoney', (callback) => { callback(this.money); });
        this.unsubscribeRequestInitial = eventBus.subscribe('requestInitialGameState', () => { this.initializeState(); });
        
        this.unsubscribeTogglePause = eventBus.subscribe('togglePause', () => this.togglePause());
        this.unsubscribeStartWave = eventBus.subscribe('startWaveRequested', () => this.startNextWave());
        this.unsubscribeGameOver = eventBus.subscribe('gameOver', () => { 
            if (!this.isPaused) this.togglePause(true);
            if (this.autoSkipTimeout) clearTimeout(this.autoSkipTimeout); // Clear auto-skip on game over
        });
        
        // Subscribe to speed change events
        this.unsubscribeSpeedChanged = eventBus.subscribe('speedChanged', (speedFactor) => this.changeSpeed(speedFactor));
        // Subscribe to auto-skip toggle requests
        this.unsubscribeToggleAutoSkip = eventBus.subscribe('toggleAutoSkipRequested', () => this.toggleAutoSkip());
    }

    initializeState() {
        eventBus.publish('livesChanged', this.lives);
        eventBus.publish('moneyChanged', this.money);
        eventBus.publish('waveChanged', { wave: this.wave, maxWaves: this.maxWaves, inProgress: this.waveInProgress });
        eventBus.publish('pauseToggled', this.isPaused);
        eventBus.publish('speedChanged', this.gameSpeed);
        eventBus.publish('autoSkipToggled', this.isAutoSkipEnabled); // Publish initial auto-skip state
    }

    cleanup() {
        if (this.autoSkipTimeout) clearTimeout(this.autoSkipTimeout); // Clear timeout on cleanup
        if (this.unsubscribeAddMoney) this.unsubscribeAddMoney();
        if (this.unsubscribeSpendMoney) this.unsubscribeSpendMoney();
        if (this.unsubscribeCheckAffordable) this.unsubscribeCheckAffordable();
        if (this.unsubscribeGetMoney) this.unsubscribeGetMoney();
        if (this.unsubscribeRequestInitial) this.unsubscribeRequestInitial();
        if (this.unsubscribeTogglePause) this.unsubscribeTogglePause();
        if (this.unsubscribeStartWave) this.unsubscribeStartWave();
        if (this.unsubscribeGameOver) this.unsubscribeGameOver();
        if (this.unsubscribeSpeedChanged) this.unsubscribeSpeedChanged();
        if (this.unsubscribeToggleAutoSkip) this.unsubscribeToggleAutoSkip(); // Cleanup auto-skip listener
        console.log("GameStateSystem listeners removed.");
    }

    togglePause(forceState = null) {
        if (this.gameOver && forceState !== false) return;
        
        const previousPauseState = this.isPaused;
        this.isPaused = (forceState !== null) ? forceState : !this.isPaused;

        // If pausing, clear any pending auto-skip
        if (this.isPaused && this.autoSkipTimeout) {
            clearTimeout(this.autoSkipTimeout);
            this.autoSkipTimeout = null;
        }
        // If unpausing AND auto-skip is enabled AND wave isn't running, potentially restart auto-skip countdown
        // This is handled more robustly in completeWave

        console.log(`GameStateSystem: Pause state set to ${this.isPaused}`);
        eventBus.publish('pauseToggled', this.isPaused);
    }
    
    changeSpeed(speedFactor) {
        // input validation
        if (speedFactor !== 1 && speedFactor !== 2 && speedFactor !== 4) {
            console.error(`Invalid speed factor: ${speedFactor}. Must be 1, 2, or 4.`);
            return;
        }
        
        this.gameSpeed = speedFactor;
        console.log(`GameStateSystem: Game speed set to ${this.gameSpeed}x`);
        eventBus.publish('speedChanged', this.gameSpeed);
    }

    addMoney(amount) {
        if (this.gameOver) return;
        
        // input val
        const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
        
        if (safeAmount > 0) {
            this.money += safeAmount;
            console.log(`Added ${safeAmount} money. New balance: ${this.money}`);
            eventBus.publish('moneyChanged', this.money);
            // publish if earned during a wave
            if (this.waveInProgress) {
                eventBus.publish('moneyEarnedDuringWave', { amount: safeAmount });
            }
        }
    }
    
    spendMoney(amount) {
        // input val
        const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
        
        if (safeAmount === 0) return true; // Nothing to spend
        
        if (this.canAfford(safeAmount)) {
            this.money -= safeAmount;
            console.log(`Spent ${safeAmount} money. New balance: ${this.money}`);
            eventBus.publish('moneyChanged', this.money);
            return true;
        } 
        return false;
    }

    canAfford(amount) {
        // input val
        const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
        return this.money >= safeAmount;
    }

    startNextWave() {
        if (this.waveInProgress || this.gameOver || this.wave >= this.maxWaves) {
            console.log("Cannot start next wave. Conditions not met.");
            return;
        }

        // clear any pending auto-skip timeout before starting the next wave manually or automatically
        if (this.autoSkipTimeout) {
            clearTimeout(this.autoSkipTimeout);
            this.autoSkipTimeout = null;
        }

        this.wave++;
        const currentWaveIndex = this.wave - 1;
        const waveDefinition = this.levelData.waves[currentWaveIndex];

        if (!waveDefinition) {
            console.error(`Wave definition not found for wave ${this.wave}`);
            this.wave--; // revert wave increment if definition is missing
            return;
        }

        console.log(`Starting Wave ${this.wave}/${this.maxWaves}`);

        // --- state setting ---
        const needsUnpause = this.isPaused;
        this.waveInProgress = true;
        this.isPaused = false; // explicitly set to false *before* publishing events

        // publish wave state *first*
        eventBus.publish('waveChanged', { wave: this.wave, maxWaves: this.maxWaves, inProgress: this.waveInProgress });

        // publish pause state *only if it actually changed*
        if (needsUnpause) {
            eventBus.publish('pauseToggled', this.isPaused);
        }
        // --- end state setting ---

        let cumulativeDelay = 0;
        for (const enemyGroup of waveDefinition.enemies) {
            for (let i = 0; i < enemyGroup.count; i++) {
                // apply game speed to spawn timing
                const spawnTime = (cumulativeDelay + i * enemyGroup.spawnDelayMs) / this.gameSpeed;
                setTimeout(() => {
                     // check pause/gameover state *inside* the timeout callback
                     if (!this.isPaused && !this.gameOver) {
                        console.log(`Spawning ${enemyGroup.type} at time ${spawnTime}`);
                        eventBus.publish('spawnSingleEnemy', {
                            type: enemyGroup.type,
                        });
                     }
                }, spawnTime);
            }
            cumulativeDelay += enemyGroup.count * enemyGroup.spawnDelayMs;
        }
    }

    update(deltaTime) {
        if (this.gameOver || this.isPaused) return;

        const enemies = this.entityManager.queryEntities(['Enemy', 'Position']);
        const pathEndGrid = this.levelData.path[this.levelData.path.length - 1];

        if (!pathEndGrid) return;

        // calculate end pixel position
        const endPixelX = pathEndGrid.col * this.cellSize + this.cellSize / 2;
        const endPixelY = pathEndGrid.row * this.cellSize + this.cellSize / 2;
        const endThreshold = this.cellSize * 0.5;

        // check if any enemies have reached the end
        for (const entity of enemies) {
            const position = entity.getComponent('Position');
            
            const dx = position.x - endPixelX;
            const dy = position.y - endPixelY;
            const distanceToEnd = Math.sqrt(dx * dx + dy * dy);

            if (distanceToEnd < endThreshold) { 
                const enemyComp = entity.getComponent('Enemy');
                console.log(`Enemy ${entity.id} (type: ${enemyComp ? enemyComp.type : 'unknown'}) reached the end!`);
                
                this.lives--;
                eventBus.publish('livesChanged', this.lives);
                this.entityManager.destroyEntity(entity.id);

                console.log(`Lives remaining: ${this.lives}`);
                if (this.lives <= 0) {
                    this.triggerGameOver();
                    return; 
                }
            }
        }

        // check if all enemies have been defeated
        if (this.waveInProgress) {
            const remainingEnemies = this.entityManager.queryEntities(['Enemy']);
            if (remainingEnemies.length === 0) {
                this.completeWave();
            }
        }
    }

    completeWave() {
        console.log(`Wave ${this.wave} complete!`);
        this.waveInProgress = false;
        eventBus.publish('waveChanged', { wave: this.wave, maxWaves: this.maxWaves, inProgress: this.waveInProgress });
        
        // make sure wave completion bonus only comes AFTER wave 1
        if (this.wave > 1) {
            const waveBonus = 65;
            this.addMoney(waveBonus);
            console.log(`Wave ${this.wave} completion bonus: $${waveBonus}`);
        }
        
        if (this.wave >= this.maxWaves) {
            this.triggerGameWin();
        } else if (this.isAutoSkipEnabled && !this.gameOver) {
            // if auto-skip is on and game isn't over, schedule the next wave
            const autoStartDelay = 1500 / this.gameSpeed; // delay in ms so 1.5 seconds
            console.log(`Auto-starting next wave in ${autoStartDelay}ms...`);
            this.autoSkipTimeout = setTimeout(() => {
                if (!this.isPaused && !this.gameOver) { // double check state before starting
                    this.startNextWave();
                }
                this.autoSkipTimeout = null; // clear ref after execution
            }, autoStartDelay);
        }
    }

    triggerGameOver() {
        console.log("GAME OVER!");
        this.gameOver = true;
        this.togglePause(true);
        if (this.autoSkipTimeout) clearTimeout(this.autoSkipTimeout); // check if timeout cleared on game over
        eventBus.publish('gameOver');
    }

    triggerGameWin() {
        console.log("YOU WIN! All waves cleared.");
        this.gameOver = true;
        this.togglePause(true);
        if (this.autoSkipTimeout) clearTimeout(this.autoSkipTimeout); // check if timeout cleared on game win
        eventBus.publish('gameWin', { finalLives: this.lives });
    }

    toggleAutoSkip() {
        if (this.gameOver) return; // disallows toggling after game over

        this.isAutoSkipEnabled = !this.isAutoSkipEnabled;
        console.log(`GameStateSystem: Auto-skip waves set to ${this.isAutoSkipEnabled}`);
        eventBus.publish('autoSkipToggled', this.isAutoSkipEnabled);

        // if auto-skip was just enabled and the current wave is complete, immediately trigger the next wave
        if (this.isAutoSkipEnabled && !this.waveInProgress && this.wave < this.maxWaves) {
            this.startNextWave();
        }
        // if auto-skip was disabled while waiting, clear the timeout
        if (!this.isAutoSkipEnabled && this.autoSkipTimeout) {
            clearTimeout(this.autoSkipTimeout);
            this.autoSkipTimeout = null;
        }
    }
} 