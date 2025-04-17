import { Component } from '../Component.js';

export class Collider extends Component {
  constructor(width, height, offsetX = 0, offsetY = 0, type = 'rect') {
    super();
    this.width = width;
    this.height = height;
    this.offsetX = offsetX; // Offset from the entity's position component
    this.offsetY = offsetY;
    this.type = type; // e.g., 'rect', 'circle' - for collision system
    // Potentially add properties like collision layer/mask later
  }
} 