import * as THREE from 'three';
import { isKeyDown } from '../core/input.js';

export class GameScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.objects = [];
        this.cube = null;
    }

    /**
     * Initialize the game scene
     * @param {THREE.Scene} scene - The Three.js scene
     * @param {THREE.Camera} camera - The Three.js camera
     */
    initialize(scene, camera) {
        this.scene = scene;
        this.camera = camera;

        // Clear the scene
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }

        // Create lights
        this.createLights();

        // Create a simple placeholder cube
        this.createPlaceholderObjects();

        // Set background color
        scene.background = new THREE.Color(0x87ceeb); // Sky blue
    }

    /**
     * Create lights for the scene
     */
    createLights() {
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light (sunlight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048; 
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        
        this.scene.add(directionalLight);
    }

    /**
     * Create placeholder objects for the game scene
     */
    createPlaceholderObjects() {
        // Create a simple cube as placeholder
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Create materials with different colors for each face
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Red
            new THREE.MeshStandardMaterial({ color: 0x00ff00 }), // Green
            new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Blue
            new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Yellow
            new THREE.MeshStandardMaterial({ color: 0xff00ff }), // Magenta
            new THREE.MeshStandardMaterial({ color: 0x00ffff })  // Cyan
        ];
        
        this.cube = new THREE.Mesh(geometry, materials);
        this.cube.position.set(0, 0, 0);
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        
        this.scene.add(this.cube);
        this.objects.push(this.cube);
        
        // Create a ground plane
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x663300,  // Brown for dirt
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.position.y = -1;
        ground.receiveShadow = true;
        
        this.scene.add(ground);
        this.objects.push(ground);
        
        // Add instructions text
        this.createInstructionsText();
    }

    /**
     * Create instructions text
     */
    createInstructionsText() {
        // Create a text panel
        const textGeometry = new THREE.PlaneGeometry(4, 0.8);
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 2, 0);
        
        // Add to scene
        this.scene.add(textMesh);
        this.objects.push(textMesh);
        
        // Create canvas for rendering text
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Draw text on canvas
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 24px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Use arrow keys to control. ESC to return to menu.', canvas.width / 2, canvas.height / 2);
        
        // Apply canvas as texture
        const texture = new THREE.CanvasTexture(canvas);
        textMaterial.map = texture;
        textMaterial.needsUpdate = true;
    }

    /**
     * Update game scene (called each frame)
     */
    update() {
        // Rotate the cube
        if (this.cube) {
            this.cube.rotation.x += 0.01;
            this.cube.rotation.y += 0.01;
        }
        
        // Handle keyboard input
        this.handleInput();
    }

    /**
     * Handle keyboard input
     */
    handleInput() {
        // Move the cube with arrow keys
        if (isKeyDown('arrowup')) {
            this.cube.position.z -= 0.05;
        }
        if (isKeyDown('arrowdown')) {
            this.cube.position.z += 0.05;
        }
        if (isKeyDown('arrowleft')) {
            this.cube.position.x -= 0.05;
        }
        if (isKeyDown('arrowright')) {
            this.cube.position.x += 0.05;
        }
    }

    /**
     * Clean up scene resources
     */
    cleanup() {
        // Remove objects from scene
        for (const object of this.objects) {
            this.scene.remove(object);
        }
        
        this.objects = [];
    }
}
