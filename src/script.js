import * as THREE from "three";
import GUI from "lil-gui";
// GSAP Library for Animations
import gsap from "gsap";

//>> Three.js as a background to a classic HTML website
//>> camera will follow the scroll
//>> parallax effect based on the cursor position
//>> trigger some animation when arriving at a certain section

/**
 * Debug UI
 */
const gui = new GUI();

const parameters = {
  materialColor: "#ffeded",
};

gui.addColor(parameters, "materialColor").onChange(() => {
  // .onChange listens to an event, when the user changes the color it changes the color of the meshes
  // provide the color that the user has chosen with the debug ui tool to update the color and to make the debug ui work
  material.color.set(parameters.materialColor);
  particlesMaterial.color.set(parameters.materialColor);
});

//>> Textureloader
// texture loader
const textureLoader = new THREE.TextureLoader();

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

//! webgl background is black by default, but the body background is white
// We could have set background color to white in the css or make the body also black, to fix this, but we will use a different approach: We make the clearColor transparent and only set the background color on the page => go to the renderer and set the clear color to transparent with "alpha: true"

// Scene
const scene = new THREE.Scene();

//>> Objects

//* load the gradient texture
const gradientTexture = textureLoader.load("./textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter; // no gradient mix between the three shades
//++ set the magFilter to NearestFilter to make the gradient texture look more pixelated and to give it a retro look => sharp edges between the colors and no mix between the colors; magfilter = magnification filter => how the texture looks when it's magnified; magnified means when the texture is bigger than the pixels on the screen => the texture is stretched and the pixels are bigger than the pixels on the screen => the texture is blurred;
//* minfilter = minification filter => how the texture looks when it's minified; minified means when the texture is smaller than the pixels on the screen => the texture is compressed and the pixels are smaller than the pixels on the screen => the texture is pixelated

// one material for all three meshes
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor, //* parameters comes from the debug ui above
  gradientMap: gradientTexture, // add the gradient texture to the material to give it a base gradient effect; without it, there are only two shades of the color
});
// MeshToonMaterial appears only with a light source, so we need to add a light source to the scene (see below)

const objectsDistance = 4; // distance between the objects

const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);

const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);

const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
);

// vertical Positioning
mesh1.position.y = -objectsDistance * 0; // minus because we want to move the objects down; -2 * 0 = 0
mesh2.position.y = -objectsDistance * 1; // -2 * 1 = -2
mesh3.position.y = -objectsDistance * 2; // -2 * 2 = -4

// horizontal Positioning
mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;

scene.add(mesh1, mesh2, mesh3);

//* array for the meshes
const sectionMeshes = [mesh1, mesh2, mesh3]; // store the meshes in an array to loop through them later when you want to update their position based on the scroll or other events in the tick function

/**
 * Particles
 */
const particlesCount = 200;
const particlePositions = new Float32Array(particlesCount * 3); // to store the positions
for (let i = 0; i < particlesCount; i++) {
  particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 10; // x
  particlePositions[i * 3 + 1] =
    objectsDistance * 0.5 -
    Math.random() * objectsDistance * sectionMeshes.length; // y
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(particlePositions, 3)
); // 3 because we have x, y and z

const particlesMaterial = new THREE.PointsMaterial({
  color: parameters.materialColor,
  sizeAttenuation: true, // smaller particles the more they are away
  size: 0.03,
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

//>> Lights
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
// position the light
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix(); // updateProjectionMatrix is a method that we need to call to update the camera

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */

// Camera
// No OrbitControls because we will move the camera based on the scroll and we want to have controll of the camera and not let the user move it

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(
  35, // In Three.js the field of view is vertical => here it is 35 degrees
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // set the background to transparent => you can see through the canvas
  // by default alpha is false/ 0, which means the background is black
  // alpha sets both, setClearColor and setClearAlpha
  // setClearColor => set the color of the background
  // setClearAlpha => set the opacity of the background; 0 is the default, 1 is fully opaque
});
// renderer.setClearAlpha(0); // sets the clear alpha without chaning the setClearColor. Valid input is a float between 0.0 and 1.0
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//>> Scroll
//1.  scroll position; save the current scroll position value
let scrollY = window.scrollY; // window.scrollY is the current scroll position; save it as a variable

let currentSection = 0; // be default we are at the top => 0

//2.  listen to the scroll event
window.addEventListener("scroll", () => {
  // update the current scroll position
  // console.log("user is scrolling");
  scrollY = window.scrollY; // new scroll position

  // check on which section the user is currently scrolling
  let newSection = Math.round(scrollY / sizes.height); // this works, because each section is one viewport height! If the sections are longer, you have to do a different, maybe more complex calculation
  // console.log(newSection);
  if (newSection != currentSection) {
    currentSection = newSection;
    // GSAP Animation, when arriving a new section
    // we want to rotate the rotation of the mesh of the current section:
    gsap.to(sectionMeshes[currentSection].rotation, {
      // rotation is an Euler number
      // you can use the keys from the GSAP Library
      duration: 1.5,
      ease: "power2.inOut",
      x: "+= 6", // add 6 to the current value of the rotation which was already there
      y: "+=3",
      z: "+=1.5",
    });
    console.log("changed section", currentSection);
  }
});

//>> Cursor for creating a parallax effect like we do with our eyes
// 1. cursor position
const cursor = {
  x: 0,
  y: 0,
};

//* listen to the mousemove event to make the camera move horizontally and vertically
window.addEventListener("mousemove", (event) => {
  // 2. update the cursor position
  cursor.x = event.clientX / sizes.width - 0.5;
  // divide by the width of the window to get a value between 0 and 1 regardless of the viewport-size/ resolution;
  //  currently the amplitude depends on the width of the window/viewport, therefore we need to normalize the cursor position to optimize the resolution of the cursor position, because otherwise different screens will have different resolutions and therefore different results for different users/screens
  // normalize the cursor position; 0.5 is the center of the screen => we subtract it to get values from -0.5 to 0.5 for the camera to go in all directions of the x and y axis, also the negative directions -x and -y
  // clientX is a property of the event object, which has the value of the x position
  cursor.y = -(event.clientY / sizes.height - 0.5);
  // invert the y axis because the y axis goes from top to bottom
  //* instead of values going from 0 to 1, we want them to go from -0.5 to 0.5
  // clientY is a property of the event object with the value of the y position
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  const deltaTime = elapsedTime - previousTime; // current time - the time before
  previousTime = elapsedTime;

  //>> Update camera position based on the scroll
  //* We make the camera move before doing the render with the scrollY-Position
  // Each section has the same size as the window, so we can use the height of the window to calculate the position of the camera based on the scroll
  // This means that when we scroll the distance of one window height, the camera will move by the height of the window and reach the next object or section
  // 0, -4 and -8 are the positions of the objects in the scene (depending on objectDistance above)

  // camera.position.y = -scrollY * 0.001; // move the camera based on the scroll position; scroll goes up by default, so we need to invert the direction by multiplying it with -; 0.001 is the speed of the camera movement based on the scroll; by default it would be too fast
  camera.position.y = (-scrollY / sizes.height) * objectsDistance; //* => the camera moves by the height of the window based on the scroll with 1 unit because we are dividing by the sizes height = viewport/window height.
  // The Camera is now going down 1 unit for each section scrolled, but the objects are currently separated by 4 units which is the "objectDistance" variable. We need to multiply the value by "objectsDistance", so that the current section and the viewportheights are aligned and you only see the current section

  //% Parallax Camera Effect
  const parallaxX = cursor.x * 0.5; // multiplied by 0.5 makes the movement more slow
  const parallaxY = -cursor.y * 0.5; // to synchronize the direction of the camera and mesh movement we need to negate the value

  //* We put the camera in a Group and apply the parallax on the group an not on the camera itself (see above at the Camera), so that both works: the scrolling and the parallax
  cameraGroup.position.x +=
    ((parallaxX - cameraGroup.position.x) / 0.5) * deltaTime; // += because of the lerping: first on each frame, we are adding to the current cameraGroup position; then we need to calculate the distance from the current position to the destinated position through a substraction => target - current position => parallaxX/Y - cameraGroup.position.X/Y; then we divide a value from 0.1 to 0.5 or higher to make the effect very smooth and then we multiply it by the deltatime, to prevent a diffrent experience due to maybe some users use screens with a higherframerate, which would make the animation faster then you wantet it to be; we are basing our animation on the framerate of the screen
  cameraGroup.position.y +=
    ((parallaxY - cameraGroup.position.y) / 0.5) * deltaTime;

  //>> Update objects
  // loop through the meshes and update their position ( with for of loop or forEach)
  // forEach is a method that loops through an array and executes a function for each element in the array
  sectionMeshes.forEach((mesh) => {
    /*  mesh.rotation.x = elapsedTime * 0.1;
    mesh.rotation.y = elapsedTime * 0.12; */
    // Because we want to animate our meshes in a special way, when the user scrolls over them, we need to fix our code here. If we just leave it like it was, we can´t see the GSAP Animation, because it will be overwritten by the assignment to the mesh.rotation with the elapsedtime. To fix it, we add the deltatime to the current rotation with +=
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  });

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

//
//* We have only a few objects here, but if you have more objects or sections you can store them in an array or other code structuring solutions and loop through them to update their position based on the scroll; in React f.ex. you could use a useEffect hook to update the position of the camera based on the scroll

//
// field of view in Three.js is vertical by default, so the camera will zoom in and out based on the vertical scroll
//* in our case very good, because we do not have to change something for the case the user resizes the window => the objects stay in the same position and become bigger or smaller based on the resizing of the window => responsive
// if you want to have a horizontal scroll, you need to change the field of view to horizontal

//* easing, smoothing, lerping => make the parallax animation less mechanic and more realistic; lerping comes from the lerp formula behind it; Instead of moving the camera immediatly to it´s destination like by default => On each frame we move the camera 10 % closer to it´s destination, then on the next frame another 10th further and then on the next frame again a 10th closer; the closer we are, the slower the movement goes and in fact it almost never reaches it´s destination but comes very close

//! If you work on high frequency screens, the animations will be faster! We need to fix this, so that every user has the same experience: You need to know, how much time, was spend since the last frame => delta time = time between now and the last frame

// GSAP Library

//TODO
// more content
// icons
// animate other material properties
// text animation, per letter animation
// text color
// improve the particles
// more tweaks for the debug ui
// colors in general
