import { System } from '../System.js';
import { Position, Renderable, Health, Enemy } from '../components/index.js';
import { getImage, defaultImage } from '../../core/resources.js'; // Import getImage and defaultImage

export class RenderSystem extends System {
  constructor(entityManager, context) {
    super(entityManager);
    this.context = context; // Canvas 2D context
  }

  update(deltaTime) {
    // Clear canvas (or relevant portion)
    // A clearRect call might be better placed in the main engine loop before system updates
    // this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);

    const entities = this.entityManager.queryEntities(['Position', 'Renderable']);

    // Sort entities by layer for correct draw order
    entities.sort((a, b) => {
      const renderableA = a.getComponent('Renderable');
      const renderableB = b.getComponent('Renderable');
      return renderableA.layer - renderableB.layer;
    });

    for (const entity of entities) {
      const position = entity.getComponent('Position');
      const renderable = entity.getComponent('Renderable');
      const health = entity.getComponent('Health'); // Try to get Health component
      const isEnemy = entity.hasComponent('Enemy'); // Check if it's an enemy
      
      // Center coordinates for drawing
      const drawX = position.x - renderable.width / 2;
      const drawY = position.y - renderable.height / 2;

      // Use the imported getImage function directly
      const image = renderable.spriteName ? getImage(renderable.spriteName) : null;

      this.context.globalAlpha = renderable.opacity;

      // Priority: 1. Loaded Sprite, 2. Fallback Color, 3. Default Image
      if (image && image !== defaultImage) {
        // Draw sprite if available and not the default fallback
        this.context.drawImage(
          image,
          drawX,
          drawY,
          renderable.width,
          renderable.height
        );
      } else if (renderable.color) {
        // Draw colored rectangle if sprite failed or wasn't specified, but color exists
        this.context.fillStyle = renderable.color;
        this.context.fillRect(
            drawX,
            drawY,
            renderable.width,
            renderable.height
        );
        // Optionally add border like in old free play render?
        // this.context.strokeStyle = '#000000';
        // this.context.lineWidth = 2;
        // this.context.strokeRect(drawX, drawY, renderable.width, renderable.height);
      } else {
        // Final fallback: Draw the default magenta checkerboard image
        if (defaultImage) { // Ensure defaultImage loaded itself
          this.context.drawImage(
            defaultImage,
            drawX,
            drawY,
            renderable.width, 
            renderable.height
          );
        } else {
          // Absolute fallback if even default image failed (unlikely)
          console.error("Default fallback image failed to load.");
          this.context.fillStyle = 'red'; 
          this.context.fillRect(drawX, drawY, renderable.width, renderable.height);
        }
      }
      
      this.context.globalAlpha = 1.0; // Reset alpha

      // --- Health Bar Drawing (for enemies) ---
      if (isEnemy && health) {
        const barWidth = renderable.width * 0.8; // Health bar slightly smaller than sprite
        const barHeight = 5;
        const barX = position.x - barWidth / 2; // Centered above the sprite
        const barY = drawY - barHeight - 2; // Position above the sprite with a small gap

        const healthPercentage = health.currentHealth / health.maxHealth;

        // Draw background (red)
        this.context.fillStyle = '#FF0000'; // Red for background/empty health
        this.context.fillRect(barX, barY, barWidth, barHeight);

        // Draw foreground (green)
        this.context.fillStyle = '#00FF00'; // Green for current health
        this.context.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

        // Optional: Add a border to the health bar
        this.context.strokeStyle = '#000000'; // Black border
        this.context.lineWidth = 1;
        this.context.strokeRect(barX, barY, barWidth, barHeight);
      }
      // --- End Health Bar Drawing ---
    }
  }
} 