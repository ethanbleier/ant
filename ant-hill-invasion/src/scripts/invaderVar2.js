import { EventBus } from './eventBus.js';
import { Invader } from './invader.js';

export class InvaderVar2 extends Invader {
    constructor(x, y, cellSize, waypoints) {
        super(x, y, cellSize, waypoints);

        this.health = 150;
        this.color = '#FF00FF'; 
        this.reward = 20;
    }

    
}
