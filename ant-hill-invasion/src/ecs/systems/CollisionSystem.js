import { System } from '../System.js';
import { Position } from '../components/Position.js';
import { Collider } from '../components/Collider.js';
import { CollidingWith } from '../components/CollidingWith.js';
import { PlayerControlled } from '../components/PlayerControlled.js';
import { Obstacle } from '../components/Obstacle.js';
import { Velocity } from '../components/Velocity.js'; // To potentially adjust velocity directly

export class CollisionSystem extends System {
    constructor(entityManager) {
        super(entityManager);
    }

    update(deltaTime) {
        const entities = this.entityManager.queryEntities(['Position', 'Collider']);
        
        // --- Step 1: Remove old collision components --- 
        // Important: Clear collision state from the previous frame first.
        const collidingEntities = this.entityManager.queryEntities(['CollidingWith']);
        for (const entity of collidingEntities) {
             // Note: Assumes only one collision component per entity for now
             this.entityManager.removeComponent(entity.id, 'CollidingWith');
        }

        // --- Step 2: Check for new collisions (simple N^2 AABB) --- 
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entityA = entities[i];
                const entityB = entities[j];

                const posA = entityA.getComponent('Position');
                const colA = entityA.getComponent('Collider');
                const posB = entityB.getComponent('Position');
                const colB = entityB.getComponent('Collider');

                if (this.checkAABB(posA, colA, posB, colB)) {
                    // console.log(`Collision detected between ${entityA.id} and ${entityB.id}`);
                    
                    // --- Step 3: Add Collision Components / Handle Response --- 
                    
                    // Example: Player vs Obstacle
                    const isPlayerA = entityA.hasComponent('PlayerControlled');
                    const isObstacleB = entityB.hasComponent('Obstacle');
                    const isPlayerB = entityB.hasComponent('PlayerControlled');
                    const isObstacleA = entityA.hasComponent('Obstacle');

                    // Calculate overlap (simple version)
                    const overlapX = (colA.width / 2 + colB.width / 2) - Math.abs(posA.x - posB.x);
                    const overlapY = (colA.height / 2 + colB.height / 2) - Math.abs(posA.y - posB.y);

                    if ((isPlayerA && isObstacleB) || (isPlayerB && isObstacleA)) {
                        console.log("Player collided with Obstacle!");
                        // Add component to player indicating collision with obstacle
                        if (isPlayerA) {
                           this.entityManager.addComponent(entityA.id, new CollidingWith(entityB.id, overlapX, overlapY));
                           // Optionally, stop player immediately (less decoupled)
                           // const velA = entityA.getComponent('Velocity');
                           // if (velA) {
                           //    if (overlapX < overlapY) velA.dx = 0; else velA.dy = 0; 
                           // }
                        } else { // Player is B
                           this.entityManager.addComponent(entityB.id, new CollidingWith(entityA.id, overlapX, overlapY));
                           // Optionally, stop player immediately
                           // const velB = entityB.getComponent('Velocity');
                           // if (velB) {
                           //     if (overlapX < overlapY) velB.dx = 0; else velB.dy = 0; 
                           // }
                        }
                    }
                    
                    // TODO: Add other collision pairs (Enemy vs Defender Projectile?)
                }
            }
        }
    }

    // Simple AABB check assuming positions are centers
    checkAABB(posA, colA, posB, colB) {
        const halfWidthA = colA.width / 2;
        const halfHeightA = colA.height / 2;
        const halfWidthB = colB.width / 2;
        const halfHeightB = colB.height / 2;

        const minXA = posA.x - halfWidthA + colA.offsetX;
        const maxXA = posA.x + halfWidthA + colA.offsetX;
        const minYA = posA.y - halfHeightA + colA.offsetY;
        const maxYA = posA.y + halfHeightA + colA.offsetY;

        const minXB = posB.x - halfWidthB + colB.offsetX;
        const maxXB = posB.x + halfWidthB + colB.offsetX;
        const minYB = posB.y - halfHeightB + colB.offsetY;
        const maxYB = posB.y + halfHeightB + colB.offsetY;

        return maxXA > minXB && minXA < maxXB && maxYA > minYB && minYA < maxYB;
    }
} 