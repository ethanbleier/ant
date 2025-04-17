import { Component } from '../Component.js';

// Tag component to identify enemies, can hold enemy-specific data if needed.
export class Enemy extends Component {
  constructor(reward = 10, type = 'fireAnt') {
    super();
    this.reward = reward; // Money given when defeated
    this.type = type; // e.g., 'fireAnt', 'beetle'
  }
} 