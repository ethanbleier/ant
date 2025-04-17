import { System } from '../System.js';
import { Position } from '../components/Position.js';
import { Velocity } from '../components/Velocity.js';
import { PlayerControlled } from '../components/PlayerControlled.js';
import { CollidingWith } from '../components/CollidingWith.js';

export class MovementSystem extends System {
  constructor(entityManager) {
    super(entityManager);
  }

  update(deltaTime) {
    const entities = this.entityManager.queryEntities(['Position', 'Velocity']);

    for (const entity of entities) {
      const position = entity.getComponent('Position');
      const velocity = entity.getComponent('Velocity');
      
      const collision = entity.getComponent('CollidingWith');
      let adjustedDx = velocity.dx;
      let adjustedDy = velocity.dy;

      if (collision && entity.hasComponent('PlayerControlled')) {
          console.log(`Player ${entity.id} movement stopped due to collision with ${collision.otherEntityId}`);
          adjustedDx = 0;
          adjustedDy = 0;
      }
      
      position.x += adjustedDx * deltaTime;
      position.y += adjustedDy * deltaTime;
    }
  }
} 