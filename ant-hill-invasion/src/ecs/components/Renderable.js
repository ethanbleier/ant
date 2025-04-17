import { Component } from '../Component.js';

export class Renderable extends Component {
  constructor(spriteName, width, height, layer = 0, opacity = 1, color = null) {
    super();
    this.spriteName = spriteName; // Name to look up in resource manager
    this.width = width;
    this.height = height;
    this.layer = layer; // For render order (e.g., background, objects, UI)
    this.opacity = opacity;
    this.color = color; // Added: Fallback color if sprite is null/missing
  }
} 