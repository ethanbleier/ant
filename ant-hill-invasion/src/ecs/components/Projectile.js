import { Component } from '../Component.js';

export class Projectile extends Component {
  constructor(startX, startY, targetEntityId, speed = 300, size = 6, color = '#FFFF00', lifespan = 0.5, trailLength = 5) {
    super();
    this.startX = startX;        // Starting X position
    this.startY = startY;        // Starting Y position
    this.targetEntityId = targetEntityId;  // Target entity ID to follow
    this.progress = 0;           // Animation progress (0 to 1)
    this.speed = speed;          // Speed in pixels per second
    this.size = size;            // Size of projectile
    this.color = color;          // Color of projectile
    this.lifespan = lifespan;    // Max lifetime in seconds
    this.completed = false;      // Whether animation is completed
    this.trailLength = trailLength;  // Length of trail (0 = no trail)
    this.trailPositions = [];    // Array to store trail positions
  }
} 