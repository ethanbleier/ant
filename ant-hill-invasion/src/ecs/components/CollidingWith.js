import { Component } from '../Component.js';

// Transient component added when a collision occurs in a frame.
// It indicates which entity was collided with.
export class CollidingWith extends Component {
  constructor(otherEntityId, overlapX = 0, overlapY = 0) {
    super();
    this.otherEntityId = otherEntityId; // ID of the entity collided with
    this.overlapX = overlapX; // How much overlap on X axis
    this.overlapY = overlapY; // How much overlap on Y axis
    // Could add collision normal, etc. later
  }
} 