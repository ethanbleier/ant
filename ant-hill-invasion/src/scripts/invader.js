import { EventBus } from './eventBus.js';
export class Invader {
    constructor(x, y, cellSize, waypoints) {

        this.id = Math.random().toString(36).substr(2, 9); // simple unique ID

        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;

        this.health = 100;
        this.maxHealth = 100;
        this.speed = 1;
        this.pathIndex = 0;
        this.color = '#a6ff00';
        this.reward = 10;

        this.waypoints = waypoints; // from the map
        this.state = 'calm';
        this.invaderHasHalfHp= false;

        EventBus.addEventListener('invaderHalfHealth', (e) => {
            if (e.detail.id === this.id) {
                this.state = 'panic';
                // console.log("joe mama: "+ this.id+" "+this.state);
            }
        });

    }

    update() {
        if (this.pathIndex >= this.waypoints.length - 1) return;

        const target = this.waypoints[this.pathIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.speed) {
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        switch (this.state) {
            case 'calm':
                this.speed = 1;
                break;
            case 'panic':
                this.speed = 1.5;
                break;
            case 'dead':
                //oof
                break;
        }

    }
}
