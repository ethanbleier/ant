import { Component } from '../Component.js';

export class Velocity extends Component {
  constructor(dx = 0, dy = 0) {
    super();
    this.dx = dx;
    this.dy = dy;
  }
} 