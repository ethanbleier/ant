import * as THREE from 'three';

export class Engine {
    constructor(containerElement) {
        if (!containerElement) {
            console.error("Engine constructor requires a container element.");
            return;
        }
        this.container = containerElement;

        this.scene = new THREE.Scene();
        // Use container dimensions for aspect ratio initially
        // Ensure clientWidth/clientHeight are non-zero or provide defaults
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.aspectRatio = width / height;
        // Adjust camera parameters for a suitable top-down view
        const frustumSize = 20; // Example size, adjust based on your game's scale
        this.camera = new THREE.OrthographicCamera(
            frustumSize * this.aspectRatio / -2,
            frustumSize * this.aspectRatio / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            1000
        );
        this.camera.position.set(0, 50, 0); // Position the camera above the scene
        this.camera.lookAt(0, 0, 0); // Look down at the center
        this.camera.up.set(0, 0, -1); // Set the up direction correctly for top-down

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        // Use container dimensions for renderer size
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xaaaaaa); // A light grey background
        // Append renderer to the provided container
        this.container.appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        // Example: Add a simple grid helper to visualize the ground plane
        const gridHelper = new THREE.GridHelper(100, 100);
        gridHelper.rotation.x = Math.PI / 2; // Rotate to be horizontal
        this.scene.add(gridHelper);

        // Example: Add basic lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);
    }

    onWindowResize() {
        // Use container dimensions for aspect ratio
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.aspectRatio = width / height;
        const frustumSize = 20; // Keep consistent with constructor

        this.camera.left = frustumSize * this.aspectRatio / - 2;
        this.camera.right = frustumSize * this.aspectRatio / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / - 2;
        this.camera.updateProjectionMatrix();

        // Use container dimensions for renderer size
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        // Game logic updates will go here
    }
} 