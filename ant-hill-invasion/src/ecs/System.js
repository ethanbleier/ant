export class System {
  // Base class for systems - contain logic that operates on entities.
  constructor(entityManager) {
    if (this.constructor === System) {
      throw new Error("Cannot instantiate abstract class System");
    }
    this.entityManager = entityManager; // Expects an object to manage entities
  }

  // Systems should implement an update method
  update(deltaTime) {
    throw new Error("System must implement an update method");
  }
} 