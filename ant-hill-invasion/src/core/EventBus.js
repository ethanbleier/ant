// Simple global Event Bus

class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * Subscribe to an event type.
     * @param {string} eventType - The name of the event (e.g., 'moneyChanged').
     * @param {Function} callback - The function to call when the event is published.
     * @returns {Function} An unsubscribe function.
     */
    subscribe(eventType, callback) {
        if (!this.listeners[eventType]) {
            this.listeners[eventType] = [];
        }
        this.listeners[eventType].push(callback);
        
        // Return an unsubscribe function
        return () => {
            this.unsubscribe(eventType, callback);
        };
    }

    /**
     * Unsubscribe from an event type.
     * @param {string} eventType - The name of the event.
     * @param {Function} callback - The specific callback to remove.
     */
    unsubscribe(eventType, callback) {
        if (!this.listeners[eventType]) {
            return;
        }
        this.listeners[eventType] = this.listeners[eventType].filter(
            listener => listener !== callback
        );
    }

    /**
     * Publish an event.
     * @param {string} eventType - The name of the event.
     * @param {*} [payload] - Optional data to pass to listeners.
     */
    publish(eventType, payload) {
        if (!this.listeners[eventType]) {
            return;
        }
        console.log(`EVENT: ${eventType}`, payload !== undefined ? payload : ''); // Basic logging
        this.listeners[eventType].forEach(callback => {
            try {
                callback(payload);
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
            }
        });
    }
}

// Create a singleton instance
const eventBus = new EventBus();

// Export the singleton instance
export { eventBus }; 