import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';

// --- SHADERS ---
const vertex = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float u_time;
  
  void main() {
    vUv = uv;
    vPosition = position;
    // Subtle breathing effect on dots without massive extrusion
    vec3 newPosition = position + position * (sin(u_time * 2.0) * 0.005); 
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
    gl_PointSize = 3.0; // Fixed size for dots
  }
`;

const fragment = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float u_time;
  
  // GSU Colors
  vec3 colorGold = vec3(0.796, 0.658, 0.305); // #cba84e
  vec3 colorWhite = vec3(0.8, 0.85, 0.9);
  
  void main() {
     // Circular particle
     float disc = length(gl_PointCoord - vec2(0.5));
     if (disc > 0.5) discard;
     
     // Twinkle effect
     float pct = abs(sin(u_time * 0.5 + vPosition.x));
     vec3 color = mix(colorGold, colorWhite, pct);
     
     gl_FragColor = vec4(color, 1.0);
  }
`;

// --- SETUP ---
const container = document.querySelector('#canvas-container');
let scene, camera, renderer, controls;
let materials = [];

// Configuration
const dotSphereRadius = 16;
const routes = [
    // Europe Hub
    { start: {lat: 51.5, lon: -0.1}, end: {lat: 40.7, lon: -74.0} }, // Lon -> NY
    { start: {lat: 51.5, lon: -0.1}, end: {lat: 25.2, lon: 55.2} }, // Lon -> Dubai
    { start: {lat: 51.5, lon: -0.1}, end: {lat: 1.3, lon: 103.8} }, // Lon -> Sing
    { start: {lat: 51.5, lon: -0.1}, end: {lat: 19.0, lon: 72.8} }, // Lon -> Mumbai
    { start: {lat: 48.8, lon: 2.3}, end: {lat: 35.6, lon: 139.6} }, // Paris -> Tokyo
    
    // US Hub
    { start: {lat: 40.7, lon: -74.0}, end: {lat: 34.0, lon: -118.2} }, // NY -> LA
    { start: {lat: 34.0, lon: -118.2}, end: {lat: 35.6, lon: 139.6} }, // LA -> Tokyo
    { start: {lat: 40.7, lon: -74.0}, end: {lat: -23.5, lon: -46.6} }, // NY -> Sao Paulo
    
    // Asia/MidEast Hub
    { start: {lat: 25.2, lon: 55.2}, end: {lat: 22.3, lon: 114.1} }, // Dubai -> HK
    { start: {lat: 19.0, lon: 72.8}, end: {lat: 1.3, lon: 103.8} }, // Mumbai -> Sing
    { start: {lat: 1.3, lon: 103.8}, end: {lat: -33.8, lon: 151.2} }, // Sing -> Sydney
    { start: {lat: 35.6, lon: 139.6}, end: {lat: 1.3, lon: 103.8} }, // Tokyo -> Sing
    { start: {lat: 39.9, lon: 116.4}, end: {lat: 55.7, lon: 37.6} }  // Beijing -> Moscow
];

function init() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    scene = new THREE.Scene();

    // Camera setup - FOV 45
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    
    // Position camera based on screen size
    if(window.innerWidth > 900) {
         camera.position.set(15, 10, 45); // Desktop: Offset to right
    } else {
         camera.position.set(0, 0, 50); // Mobile: Centered and closer (Zoomed In)
    }

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    // Load Image and Create Globe
    const imgLoader = new THREE.ImageLoader();
    imgLoader.load('assets/world_alpha_mini.jpg', (image) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        createGlobeFromData(imageData.data, image.width, image.height);
    }, undefined, () => {
        console.warn('Image not found, creating fallback globe');
        createFallbackGlobe();
    });

    createLines();
    animate();
    window.addEventListener('resize', onWindowResize);
}

// --- GLOBE LOGIC ---

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    return new THREE.Vector3(x, y, z);
}

function createGlobeFromData(imageData, imgWidth, imgHeight) {
    const activeLatLon = {};

    for(let y = 0; y < imgHeight; y++) {
        const lat = 90 - y; 
        if(!activeLatLon[lat]) activeLatLon[lat] = [];

        for(let x = 0; x < imgWidth; x++) {
            const lon = -180 + x; 
            const i = (y * imgWidth + x) * 4;

            const red = imageData[i];
            const green = imageData[i + 1];
            const blue = imageData[i + 2];

            if(red < 80 && green < 80 && blue < 80) {
                activeLatLon[lat].push(lon);
            }
        }
    }

    const visibilityForCoordinate = (lon, lat) => {
        const latKey = Math.round(lat);
        if(!activeLatLon[latKey] || !activeLatLon[latKey].length) return false;

        const closest = activeLatLon[latKey].reduce((prev, curr) => {
            return (Math.abs(curr - lon) < Math.abs(prev - lon) ? curr : prev);
        });

        return Math.abs(lon - closest) < 1.5;
    };

    const continentPositions = [];
    const oceanPositions = [];
    const dotDensity = 2.5;

    for (let lat = 90; lat > -90; lat--) {
        const radius = Math.cos(Math.abs(lat) * (Math.PI / 180)) * dotSphereRadius;
        const circumference = radius * Math.PI * 2;
        const dotsForLat = circumference * dotDensity;

        for (let x = 0; x < dotsForLat; x++) {
            const lon = -180 + (x * 360 / dotsForLat);
            const pos = latLonToVector3(lat, lon, dotSphereRadius);

            if(visibilityForCoordinate(lon, lat)) {
                continentPositions.push(pos.x, pos.y, pos.z);
            } else {
                oceanPositions.push(pos.x, pos.y, pos.z);
            }
        }
    }

    const continentGeometry = new THREE.BufferGeometry();
    continentGeometry.setAttribute('position', new THREE.Float32BufferAttribute(continentPositions, 3));

    const continentMaterial = new THREE.ShaderMaterial({
        uniforms: { u_time: { value: 0 } },
        vertexShader: vertex,
        fragmentShader: fragment.replace('vec3 colorGold = vec3(0.796, 0.658, 0.305);', 'vec3 colorGold = vec3(0.796, 0.658, 0.305);')
                                .replace('vec3 colorWhite = vec3(0.8, 0.85, 0.9);', 'vec3 colorWhite = vec3(0.796, 0.658, 0.305);'), 
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const continentPoints = new THREE.Points(continentGeometry, continentMaterial);
    scene.add(continentPoints);
    materials.push(continentMaterial);

    const oceanGeometry = new THREE.BufferGeometry();
    oceanGeometry.setAttribute('position', new THREE.Float32BufferAttribute(oceanPositions, 3));

    const oceanMaterial = new THREE.ShaderMaterial({
        uniforms: { u_time: { value: 0 } },
        vertexShader: vertex,
        fragmentShader: fragment.replace('vec3 colorGold = vec3(0.796, 0.658, 0.305);', 'vec3 colorGold = vec3(0.9, 0.9, 0.92);')
                                .replace('vec3 colorWhite = vec3(0.8, 0.85, 0.9);', 'vec3 colorWhite = vec3(0.85, 0.85, 0.87);'), 
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const oceanPoints = new THREE.Points(oceanGeometry, oceanMaterial);
    scene.add(oceanPoints);
    materials.push(oceanMaterial);

    const innerGeo = new THREE.SphereGeometry(dotSphereRadius - 0.5, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x192030 });
    scene.add(new THREE.Mesh(innerGeo, innerMat));
}

function createFallbackGlobe() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for(let i=0; i<3000; i++) {
        const lat = (Math.random() - 0.5) * 180;
        const lon = (Math.random() - 0.5) * 360;
        const pos = latLonToVector3(lat, lon, dotSphereRadius);
        positions.push(pos.x, pos.y, pos.z);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.ShaderMaterial({
        uniforms: { u_time: { value: 0 } },
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true
    });
    scene.add(new THREE.Points(geometry, material));
}

// --- ANIMATED LINES ---

function createLines() {
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    routes.forEach(route => {
        const v1 = latLonToVector3(route.start.lat, route.start.lon, dotSphereRadius);
        const v2 = latLonToVector3(route.end.lat, route.end.lon, dotSphereRadius);
        
        const dist = v1.distanceTo(v2);
        const mid = v1.clone().add(v2).multiplyScalar(0.5).normalize().multiplyScalar(dotSphereRadius + (dist * 0.3));
        
        const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const lineMaterial = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(0xcba84e) },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying float vProgress;
                void main() {
                    vProgress = uv.x;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float uTime;
                varying float vProgress;
                void main() {
                    float dash = sin(vProgress * 10.0 - uTime * 3.0);
                    if(dash < 0.5) discard; 
                    float opacity = smoothstep(0.0, 0.2, vProgress) * smoothstep(1.0, 0.8, vProgress);
                    gl_FragColor = vec4(color, opacity);
                }
            `,
            transparent: true
        });
        
        const uvs = [];
        for(let i=0; i<=50; i++) uvs.push(i/50, 0);
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

        const line = new THREE.Line(geometry, lineMaterial);
        lineGroup.add(line);
        materials.push(lineMaterial);
    });
}

// --- LOOP ---

function onWindowResize() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Re-center and adjust zoom on mobile
    if(window.innerWidth < 900) camera.position.set(0, 0, 50);
    else camera.position.set(15, 10, 45);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    
    materials.forEach(mat => {
        if(mat.uniforms.u_time) mat.uniforms.u_time.value = time;
        if(mat.uniforms.uTime) mat.uniforms.uTime.value = time;
    });
    
    controls.update();
    renderer.render(scene, camera);
}

// Start
init();

