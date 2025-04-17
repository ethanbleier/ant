import { Component } from '../Component.js';

export class Health extends Component {
  constructor(maxHealth, currentHealth = null) {
    super();
    this.maxHealth = maxHealth;
    this.currentHealth = currentHealth === null ? maxHealth : currentHealth;
  }

  takeDamage(amount) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  isAlive() {
    return this.currentHealth > 0;
  }
} 