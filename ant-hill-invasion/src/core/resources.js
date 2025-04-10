// Resource storage
const images = {};
const sounds = {};

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
        // Define game images here
        // { name: 'dirt', url: '/images/dirt.png' },
        // { name: 'grass', url: '/images/grass.png' },
        // { name: 'enemy1', url: '/images/enemy1.png' },
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
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Draw checkerboard pattern
    context.fillStyle = '#555555';
    context.fillRect(0, 0, 64, 64);
    context.fillStyle = '#FF00FF'; // Magenta for missing textures
    context.fillRect(0, 0, 32, 32);
    context.fillRect(32, 32, 32, 32);
    
    // Convert to image
    const defaultImg = new Image();
    defaultImg.src = canvas.toDataURL();
    images.defaultImage = defaultImg;
}

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
