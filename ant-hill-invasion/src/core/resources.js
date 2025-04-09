import * as THREE from 'three';

// Resource storage
const textures = {};
const models = {};
const sounds = {};

// Loading manager to track progress
const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    console.log(`Loading: ${Math.round(progress)}% (${url})`);
};

/**
 * Load all game resources
 * @returns {Promise} Promise that resolves when all resources are loaded
 */
export function loadResources() {
    return new Promise((resolve) => {
        loadingManager.onLoad = () => {
            console.log('All resources loaded');
            resolve();
        };
        
        // Load textures
        loadTextures();
        
        // Load models
        loadModels();
        
        // If no resources to load, resolve immediately
        if (loadingManager.itemsLoaded === loadingManager.itemsTotal) {
            resolve();
        }
    });
}

/**
 * Load all required textures
 */
function loadTextures() {
    const textureLoader = new THREE.TextureLoader(loadingManager);
    
    // Load game textures here
    // Example: textures.dirt = textureLoader.load('/textures/dirt.png');
    textures.defaultTexture = textureLoader.load('/textures/default.png', undefined, undefined, () => {
        // Use a simple colored texture as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#555555';
        context.fillRect(0, 0, 128, 128);
        
        const fallbackTexture = new THREE.CanvasTexture(canvas);
        textures.defaultTexture = fallbackTexture;
    });
}

/**
 * Load all required 3D models
 */
function loadModels() {
    // Example model loading code
    // const modelLoader = new GLTFLoader(loadingManager);
    // modelLoader.load('/models/ant.gltf', (gltf) => {
    //     models.ant = gltf.scene;
    // });
}

/**
 * Get a loaded texture by name
 * @param {string} name - Name of the texture to get
 * @returns {THREE.Texture} The texture object
 */
export function getTexture(name) {
    return textures[name] || textures.defaultTexture;
}

/**
 * Get a loaded model by name
 * @param {string} name - Name of the model to get
 * @returns {THREE.Object3D} The model object
 */
export function getModel(name) {
    return models[name];
}

/**
 * Preload a single texture
 * @param {string} name - Name to reference the texture by
 * @param {string} url - URL of the texture to load
 * @returns {Promise} Promise that resolves when the texture is loaded
 */
export function preloadTexture(name, url) {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(url, (texture) => {
            textures[name] = texture;
            resolve(texture);
        });
    });
}
