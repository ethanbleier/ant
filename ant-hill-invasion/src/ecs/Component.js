export class Component {
  // Base class for components - primarily data containers.
  // Specific components will extend this (or just be plain objects).
  constructor() {
    if (this.constructor === Component) {
      throw new Error("Cannot instantiate abstract class Component");
    }
  }
} 