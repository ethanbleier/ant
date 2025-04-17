import { Component } from '../Component.js';

export class PathFollower extends Component {
  constructor(path = [], startIndex = 0, speed = 1) {
    super();
    this.path = path; // Array of {x, y} points
    this.pathIndex = startIndex;
    this.speed = speed; // Movement speed along the path
  }
} 