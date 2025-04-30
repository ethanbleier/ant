// Resource storage
const images = {};
const sounds = {};
let defaultImage = null; // Module-level variable for the default image object

// Loading tracking
let resourcesLoaded = 0;
let resourcesTotal = 0;

/**
 * Load all game resources
 * @returns {Promise} Promise that resolves when all resources are loaded
 */
export function loadResources() {
    return new Promise((resolve) => {
        // Setup resource tracking
        const onResourceLoaded = () => {
            resourcesLoaded++;
            const progress = (resourcesLoaded / resourcesTotal) * 100;
            console.log(`Loading: ${Math.round(progress)}%`);
            
            if (resourcesLoaded >= resourcesTotal) {
                console.log('All resources loaded');
                resolve();
            }
        };
        
        // Load images
        loadImages(onResourceLoaded);
        
        // Load sounds
        // loadSounds(onResourceLoaded);
        
        // If no resources to load, resolve immediately
        if (resourcesTotal === 0) {
            resolve();
        }
    });
}

/**
 * Load all required images
 * @param {Function} onResourceLoaded - Callback when a resource is loaded
 */
function loadImages(onResourceLoaded) {
    const imagesToLoad = [
        // Define game images here - Adjust URLs to match your project!
        { name: 'defenderSprite', url: '/assets/models/defender_ant.png' },
        { name: 'gladiatorAntSprite', url: '/assets/models/gladiator_ant.png' },
        { name: 'sniperAntSprite', url: '/assets/models/sniper_ant.png' },
        { name: 'fireAntSprite', url: '/assets/models/fire_ant.png' },     
        { name: 'leafCutterAntSprite', url: '/assets/models/leafcutter_ant.png' },
        { name: 'tankAntSprite', url: '/assets/models/tank_ant.png' },
        { name: 'fastAntSprite', url: '/assets/models/speed_ant.png' },
        { name: 'queenAntSprite', url: '/assets/models/queen_ant.png' },
    ];
    
    // Update total resource count
    resourcesTotal += imagesToLoad.length;
    
    // Create a default image for fallback
    createDefaultImage();
    
    // Load each image
    imagesToLoad.forEach(imageData => {
        const img = new Image();
        img.onload = () => {
            images[imageData.name] = img;
            onResourceLoaded();
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${imageData.url}`);
            images[imageData.name] = images.defaultImage;
            onResourceLoaded();
        };
        img.src = imageData.url;
    });
}

/**
 * Create a default image as fallback for missing resources
 */
function createDefaultImage() {
    // Create a default image using canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32; // Smaller default texture is fine
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Draw checkerboard pattern
    context.fillStyle = '#555555';
    context.fillRect(0, 0, 32, 32);
    context.fillStyle = '#FF00FF'; // Magenta for missing textures
    context.fillRect(0, 0, 16, 16);
    context.fillRect(16, 16, 16, 16);
    
    // Convert to image
    const img = new Image(); // Use local temporary name
    img.src = canvas.toDataURL();
    images.defaultImage = img; // Assign for internal getImage use
    defaultImage = img; // Assign to the module-level variable for export
}

// Export loaded images map and the default image object
export { images as loadedImages, defaultImage };

/**
 * Get a loaded image by name
 * @param {string} name - Name of the image to get
 * @returns {HTMLImageElement} The image object
 */
export function getImage(name) {
    return images[name] || images.defaultImage;
}

/**
 * Preload a single image
 * @param {string} name - Name to reference the image by
 * @param {string} url - URL of the image to load
 * @returns {Promise} Promise that resolves when the image is loaded
 */
export function preloadImage(name, url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            images[name] = img;
            resolve(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            images[name] = images.defaultImage;
            resolve(images.defaultImage);
        };
        img.src = url;
    });
}

/**
 * Draw an image on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} imageName - Name of the image to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width to draw
 * @param {number} height - Height to draw
 */
export function drawImage(ctx, imageName, x, y, width, height) {
    const image = getImage(imageName);
    ctx.drawImage(image, x, y, width, height);
}
