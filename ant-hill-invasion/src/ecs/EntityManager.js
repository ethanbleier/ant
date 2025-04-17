import { Entity } from './Entity.js';

export class EntityManager {
  constructor() {
    this.entities = new Map();
    this.components = new Map(); // Map<ComponentName, Map<EntityId, Component>>
    this.entitiesByComponent = new Map(); // Map<ComponentName, Set<EntityId>>
  }

  createEntity() {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  destroyEntity(entityId) {
    if (!this.entities.has(entityId)) return;

    const entity = this.entities.get(entityId);
    for (const componentName of entity.components.keys()) {
      this._removeComponentFromIndexes(entityId, componentName);
    }

    this.entities.delete(entityId);
  }

  addComponent(entityId, component) {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    const componentName = component.constructor.name;
    entity.addComponent(component);

    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
      this.entitiesByComponent.set(componentName, new Set());
    }
    this.components.get(componentName).set(entityId, component);
    this.entitiesByComponent.get(componentName).add(entityId);
  }

  removeComponent(entityId, componentName) {
    const entity = this.entities.get(entityId);
    if (!entity || !entity.hasComponent(componentName)) return;

    entity.removeComponent(componentName);
    this._removeComponentFromIndexes(entityId, componentName);
  }

  _removeComponentFromIndexes(entityId, componentName) {
      if (this.components.has(componentName)) {
          this.components.get(componentName).delete(entityId);
      }
      if (this.entitiesByComponent.has(componentName)) {
          this.entitiesByComponent.get(componentName).delete(entityId);
          // Optional: Clean up empty sets/maps if needed
          // if (this.entitiesByComponent.get(componentName).size === 0) {
          //     this.entitiesByComponent.delete(componentName);
          //     this.components.delete(componentName);
          // }
      }
  }

  getComponent(entityId, componentName) {
    const entity = this.entities.get(entityId);
    return entity ? entity.getComponent(componentName) : undefined;
  }

  // Get all entities that have ALL the specified component names
  queryEntities(componentNames) {
    if (!componentNames || componentNames.length === 0) {
      return Array.from(this.entities.values());
    }

    // Find the component set with the fewest entities to start filtering
    let smallestSetSize = Infinity;
    let smallestSet = null;
    for (const name of componentNames) {
      const set = this.entitiesByComponent.get(name);
      if (!set) return []; // If any component type is missing, no entities match
      if (set.size < smallestSetSize) {
        smallestSetSize = set.size;
        smallestSet = set;
      }
    }

    if (!smallestSet) return [];

    const matchingEntities = [];
    for (const entityId of smallestSet) {
      const entity = this.entities.get(entityId);
      if (entity && entity.hasComponents(componentNames)) {
        matchingEntities.push(entity);
      }
    }
    return matchingEntities;
  }
} 