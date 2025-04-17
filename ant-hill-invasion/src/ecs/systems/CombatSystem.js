import { System } from '../System.js';
import { Position } from '../components/Position.js';
import { Defender } from '../components/Defender.js';
import { Enemy } from '../components/Enemy.js';
import { Health } from '../components/Health.js';
import { eventBus } from '../../core/EventBus.js';

export class CombatSystem extends System {
    constructor(entityManager) {
        super(entityManager);
    }

    update(deltaTime) {
        const defenders = this.entityManager.queryEntities(['Position', 'Defender']);
        const enemies = this.entityManager.queryEntities(['Position', 'Health', 'Enemy']);
        const enemiesMap = new Map(enemies.map(e => [e.id, e]));

        for (const defenderEntity of defenders) {
            const defender = defenderEntity.getComponent('Defender');
            const defenderPos = defenderEntity.getComponent('Position');

            // Update cooldown
            if (defender.attackCooldown > 0) {
                defender.attackCooldown -= deltaTime;
            }

            // --- Target Validation ---
            let currentTarget = null;
            if (defender.targetEntityId !== null) {
                currentTarget = enemiesMap.get(defender.targetEntityId);
                if (!this.isValidTarget(defender, defenderPos, currentTarget)) {
                    defender.targetEntityId = null; // Invalidate target
                    currentTarget = null;
                }
            }

            // --- Target Acquisition ---
            if (!currentTarget) {
                 defender.targetEntityId = this.findTarget(defender, defenderPos, enemies);
                 if (defender.targetEntityId !== null) {
                    currentTarget = enemiesMap.get(defender.targetEntityId);
                 }            
            }

            // --- Attacking ---
            if (currentTarget && defender.attackCooldown <= 0) {
                const targetHealth = currentTarget.getComponent('Health');
                
                targetHealth.takeDamage(defender.damage);
                console.log(`Defender ${defenderEntity.id} attacked Enemy ${currentTarget.id}. Health: ${targetHealth.currentHealth}`);

                // Reset cooldown (cooldown time = 1 / attacks_per_second)
                defender.attackCooldown = 1.0 / defender.attackSpeed;

                // Check if target died
                if (!targetHealth.isAlive()) {
                    console.log(`Enemy ${currentTarget.id} defeated!`);
                    const enemyComponent = currentTarget.getComponent('Enemy');
                    
                    // Publish event instead of accessing scene directly
                    eventBus.publish('addMoney', enemyComponent.reward);
                    
                    this.entityManager.destroyEntity(currentTarget.id);
                    enemiesMap.delete(currentTarget.id); // Remove from local map too
                    defender.targetEntityId = null; // Clear target
                }
            }
        }
    }

    isValidTarget(defender, defenderPos, targetEntity) {
        if (!targetEntity) return false;

        const targetHealth = targetEntity.getComponent('Health');
        if (!targetHealth || !targetHealth.isAlive()) return false;

        const targetPos = targetEntity.getComponent('Position');
        if (!targetPos) return false; 

        const dx = targetPos.x - defenderPos.x;
        const dy = targetPos.y - defenderPos.y;
        const distanceSq = dx * dx + dy * dy; // Use squared distance for efficiency

        return distanceSq <= defender.range * defender.range;
    }

    findTarget(defender, defenderPos, allEnemies) {
        let closestDistanceSq = defender.range * defender.range;
        let closestEnemyId = null;

        for (const enemyEntity of allEnemies) {
             // Skip if already checked via enemiesMap and destroyed
             if (!this.entityManager.entities.has(enemyEntity.id)) continue; 

            const enemyHealth = enemyEntity.getComponent('Health');
            if (!enemyHealth || !enemyHealth.isAlive()) continue;

            const enemyPos = enemyEntity.getComponent('Position');
            if (!enemyPos) continue;

            const dx = enemyPos.x - defenderPos.x;
            const dy = enemyPos.y - defenderPos.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= closestDistanceSq) {
                closestDistanceSq = distanceSq;
                closestEnemyId = enemyEntity.id;
            }
        }
        return closestEnemyId;
    }
} 