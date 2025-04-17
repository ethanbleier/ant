let nextEntityId = 0;

export class Entity {
  constructor() {
    this.id = nextEntityId++;
    this.components = new Map();
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
  }

  removeComponent(componentName) {
    this.components.delete(componentName);
  }

  getComponent(componentName) {
    return this.components.get(componentName);
  }

  hasComponent(componentName) {
    return this.components.has(componentName);
  }

  hasComponents(componentNames) {
    return componentNames.every(name => this.hasComponent(name));
  }
} 