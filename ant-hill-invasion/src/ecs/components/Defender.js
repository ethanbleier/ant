import { Component } from '../Component.js';

export class Defender extends Component {
  constructor(type, damage, range, attackSpeed, attackCooldown = 0, targetEntityId = null) {
    super();
    this.type = type;           // e.g., 'worker', 'soldier'
    this.damage = damage;       // Damage per attack
    this.range = range;         // Attack range in pixels
    this.attackSpeed = attackSpeed; // Attacks per second (or similar metric)
    this.attackCooldown = attackCooldown; // Frames/time until next attack
    this.targetEntityId = targetEntityId; // ID of the current target enemy entity
  }
} 