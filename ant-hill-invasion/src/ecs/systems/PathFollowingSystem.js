import { System } from '../System.js';
import { Position } from '../components/Position.js';
import { Velocity } from '../components/Velocity.js';
import { PathFollower } from '../components/PathFollower.js';

export class PathFollowingSystem extends System {
  constructor(entityManager, levelData) {
    super(entityManager);
    if (!levelData) {
      throw new Error("PathFollowingSystem requires levelData.");
    }
    this.levelData = levelData;
    this.cellSize = levelData.grid.cellSize;
    this.gridPath = levelData.path;
  }

  getPixelCoords(gridPoint) {
    if (!gridPoint) return null;
    return {
      x: gridPoint.col * this.cellSize + this.cellSize / 2,
      y: gridPoint.row * this.cellSize + this.cellSize / 2
    };
  }

  update(deltaTime) {
    const entities = this.entityManager.queryEntities(['Position', 'Velocity', 'PathFollower']);

    if (!this.gridPath || this.gridPath.length < 2) {
      return;
    }

    for (const entity of entities) {
      const position = entity.getComponent('Position');
      const velocity = entity.getComponent('Velocity');
      const pathFollower = entity.getComponent('PathFollower');

      if (!this.gridPath || pathFollower.pathIndex >= this.gridPath.length - 1) {
        velocity.dx = 0;
        velocity.dy = 0;
        continue;
      }

      let targetPixelCoords;
      const nextPathIndex = pathFollower.pathIndex + 1;

      if (nextPathIndex === this.gridPath.length - 1 && this.levelData.anthillPos) {
        targetPixelCoords = {
          x: (this.levelData.anthillPos.col + 1.5) * this.cellSize,
          y: (this.levelData.anthillPos.row + 1.5) * this.cellSize
        };
      } else {
        const targetGridPoint = this.gridPath[nextPathIndex];
        targetPixelCoords = this.getPixelCoords(targetGridPoint);
      }

      if (!targetPixelCoords) {
        console.error(`Invalid target grid point at index ${nextPathIndex}`);
        velocity.dx = 0;
        velocity.dy = 0;
        continue;
      }

      const dx = targetPixelCoords.x - position.x;
      const dy = targetPixelCoords.y - position.y;
      const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

      const moveDistance = pathFollower.speed * deltaTime;

      if (distanceToTarget <= moveDistance) {
        position.x = targetPixelCoords.x;
        position.y = targetPixelCoords.y;
        pathFollower.pathIndex++;

        if (pathFollower.pathIndex >= this.gridPath.length - 1) {
          velocity.dx = 0;
          velocity.dy = 0;
        } else {
          let newTargetPixelCoords;
          const nextNextPathIndex = pathFollower.pathIndex + 1;

          if (nextNextPathIndex === this.gridPath.length - 1 && this.levelData.anthillPos) {
            newTargetPixelCoords = {
              x: (this.levelData.anthillPos.col + 1.5) * this.cellSize,
              y: (this.levelData.anthillPos.row + 1.5) * this.cellSize
            };
          } else {
            const newTargetGridPoint = this.gridPath[nextNextPathIndex];
            newTargetPixelCoords = this.getPixelCoords(newTargetGridPoint);
          }
          
          if (newTargetPixelCoords) {
            const nextDx = newTargetPixelCoords.x - position.x;
            const nextDy = newTargetPixelCoords.y - position.y;
            const nextDistance = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
            if (nextDistance > 0) {
              velocity.dx = (nextDx / nextDistance) * pathFollower.speed;
              velocity.dy = (nextDy / nextDistance) * pathFollower.speed;
            } else {
              velocity.dx = 0;
              velocity.dy = 0;
            }
          } else {
            velocity.dx = 0;
            velocity.dy = 0;
          }
        }
      } else {
        if (distanceToTarget > 0) {
          velocity.dx = (dx / distanceToTarget) * pathFollower.speed;
          velocity.dy = (dy / distanceToTarget) * pathFollower.speed;
        } else {
          velocity.dx = 0;
          velocity.dy = 0;
        }
      }
    }
  }
} 