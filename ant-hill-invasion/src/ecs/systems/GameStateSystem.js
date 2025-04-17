import { System } from '../System.js';
import { Enemy } from '../components/Enemy.js';
import { PathFollower } from '../components/PathFollower.js';
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
        
        this.unsubscribeAddMoney = eventBus.subscribe('addMoney', (amount) => this.addMoney(amount));
        this.unsubscribeSpendMoney = eventBus.subscribe('spendMoney', (amount) => this.spendMoney(amount));
        this.unsubscribeCheckAffordable = eventBus.subscribe('checkAffordable', ({ amount, callback }) => { callback(this.canAfford(amount)); });
        this.unsubscribeGetMoney = eventBus.subscribe('getMoney', (callback) => { callback(this.money); });
        this.unsubscribeRequestInitial = eventBus.subscribe('requestInitialGameState', () => { this.initializeState(); });
        
        this.unsubscribeTogglePause = eventBus.subscribe('togglePause', () => this.togglePause());
        this.unsubscribeStartWave = eventBus.subscribe('startWaveRequested', () => this.startNextWave());
        this.unsubscribeGameOver = eventBus.subscribe('gameOver', () => { 
            if (!this.isPaused) this.togglePause(true);
        });
    }

    initializeState() {
        eventBus.publish('livesChanged', this.lives);
        eventBus.publish('moneyChanged', this.money);
        eventBus.publish('waveChanged', { wave: this.wave, maxWaves: this.maxWaves, inProgress: this.waveInProgress });
        eventBus.publish('pauseToggled', this.isPaused);
    }

    cleanup() {
        if (this.unsubscribeAddMoney) this.unsubscribeAddMoney();
        if (this.unsubscribeSpendMoney) this.unsubscribeSpendMoney();
        if (this.unsubscribeCheckAffordable) this.unsubscribeCheckAffordable();
        if (this.unsubscribeGetMoney) this.unsubscribeGetMoney();
        if (this.unsubscribeRequestInitial) this.unsubscribeRequestInitial();
        if (this.unsubscribeTogglePause) this.unsubscribeTogglePause();
        if (this.unsubscribeStartWave) this.unsubscribeStartWave();
        if (this.unsubscribeGameOver) this.unsubscribeGameOver();
        console.log("GameStateSystem listeners removed.");
    }

    togglePause(forceState = null) {
        if (this.gameOver && forceState !== false) return;
        
        this.isPaused = (forceState !== null) ? forceState : !this.isPaused;
        console.log(`GameStateSystem: Pause state set to ${this.isPaused}`);
        eventBus.publish('pauseToggled', this.isPaused);
    }

    addMoney(amount) {
        if (this.gameOver) return;
        this.money += amount;
        eventBus.publish('moneyChanged', this.money);
    }
    
    spendMoney(amount) {
        if (this.canAfford(amount)) {
            this.money -= amount;
            eventBus.publish('moneyChanged', this.money);
            return true;
        } 
        return false;
    }

    canAfford(amount) {
        return this.money >= amount;
    }

    startNextWave() {
        if (this.waveInProgress || this.gameOver || this.wave >= this.maxWaves) {
            console.log("Cannot start next wave. Conditions not met.");
            return;
        }
        
        this.wave++;
        const currentWaveIndex = this.wave - 1;
        const waveDefinition = this.levelData.waves[currentWaveIndex];

        if (!waveDefinition) {
            console.error(`Wave definition not found for wave ${this.wave}`);
            return;
        }

        console.log(`Starting Wave ${this.wave}/${this.maxWaves}`);
        this.waveInProgress = true;
        if (this.isPaused) {
            this.togglePause(false);
        }
        eventBus.publish('waveChanged', { wave: this.wave, maxWaves: this.maxWaves, inProgress: this.waveInProgress });
        
        let cumulativeDelay = 0;
        for (const enemyGroup of waveDefinition.enemies) {
            for (let i = 0; i < enemyGroup.count; i++) {
                const spawnTime = cumulativeDelay + i * enemyGroup.spawnDelayMs;
                setTimeout(() => {
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

        const endPixelX = pathEndGrid.col * this.cellSize + this.cellSize / 2;
        const endPixelY = pathEndGrid.row * this.cellSize + this.cellSize / 2;
        const endThreshold = this.cellSize * 0.5;

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
        
        if (this.wave >= this.maxWaves) {
            this.triggerGameWin();
        }
    }

    triggerGameOver() {
        console.log("GAME OVER!");
        this.gameOver = true;
        this.togglePause(true);
        eventBus.publish('gameOver');
    }

    triggerGameWin() {
        console.log("YOU WIN! All waves cleared.");
        this.gameOver = true;
        this.togglePause(true);
        eventBus.publish('gameWin');
    }
} 