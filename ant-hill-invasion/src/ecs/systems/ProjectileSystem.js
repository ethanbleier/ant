import { System } from '../System.js';
import { Position } from '../components/Position.js';
import { Projectile } from '../components/Projectile.js';
import { Renderable } from '../components/Renderable.js';

export class ProjectileSystem extends System {
    constructor(entityManager, context) {
        super(entityManager);
        this.context = context;
        this.impactEffects = [];  // Store active impact effects
    }

    update(deltaTime) {
        const projectileEntities = this.entityManager.queryEntities(['Projectile', 'Position', 'Renderable']);

        // Update impact effects
        this.updateImpactEffects(deltaTime);

        for (const projectileEntity of projectileEntities) {
            const projectile = projectileEntity.getComponent('Projectile');
            const position = projectileEntity.getComponent('Position');
            const renderable = projectileEntity.getComponent('Renderable');

            // If animation is already completed, create impact effect and destroy the entity
            if (projectile.completed) {
                if (projectile.progress >= 1.0) { // Only create impact if it reached the target
                    this.createImpactEffect(position.x, position.y, renderable.color);
                }
                this.entityManager.destroyEntity(projectileEntity.id);
                continue;
            }

            // Get target position
            const targetEntity = this.entityManager.entities.get(projectile.targetEntityId);
            
            // If target no longer exists, complete animation and mark for removal
            if (!targetEntity) {
                projectile.completed = true;
                continue;
            }

            const targetPos = targetEntity.getComponent('Position');
            if (!targetPos) {
                projectile.completed = true;
                continue;
            }

            // Store previous position for trail
            if (projectile.trailLength > 0) {
                projectile.trailPositions.unshift({
                    x: position.x,
                    y: position.y,
                    size: renderable.width,
                    opacity: renderable.opacity
                });
                
                // Limit trail length
                if (projectile.trailPositions.length > projectile.trailLength) {
                    projectile.trailPositions.pop();
                }
            }

            // Update progress based on speed
            projectile.progress += (deltaTime * projectile.speed) / this.calculateDistance(
                projectile.startX, projectile.startY, targetPos.x, targetPos.y
            );

            // Update position based on linear interpolation
            position.x = this.lerp(projectile.startX, targetPos.x, projectile.progress);
            position.y = this.lerp(projectile.startY, targetPos.y, projectile.progress);

            // Update size and opacity for diminishing effect
            const sizeScale = 1 - projectile.progress * 0.5; // Shrink to 50% of original size
            renderable.width = projectile.size * sizeScale;
            renderable.height = projectile.size * sizeScale;
            renderable.opacity = 1 - projectile.progress; // Fade out

            // Draw trail
            this.drawTrail(projectile, projectile.color);

            // Check if projectile reached the target or exceeded lifespan
            if (projectile.progress >= 1.0) {
                projectile.completed = true;
            }
        }
    }

    createImpactEffect(x, y, color) {
        this.impactEffects.push({
            x: x,
            y: y,
            color: color,
            radius: 8,             // Starting radius
            maxRadius: 15,         // Maximum radius
            duration: 0.3,         // Duration in seconds
            timeRemaining: 0.3,    // Time remaining
            opacity: 1.0           // Starting opacity
        });
    }

    updateImpactEffects(deltaTime) {
        for (let i = this.impactEffects.length - 1; i >= 0; i--) {
            const effect = this.impactEffects[i];
            effect.timeRemaining -= deltaTime;
            
            if (effect.timeRemaining <= 0) {
                this.impactEffects.splice(i, 1);
                continue;
            }
            
            // Calculate progress (0 to 1)
            const progress = 1 - (effect.timeRemaining / effect.duration);
            
            // Calculate current radius and opacity
            effect.radius = this.lerp(0, effect.maxRadius, progress);
            effect.opacity = 1 - progress;
            
            // Draw the impact effect
            this.context.save();
            this.context.globalAlpha = effect.opacity;
            
            // Draw outer circle (glow)
            const gradient = this.context.createRadialGradient(
                effect.x, effect.y, effect.radius * 0.5,
                effect.x, effect.y, effect.radius
            );
            gradient.addColorStop(0, effect.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.context.fillStyle = gradient;
            this.context.beginPath();
            this.context.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            this.context.fill();
            
            // Draw inner circle
            this.context.fillStyle = 'rgba(255, 255, 255, ' + effect.opacity + ')';
            this.context.beginPath();
            this.context.arc(effect.x, effect.y, effect.radius * 0.3, 0, Math.PI * 2);
            this.context.fill();
            
            this.context.restore();
        }
    }

    drawTrail(projectile, color) {
        if (projectile.trailPositions.length <= 1) return;

        // Draw trail line or particles
        for (let i = 0; i < projectile.trailPositions.length; i++) {
            const pos = projectile.trailPositions[i];
            const fadeRatio = 1 - (i / projectile.trailPositions.length);
            
            this.context.save();
            this.context.globalAlpha = pos.opacity * fadeRatio * 0.7;
            this.context.fillStyle = color;
            
            // Draw circle
            this.context.beginPath();
            const radius = (pos.size / 2) * fadeRatio;
            this.context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.context.fill();
            
            this.context.restore();
        }
    }

    lerp(start, end, t) {
        // Linear interpolation
        return start + (end - start) * Math.min(1.0, Math.max(0.0, t));
    }

    calculateDistance(x1, y1, x2, y2) {
        // Calculate the distance between two points
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
} 