// THREEJS RELATED VARIABLES 

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    globalLight, shadowLight, backLight,
    renderer,
    container,
    controls,
    clock;
var delta = 0;
var floorRadius = 200;
var speed = 6;
var distance = 0;
var level = 1;
var levelInterval;
var levelUpdateFreq = 3000;
var initSpeed = 5;
var maxSpeed = 48;
var monsterPos = 0.65;
var monsterPosTarget = 0.65;
var floorRotation = 0;
var collisionObstacle = 10;
var collisionBonus = 20;
var gameStatus = "play";
var cameraPosGame = 160;
var cameraPosGameOver = 260;
var monsterAcceleration = 0.004;
var malusClearColor = 0xb44b39;
var malusClearAlpha = 0;
var audio = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/264161/Antonio-Vivaldi-Summer_01.mp3');

var fieldGameOver, fieldDistance;

// SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH, windowHalfX, windowHalfY,
    mousePos = { x: 0, y: 0 };

// 3D OBJECTS VARIABLES

var hero;

// Materials
var blackMat = new THREE.MeshPhongMaterial({
    color: 0x100707,
    shading: THREE.FlatShading,
});
var brownMat = new THREE.MeshPhongMaterial({
    color: 0xb44b39,
    shininess: 0,
    shading: THREE.FlatShading,
});
var greenMat = new THREE.MeshPhongMaterial({
    color: 0x7abf8e,
    shininess: 0,
    shading: THREE.FlatShading,
});
var pinkMat = new THREE.MeshPhongMaterial({
    color: 0xdc5f45,
    shininess: 0,
    shading: THREE.FlatShading,
});
var lightBrownMat = new THREE.MeshPhongMaterial({
    color: 0xe07a57,
    shading: THREE.FlatShading,
});
var whiteMat = new THREE.MeshPhongMaterial({
    color: 0xa49789, 
    shading: THREE.FlatShading,
});
var skinMat = new THREE.MeshPhongMaterial({
    color: 0xff9ea5,
    shading: THREE.FlatShading,
});

// OTHER VARIABLES
var PI = Math.PI;

// INIT THREE JS, SCREEN AND MOUSE EVENTS

function initScreenAnd3D() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd6eae6, 160, 350);

  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = 1;
  farPlane = 2000;
  camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
  camera.position.set(0, 30, cameraPosGame);
  camera.lookAt(new THREE.Vector3(0, 30, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(malusClearColor, malusClearAlpha);
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', handleWindowResize, false);
  document.addEventListener('mousedown', handleMouseDown, false);
  document.addEventListener("touchend", handleMouseDown, false);

  // Uncomment the following lines if you wish to use OrbitControls:
  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.noPan = true;
  */
  
  clock = new THREE.Clock();
}

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseDown(event) {
  if (gameStatus == "play") hero.jump();
  else if (gameStatus == "readyToReplay") replay();
}

function createLights() {
  globalLight = new THREE.AmbientLight(0xffffff, 0.9);
  shadowLight = new THREE.DirectionalLight(0xffffff, 1);
  shadowLight.position.set(-30, 40, 20);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 2000;
  shadowLight.shadow.mapSize.width = shadowLight.shadow.mapSize.height = 2048;
  scene.add(globalLight);
  scene.add(shadowLight);
}

function createFloor() {
  floorShadow = new THREE.Mesh(
    new THREE.SphereGeometry(floorRadius, 50, 50),
    new THREE.MeshPhongMaterial({
      color: 0x7abf8e,
      specular: 0x000000,
      shininess: 1,
      transparent: true,
      opacity: 0.5
    })
  );
  floorShadow.receiveShadow = true;
  
  floorGrass = new THREE.Mesh(
    new THREE.SphereGeometry(floorRadius - 0.5, 50, 50),
    new THREE.MeshBasicMaterial({ color: 0x7abf8e })
  );
  floorGrass.receiveShadow = false;
  
  floor = new THREE.Group();
  floor.position.y = -floorRadius;
  floor.add(floorShadow);
  floor.add(floorGrass);
  scene.add(floor);
}

// HERO CONSTRUCTOR (updated)
Hero = function() {
  this.status = "running";
  this.runningCycle = 0;
  this.mesh = new THREE.Group();
  this.body = new THREE.Group();
  this.mesh.add(this.body);
  
  var torsoGeom = new THREE.BoxGeometry(7, 7, 10, 1, 1, 1);
  this.torso = new THREE.Mesh(torsoGeom, brownMat);
  this.torso.position.set(0, 7, 0);
  this.torso.castShadow = true;
  this.body.add(this.torso);
  
  var pantsGeom = new THREE.BoxGeometry(9, 9, 5, 1, 1, 1);
  this.pants = new THREE.Mesh(pantsGeom, whiteMat);
  this.pants.position.set(0, 0, -3);
  this.pants.castShadow = true;
  this.torso.add(this.pants);
  
  var tailGeom = new THREE.BoxGeometry(3, 3, 3, 1, 1, 1);
  tailGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -2));
  this.tail = new THREE.Mesh(tailGeom, lightBrownMat);
  this.tail.position.set(0, 5, -4);
  this.tail.castShadow = true;
  this.torso.add(this.tail);
  
  this.torso.rotation.x = -Math.PI/8;
  
  var headGeom = new THREE.BoxGeometry(10, 10, 13, 1, 1, 1);
  headGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 7.5));
  this.head = new THREE.Mesh(headGeom, brownMat);
  this.head.position.set(0, 11, 2);
  this.head.castShadow = true;
  this.body.add(this.head);
  
  var cheekGeom = new THREE.BoxGeometry(1, 4, 4, 1, 1, 1);
  this.cheekR = new THREE.Mesh(cheekGeom, pinkMat);
  this.cheekR.position.set(-5, -2.5, 7);
  this.cheekR.castShadow = true;
  this.head.add(this.cheekR);
  
  this.cheekL = this.cheekR.clone();
  this.cheekL.position.x = -this.cheekR.position.x;
  this.head.add(this.cheekL);
  
  var noseGeom = new THREE.BoxGeometry(6, 6, 3, 1, 1, 1);
  this.nose = new THREE.Mesh(noseGeom, lightBrownMat);
  this.nose.position.set(0, 2.6, 13.5);
  this.nose.castShadow = true;
  this.head.add(this.nose);
  
  var mouthGeom = new THREE.BoxGeometry(4, 2, 4, 1, 1, 1);
  mouthGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 3));
  mouthGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI/12));
  this.mouth = new THREE.Mesh(mouthGeom, brownMat);
  this.mouth.position.set(0, -4, 8);
  this.mouth.castShadow = true;
  this.head.add(this.mouth);
  
  var pawFGeom = new THREE.BoxGeometry(3, 3, 3, 1, 1, 1);
  this.pawFR = new THREE.Mesh(pawFGeom, lightBrownMat);
  this.pawFR.position.set(-2, 1.5, 6);
  this.pawFR.castShadow = true;
  this.body.add(this.pawFR);
  
  this.pawFL = this.pawFR.clone();
  this.pawFL.position.x = -this.pawFR.position.x;
  this.pawFL.castShadow = true;
  this.body.add(this.pawFL);
  
  var pawBGeom = new THREE.BoxGeometry(3, 3, 6, 1, 1, 1);
  this.pawBL = new THREE.Mesh(pawBGeom, lightBrownMat);
  this.pawBL.position.set(5, 1.5, 0);
  this.pawBL.castShadow = true;
  this.body.add(this.pawBL);
  
  this.pawBR = this.pawBL.clone();
  this.pawBR.position.x = -this.pawBL.position.x;
  this.pawBR.castShadow = true;
  this.body.add(this.pawBR);
  
  var earGeom = new THREE.BoxGeometry(7, 18, 2, 1, 1, 1);
  // Adjust ear geometry vertices (manually as before)
  earGeom.vertices[6].x += 2;
  earGeom.vertices[6].z += 0.5;
  earGeom.vertices[7].x += 2;
  earGeom.vertices[7].z -= 0.5;
  earGeom.vertices[2].x -= 2;
  earGeom.vertices[2].z -= 0.5;
  earGeom.vertices[3].x -= 2;
  earGeom.vertices[3].z += 0.5;
  earGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 9, 0));
  
  this.earL = new THREE.Mesh(earGeom, brownMat);
  this.earL.position.set(2, 5, 2.5);
  this.earL.rotation.z = -Math.PI/12;
  this.earL.castShadow = true;
  this.head.add(this.earL);
  
  this.earR = this.earL.clone();
  this.earR.position.x = -this.earL.position.x;
  this.earR.rotation.z = -this.earL.rotation.z;
  this.earR.castShadow = true;
  this.head.add(this.earR);
  
  var eyeGeom = new THREE.BoxGeometry(2, 4, 4, 1, 1, 1);
  this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
  this.eyeL.position.set(5, 2.9, 5.5);
  this.eyeL.castShadow = true;
  this.head.add(this.eyeL);
  
  var irisGeom = new THREE.BoxGeometry(0.6, 2, 2, 1, 1, 1);
  this.iris = new THREE.Mesh(irisGeom, blackMat);
  this.iris.position.set(1.2, 1, 1);
  this.eyeL.add(this.iris);
  
  this.eyeR = this.eyeL.clone();
  this.eyeR.children[0].position.x = -this.iris.position.x;
  this.eyeR.position.x = -this.eyeL.position.x;
  this.head.add(this.eyeR);

  this.body.traverse(function(object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
};

BonusParticles = function(){
  this.mesh = new THREE.Group();
  var bigParticleGeom = new THREE.BoxGeometry(10, 10, 10, 1, 1, 1);
  var smallParticleGeom = new THREE.BoxGeometry(5, 5, 5, 1, 1, 1);
  this.parts = [];
  for (var i = 0; i < 10; i++){
    var partPink = new THREE.Mesh(bigParticleGeom, pinkMat);
    var partGreen = new THREE.Mesh(smallParticleGeom, greenMat);
    partGreen.scale.set(0.5, 0.5, 0.5);
    this.parts.push(partPink);
    this.parts.push(partGreen);
    this.mesh.add(partPink);
    this.mesh.add(partGreen);
  }
};

BonusParticles.prototype.explose = function(){
  var _this = this;
  var explosionSpeed = 0.5;
  for (var i = 0; i < this.parts.length; i++){
    var tx = -50 + Math.random() * 100;
    var ty = -50 + Math.random() * 100;
    var tz = -50 + Math.random() * 100;
    var p = this.parts[i];
    p.position.set(0, 0, 0);
    p.scale.set(1, 1, 1);
    p.visible = true;
    var s = explosionSpeed + Math.random() * 0.5;
    TweenMax.to(p.position, s, { x: tx, y: ty, z: tz, ease: Power4.easeOut });
    TweenMax.to(p.scale, s, { x: 0.01, y: 0.01, z: 0.01, ease: Power4.easeOut, onComplete: removeParticle, onCompleteParams: [p] });
  }
};

function removeParticle(p){
  p.visible = false;
}

Hero.prototype.run = function(){
  this.status = "running";
  var s = Math.min(speed, maxSpeed);
  this.runningCycle += delta * s * 0.7;
  this.runningCycle %= (Math.PI * 2);
  var t = this.runningCycle;
  var amp = 4;
  var disp = 0.2;
  
  // BODY
  this.body.position.y = 6 + Math.sin(t - Math.PI/2) * amp;
  this.body.rotation.x = 0.2 + Math.sin(t - Math.PI/2) * amp * 0.1;
  
  this.torso.rotation.x = Math.sin(t - Math.PI/2) * amp * 0.1;
  this.torso.position.y = 7 + Math.sin(t - Math.PI/2) * amp * 0.5;
  
  // MOUTH
  this.mouth.rotation.x = Math.PI / 16 + Math.cos(t) * amp * 0.05;
  
  // HEAD
  this.head.position.z = 2 + Math.sin(t - Math.PI/2) * amp * 0.5;
  this.head.position.y = 8 + Math.cos(t - Math.PI/2) * amp * 0.7;
  this.head.rotation.x = -0.2 + Math.sin(t + Math.PI) * amp * 0.1;
  
  // EARS
  this.earL.rotation.x = Math.cos(-Math.PI/2 + t) * (amp * 0.2);
  this.earR.rotation.x = Math.cos(-Math.PI/2 + 0.2 + t) * (amp * 0.3);
  
  // EYES
  this.eyeR.scale.y = this.eyeL.scale.y = 0.7 + Math.abs(Math.cos(-Math.PI/4 + t * 0.5)) * 0.6;
  
  // TAIL
  this.tail.rotation.x = Math.cos(Math.PI/2 + t) * amp * 0.3;
  
  // FRONT RIGHT PAW
  this.pawFR.position.y = 1.5 + Math.sin(t) * amp;
  this.pawFR.rotation.x = Math.cos(t) * Math.PI / 4;
  this.pawFR.position.z = 6 - Math.cos(t) * amp * 2;
  
  // FRONT LEFT PAW
  this.pawFL.position.y = 1.5 + Math.sin(disp + t) * amp;
  this.pawFL.rotation.x = Math.cos(t) * Math.PI / 4;
  this.pawFL.position.z = 6 - Math.cos(disp + t) * amp * 2;
  
  // BACK RIGHT PAW
  this.pawBR.position.y = 1.5 + Math.sin(Math.PI + t) * amp;
  this.pawBR.rotation.x = Math.cos(t + Math.PI * 1.5) * Math.PI / 3;
  this.pawBR.position.z = -Math.cos(Math.PI + t) * amp;
  
  // BACK LEFT PAW
  this.pawBL.position.y = 1.5 + Math.sin(Math.PI + t) * amp;
  this.pawBL.rotation.x = Math.cos(t + Math.PI * 1.5) * Math.PI / 3;
  this.pawBL.position.z = -Math.cos(Math.PI + t) * amp;
};

Hero.prototype.jump = function(){
  if (this.status == "jumping") return;
  this.status = "jumping";
  var _this = this;
  var totalSpeed = 10 / speed;
  var jumpHeight = 45;
  
  TweenMax.to(this.earL.rotation, totalSpeed, { x: "+=.3", ease: Back.easeOut });
  TweenMax.to(this.earR.rotation, totalSpeed, { x: "-=.3", ease: Back.easeOut });
  
  TweenMax.to(this.pawFL.rotation, totalSpeed, { x: "+=.7", ease: Back.easeOut });
  TweenMax.to(this.pawFR.rotation, totalSpeed, { x: "-=.7", ease: Back.easeOut });
  TweenMax.to(this.pawBL.rotation, totalSpeed, { x: "+=.7", ease: Back.easeOut });
  TweenMax.to(this.pawBR.rotation, totalSpeed, { x: "-=.7", ease: Back.easeOut });
  
  TweenMax.to(this.tail.rotation, totalSpeed, { x: "+=1", ease: Back.easeOut });
  TweenMax.to(this.mouth.rotation, totalSpeed, { x: 0.5, ease: Back.easeOut });
  
  TweenMax.to(this.mesh.position, totalSpeed/2, { y: jumpHeight, ease: Power2.easeOut });
  TweenMax.to(this.mesh.position, totalSpeed/2, { y: 0, ease: Power4.easeIn, delay: totalSpeed/2, onComplete: function(){
    _this.status = "running";
  }});
};

Monster.prototype.run = function(){
  var s = Math.min(speed, maxSpeed);
  this.runningCycle += delta * s * 0.7;
  this.runningCycle %= (Math.PI * 2);
  var t = this.runningCycle;
  
  this.pawFR.rotation.x = Math.sin(t) * Math.PI / 4;
  this.pawFR.position.y = -5.5 - Math.sin(t);
  this.pawFR.position.z = 7.5 + Math.cos(t);
  
  this.pawFL.rotation.x = Math.sin(t + 0.4) * Math.PI / 4;
  this.pawFL.position.y = -5.5 - Math.sin(t + 0.4);
  this.pawFL.position.z = 7.5 + Math.cos(t + 0.4);
  
  this.pawBL.rotation.x = Math.sin(t + 2) * Math.PI / 4;
  this.pawBL.position.y = -5.5 - Math.sin(t + 3.8);
  this.pawBL.position.z = -7.5 + Math.cos(t + 3.8);
  
  this.pawBR.rotation.x = Math.sin(t + 2.4) * Math.PI / 4;
  this.pawBR.position.y = -5.5 - Math.sin(t + 3.4);
  this.pawBR.position.z = -7.5 + Math.cos(t + 3.4);
  
  this.torso.rotation.x = Math.sin(t) * Math.PI / 8;
  this.torso.position.y = 3 - Math.sin(t + Math.PI / 2) * 3;
  
  this.head.rotation.x = -0.1 + Math.sin(-t - 1) * 0.4;
  this.mouth.rotation.x = 0.2 + Math.sin(t + Math.PI + 0.3) * 0.4;
  
  this.tail.rotation.x = 0.2 + Math.sin(t - Math.PI / 2);
  
  this.eyeR.scale.y = 0.5 + Math.sin(t + Math.PI) * 0.5;
};

Hero.prototype.nod = function(){
  var _this = this;
  var sp = 0.5 + Math.random();
  var tHeadRotY = -Math.PI / 6 + Math.random() * Math.PI / 3;
  TweenMax.to(this.head.rotation, sp, { y: tHeadRotY, ease: Power4.easeInOut, onComplete: function(){ _this.nod(); } });
  
  var tEarLRotX = Math.PI / 4 + Math.random() * Math.PI / 6;
  var tEarRRotX = Math.PI / 4 + Math.random() * Math.PI / 6;
  TweenMax.to(this.earL.rotation, sp, { x: tEarLRotX, ease: Power4.easeInOut });
  TweenMax.to(this.earR.rotation, sp, { x: tEarRRotX, ease: Power4.easeInOut });
  
  var tPawBLRot = Math.random() * Math.PI / 2;
  var tPawBLY = -4 + Math.random() * 8;
  TweenMax.to(this.pawBL.rotation, sp / 2, { x: tPawBLRot, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  TweenMax.to(this.pawBL.position, sp / 2, { y: tPawBLY, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  
  var tPawBRRot = Math.random() * Math.PI / 2;
  var tPawBRY = -4 + Math.random() * 8;
  TweenMax.to(this.pawBR.rotation, sp / 2, { x: tPawBRRot, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  TweenMax.to(this.pawBR.position, sp / 2, { y: tPawBRY, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  
  var tPawFLRot = Math.random() * Math.PI / 2;
  var tPawFLY = -4 + Math.random() * 8;
  TweenMax.to(this.pawFL.rotation, sp / 2, { x: tPawFLRot, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  TweenMax.to(this.pawFL.position, sp / 2, { y: tPawFLY, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  
  var tPawFRRot = Math.random() * Math.PI / 2;
  var tPawFRY = -4 + Math.random() * 8;
  TweenMax.to(this.pawFR.rotation, sp / 2, { x: tPawFRRot, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  TweenMax.to(this.pawFR.position, sp / 2, { y: tPawFRY, ease: Power1.easeInOut, yoyo: true, repeat: 2 });
  
  var tMouthRot = Math.random() * Math.PI / 8;
  TweenMax.to(this.mouth.rotation, sp, { x: tMouthRot, ease: Power1.easeInOut });
  
  var tIrisY = -1 + Math.random() * 2;
  var tIrisZ = -1 + Math.random() * 2;
  var iris1 = this.iris;
  var iris2 = this.eyeR.children[0];
  TweenMax.to([iris1.position, iris2.position], sp, { y: tIrisY, z: tIrisZ, ease: Power1.easeInOut });
  
  if (Math.random() > 0.2) {
    TweenMax.to([this.eyeR.scale, this.eyeL.scale], sp / 8, { y: 0, ease: Power1.easeInOut, yoyo: true, repeat: 1 });
  }
};

Hero.prototype.hang = function(){
  var _this = this;
  var sp = 1;
  var ease = Power4.easeOut;
  
  TweenMax.killTweensOf(this.eyeL.scale);
  TweenMax.killTweensOf(this.eyeR.scale);
  
  this.body.rotation.x = 0;
  this.torso.rotation.x = 0;
  this.body.position.y = 0;
  this.torso.position.y = 7;
  
  TweenMax.to(this.mesh.rotation, sp, { y: 0, ease: ease });
  TweenMax.to(this.mesh.position, sp, { y: -7, z: 6, ease: ease });
  TweenMax.to(this.head.rotation, sp, { x: Math.PI/6, ease: ease, onComplete: function(){ _this.nod(); } });
  
  TweenMax.to(this.earL.rotation, sp, { x: Math.PI/3, ease: ease });
  TweenMax.to(this.earR.rotation, sp, { x: Math.PI/3, ease: ease });
  
  TweenMax.to(this.pawFL.position, sp, { y: -1, z: 3, ease: ease });
  TweenMax.to(this.pawFR.position, sp, { y: -1, z: 3, ease: ease });
  TweenMax.to(this.pawBL.position, sp, { y: -2, z: -3, ease: ease });
  TweenMax.to(this.pawBR.position, sp, { y: -2, z: -3, ease: ease });
  
  TweenMax.to(this.eyeL.scale, sp, { y: 1, ease: ease });
  TweenMax.to(this.eyeR.scale, sp, { y: 1, ease: ease });
};

Monster.prototype.nod = function(){
  var _this = this;
  var sp = 1 + Math.random() * 2;
  
  var tHeadRotY = -Math.PI/3 + Math.random() * 0.5;
  var tHeadRotX = Math.PI/3 - 0.2 + Math.random() * 0.4;
  TweenMax.to(this.head.rotation, sp, { x: tHeadRotX, y: tHeadRotY, ease: Power4.easeInOut, onComplete: function(){ _this.nod(); } });
  
  var tTailRotY = -Math.PI/4;
  TweenMax.to(this.tail.rotation, sp/8, { y: tTailRotY, ease: Power1.easeInOut, yoyo: true, repeat: 8 });
  
  TweenMax.to([this.eyeR.scale, this.eyeL.scale], sp/20, { y: 0, ease: Power1.easeInOut, yoyo: true, repeat: 1 });
};

Monster.prototype.sit = function(){
  var sp = 1.2;
  var ease = Power4.easeOut;
  var _this = this;
  TweenMax.to(this.torso.rotation, sp, { x: -1.3, ease: ease });
  TweenMax.to(this.torso.position, sp, { y: -5, ease: ease, onComplete: function(){
    _this.nod();
    gameStatus = "readyToReplay";
  }});
  
  TweenMax.to(this.head.rotation, sp, { x: Math.PI/3, y: -Math.PI/3, ease: ease });
  TweenMax.to(this.tail.rotation, sp, { x: 2, y: Math.PI/4, ease: ease });
  TweenMax.to(this.pawBL.rotation, sp, { x: -0.1, ease: ease });
  TweenMax.to(this.pawBR.rotation, sp, { x: -0.1, ease: ease });
  TweenMax.to(this.pawFL.rotation, sp, { x: 1, ease: ease });
  TweenMax.to(this.pawFR.rotation, sp, { x: 1, ease: ease });
  TweenMax.to(this.mouth.rotation, sp, { x: 0.3, ease: ease });
  TweenMax.to(this.eyeL.scale, sp, { y: 1, ease: ease });
  TweenMax.to(this.eyeR.scale, sp, { y: 1, ease: ease });
  
  TweenMax.to(this.head.rotation, sp, { y: 0, x: -0.3, ease: ease });
  TweenMax.to(hero.mesh.position, 2, { x: 20, ease: Power4.easeInOut });
  TweenMax.to(hero.head.rotation, 2, { x: 0, y: 0, ease: Power4.easeInOut });
  TweenMax.to(this.mouth.rotation, 2, { x: 0.2, ease: Power4.easeInOut });
  TweenMax.to(this.mouth.rotation, 1, { x: 0.4, ease: Power4.easeIn, delay: 1, onComplete: function(){
    resetGame();
  }});
};

Fir = function() {
  var height = 200;
  var truncGeom = new THREE.CylinderGeometry(2, 2, height, 6, 1);
  truncGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, height / 2, 0));
  this.mesh = new THREE.Mesh(truncGeom, greenMat);
  this.mesh.castShadow = true;
};

var firs = new THREE.Group();

function createFirs(){
  var nTrees = 100;
  for (var i = 0; i < nTrees; i++){
    var phi = i * (Math.PI * 2) / nTrees;
    var theta = Math.PI / 2;
    theta += (Math.random() > 0.05) ? (0.25 + Math.random() * 0.3) : (-0.35 - Math.random() * 0.1);
   
    var fir = new Tree();
    fir.mesh.position.x = Math.sin(theta) * Math.cos(phi) * floorRadius;
    fir.mesh.position.y = Math.sin(theta) * Math.sin(phi) * (floorRadius - 10);
    fir.mesh.position.z = Math.cos(theta) * floorRadius;
     
    var vec = fir.mesh.position.clone();
    var axis = new THREE.Vector3(0, 1, 0);
    fir.mesh.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
    floor.add(fir.mesh);
  }
}

function createCarrot(){
  carrot = new Carrot();
  scene.add(carrot.mesh);
}

function updateCarrotPosition(){
  carrot.mesh.rotation.y += delta * 6;
  carrot.mesh.rotation.z = Math.PI / 2 - (floorRotation + carrot.angle);
  carrot.mesh.position.y = -floorRadius + Math.sin(floorRotation + carrot.angle) * (floorRadius + 50);
  carrot.mesh.position.x = Math.cos(floorRotation + carrot.angle) * (floorRadius + 50);
}

function updateObstaclePosition(){
  if (obstacle.status == "flying") return;
  
  if (floorRotation + obstacle.angle > 2.5){
    obstacle.angle = -floorRotation + Math.random() * 0.3;
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  }
  
  obstacle.mesh.rotation.z = floorRotation + obstacle.angle - Math.PI / 2;
  obstacle.mesh.position.y = -floorRadius + Math.sin(floorRotation + obstacle.angle) * (floorRadius + 3);
  obstacle.mesh.position.x = Math.cos(floorRotation + obstacle.angle) * (floorRadius + 3);
}

function updateFloorRotation(){
  floorRotation += delta * 0.03 * speed;
  floorRotation %= (Math.PI * 2);
  floor.rotation.z = floorRotation;
}

function createObstacle(){
  obstacle = new Hedgehog();
  obstacle.body.rotation.y = -Math.PI / 2;
  obstacle.mesh.scale.set(1.1, 1.1, 1.1);
  obstacle.mesh.position.y = floorRadius + 4;
  obstacle.nod();
  scene.add(obstacle.mesh);
}

function createBonusParticles(){
  bonusParticles = new BonusParticles();
  bonusParticles.mesh.visible = false;
  scene.add(bonusParticles.mesh);
}

function checkCollision(){
  var db = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());
  
  if (db.length() < collisionBonus){
    getBonus();
  }
  
  if (dm.length() < collisionObstacle && obstacle.status != "flying"){
    getMalus();
  }
}

function getBonus(){
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI / 2;
  monsterPosTarget += 0.025;
}

function getMalus(){
  obstacle.status = "flying";
  var tx = (Math.random() > 0.5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, { x: Math.PI * 3, z: Math.PI * 3, y: Math.PI * 6, ease: Power4.easeOut, onComplete: function(){
    obstacle.status = "ready";
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
    obstacle.angle = -floorRotation - Math.random() * 0.4;
    obstacle.angle %= (Math.PI * 2);
    obstacle.mesh.rotation.x = 0;
    obstacle.mesh.rotation.y = 0;
    obstacle.mesh.rotation.z = 0;
    obstacle.mesh.position.z = 0;
  }});
  monsterPosTarget -= 0.04;
  TweenMax.from(this, 0.5, { malusClearAlpha: 0.5, onUpdate: function(){
    renderer.setClearColor(malusClearColor, malusClearAlpha);
  }});
}

function updateDistance(){
  distance += delta * speed;
  var d = distance / 2;
  fieldDistance.innerHTML = Math.floor(d);
}

function updateLevel(){
  if (speed >= maxSpeed) return;
  level++;
  speed += 2;
}

function loop(){
  delta = clock.getDelta();
  updateFloorRotation();
  
  if (gameStatus == "play"){
    if (hero.status == "running"){
      hero.run();
    }
    updateDistance();
    updateMonsterPosition();
    updateCarrotPosition();
    updateObstaclePosition();
    checkCollision();
  }
  
  render();
  requestAnimationFrame(loop);
}

function render(){
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);

function init(event){
  initScreenAnd3D();
  createLights();
  createFloor();
  createHero();
  createMonster();
  createFirs();
  createCarrot();
  createBonusParticles();
  createObstacle();
  initUI();
  resetGame();
  loop();
  //setInterval(hero.blink.bind(hero), 3000);
}

function resetGame(){
  scene.add(hero.mesh);
  hero.mesh.rotation.y = Math.PI / 2;
  hero.mesh.position.set(0, 0, 0);
  
  monsterPos = 0.56;
  monsterPosTarget = 0.65;
  speed = initSpeed;
  level = 0;
  distance = 0;
  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
  gameStatus = "play";
  hero.status = "running";
  hero.nod();
  audio.play();
  updateLevel();
  levelInterval = setInterval(updateLevel, levelUpdateFreq);
}

function initUI(){
  fieldDistance = document.getElementById("distValue");
  fieldGameOver = document.getElementById("gameoverInstructions");
}

////////////////////////////////////////////////
// MODELS
////////////////////////////////////////////////

// TREE
Tree = function(){
  this.mesh = new THREE.Object3D();
  this.trunc = new Trunc();
  this.mesh.add(this.trunc.mesh);
};

Trunc = function(){
  var truncHeight = 50 + Math.random() * 150;
  var topRadius = 1 + Math.random() * 5;
  var bottomRadius = 5 + Math.random() * 5;
  var mats = [blackMat, brownMat, pinkMat, whiteMat, greenMat, lightBrownMat, pinkMat];
  var matTrunc = blackMat; // or choose randomly
  var nhSegments = 3;
  var nvSegments = 3;
  var geom = new THREE.CylinderGeometry(topRadius, bottomRadius, truncHeight, nhSegments, nvSegments);
  geom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, truncHeight / 2, 0));
  
  this.mesh = new THREE.Mesh(geom, matTrunc);
  
  for (var i = 0; i < geom.vertices.length; i++){
    var noise = Math.random();
    var v = geom.vertices[i];
    v.x += -noise + Math.random() * noise * 2;
    v.y += -noise + Math.random() * noise * 2;
    v.z += -noise + Math.random() * noise * 2;
    geom.computeVertexNormals();
    
    // FRUITS
    if (Math.random() > 0.7){
      var size = Math.random() * 3;
      var fruitGeometry = new THREE.BoxGeometry(size, size, size, 1, 1, 1);
      var matFruit = mats[Math.floor(Math.random() * mats.length)];
      var fruit = new THREE.Mesh(fruitGeometry, matFruit);
      fruit.position.set(v.x, v.y + 3, v.z);
      fruit.rotation.x = Math.random() * Math.PI;
      fruit.rotation.y = Math.random() * Math.PI;
      this.mesh.add(fruit);
    }
    
    // BRANCHES
    if (Math.random() > 0.5 && v.y > 10 && v.y < truncHeight - 10){
      var h = 3 + Math.random() * 5;
      var thickness = 0.2 + Math.random();
      var branchGeometry = new THREE.CylinderGeometry(thickness / 2, thickness, h, 3, 1);
      branchGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, h / 2, 0));
      var branch = new THREE.Mesh(branchGeometry, matTrunc);
      branch.position.set(v.x, v.y, v.z);
      var vec = new THREE.Vector3(v.x, 2, v.z);
      var axis = new THREE.Vector3(0, 1, 0);
      branch.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
      this.mesh.add(branch);
    }
  }
  
  this.mesh.castShadow = true;
};

// END MODELS

// (Additional models for Carrot, Hedgehog, etc., should be updated similarly if needed.)
// In the code provided, Carrot and Hedgehog are assumed to be updated in the same manner.

//
// If you have additional code for Carrot and Hedgehog that uses CubeGeometry, you must update those sections similarly.
// For example, if your Carrot constructor uses CylinderGeometry, that one may remain as is.
// The code below for Hedgehog is our version based on your paste:

Hedgehog = function() {
  this.angle = 0;
  this.status = "ready";
  this.mesh = new THREE.Group();
  var bodyGeom = new THREE.BoxGeometry(6, 6, 6, 1, 1, 1);
  this.body = new THREE.Mesh(bodyGeom, blackMat);
  
  var headGeom = new THREE.BoxGeometry(5, 5, 7, 1, 1, 1);
  this.head = new THREE.Mesh(headGeom, lightBrownMat);
  this.head.position.set(0, -0.5, 6);
  
  var noseGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5, 1, 1, 1);
  this.nose = new THREE.Mesh(noseGeom, blackMat);
  this.nose.position.set(0, 2, 4);
  
  var eyeGeom = new THREE.BoxGeometry(1, 3, 3, 1, 1, 1);
  this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
  this.eyeL.position.set(2.2, 0.8, -0.5);
  this.eyeL.castShadow = true;
  this.head.add(this.eyeL);
  
  var irisGeom = new THREE.BoxGeometry(0.5, 1, 1, 1, 1, 1);
  this.iris = new THREE.Mesh(irisGeom, blackMat);
  this.iris.position.set(0.5, 0.8, 0.8);
  this.eyeL.add(this.iris);
  
  this.eyeR = this.eyeL.clone();
  this.eyeR.children[0].position.x = -this.iris.position.x;
  this.eyeR.position.x = -this.eyeL.position.x;
  this.head.add(this.eyeR);
  
  var spikeGeom = new THREE.BoxGeometry(0.5, 2, 0.5, 1, 1, 1);
  spikeGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1, 0));
  for (var i = 0; i < 9; i++) {
    var row = i % 3;
    var col = Math.floor(i / 3);
    var sb = new THREE.Mesh(spikeGeom, blackMat);
    sb.rotation.x = -Math.PI/2 + (Math.PI/12 * row) - 0.5 + Math.random();
    sb.position.set(-2 + col * 2, -2 + row * 2, -3);
    this.body.add(sb);
    var st = new THREE.Mesh(spikeGeom, blackMat);
    st.position.set(-2 + row * 2, 3, -2 + col * 2);
    st.rotation.z = Math.PI/6 - (Math.PI/6 * row) - 0.5 + Math.random();
    this.body.add(st);
    
    var sr = new THREE.Mesh(spikeGeom, blackMat);
    sr.position.set(3, -2 + row * 2, -2 + col * 2);
    sr.rotation.z = -Math.PI/2 + (Math.PI/12 * row) - 0.5 + Math.random();
    this.body.add(sr);
    
    var sl = new THREE.Mesh(spikeGeom, blackMat);
    sl.position.set(-3, -2 + row * 2, -2 + col * 2);
    sl.rotation.z = Math.PI/2 - (Math.PI/12 * row) - 0.5 + Math.random();
    this.body.add(sl);
  }
  
  this.head.add(this.eyeR);
  
  var earGeom = new THREE.BoxGeometry(2, 2, 0.5, 1, 1, 1);
  this.earL = new THREE.Mesh(earGeom, lightBrownMat);
  this.earL.position.set(2.5, 2.5, -2.5);
  this.earL.rotation.z = -Math.PI/12;
  this.earL.castShadow = true;
  this.head.add(this.earL);
  
  this.earR = this.earL.clone();
  this.earR.position.x = -this.earL.position.x;
  this.earR.rotation.z = -this.earL.rotation.z;
  this.earR.castShadow = true;
  this.head.add(this.earR);
  
  var mouthGeom = new THREE.BoxGeometry(1, 1, 0.5, 1, 1, 1);
  this.mouth = new THREE.Mesh(mouthGeom, blackMat);
  this.mouth.position.set(0, -1.5, 3.5);
  this.head.add(this.mouth);
  
  this.mesh.add(this.body);
  this.body.add(this.head);
  this.head.add(this.nose);
  
  this.mesh.traverse(function(object) {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
};

Hedgehog.prototype.nod = function(){
  var _this = this;
  var sp = 0.1 + Math.random() * 0.5;
  var angle = -Math.PI/4 + Math.random() * Math.PI/2;
  TweenMax.to(this.head.rotation, sp, { y: angle, onComplete: function(){ _this.nod(); } });
};

function createHero() {
  hero = new Hero();
  hero.mesh.rotation.y = Math.PI/2;
  scene.add(hero.mesh);
  hero.nod();
}

function createMonster() {
  monster = new Monster();
  monster.mesh.position.z = 20;
  //monster.mesh.scale.set(1.2,1.2,1.2);
  scene.add(monster.mesh);
  updateMonsterPosition();
}

function updateMonsterPosition(){
  monster.run();
  monsterPosTarget -= delta * monsterAcceleration;
  monsterPos += (monsterPosTarget - monsterPos) * delta;
  if (monsterPos < 0.56){
    gameOver();
  }
  var angle = Math.PI * monsterPos;
  monster.mesh.position.y = -floorRadius + Math.sin(angle) * (floorRadius + 12);
  monster.mesh.position.x = Math.cos(angle) * (floorRadius + 15);
  monster.mesh.rotation.z = -Math.PI/2 + angle;
}

function gameOver(){
  fieldGameOver.className = "show";
  gameStatus = "gameOver";
  monster.sit();
  hero.hang();
  monster.heroHolder.add(hero.mesh);
  TweenMax.to(this, 1, { speed: 0 });
  TweenMax.to(camera.position, 3, { z: cameraPosGameOver, y: 60, x: -30 });
  carrot.mesh.visible = false;
  obstacle.mesh.visible = false;
  clearInterval(levelInterval);
}

function replay(){
  gameStatus = "preparingToReplay";
  fieldGameOver.className = "";
  
  TweenMax.killTweensOf(monster.pawFL.position);
  TweenMax.killTweensOf(monster.pawFR.position);
  TweenMax.killTweensOf(monster.pawBL.position);
  TweenMax.killTweensOf(monster.pawBR.position);
  
  TweenMax.killTweensOf(monster.pawFL.rotation);
  TweenMax.killTweensOf(monster.pawFR.rotation);
  TweenMax.killTweensOf(monster.pawBL.rotation);
  TweenMax.killTweensOf(monster.pawBR.rotation);
  
  TweenMax.killTweensOf(monster.tail.rotation);
  TweenMax.killTweensOf(monster.head.rotation);
  TweenMax.killTweensOf(monster.eyeL.scale);
  TweenMax.killTweensOf(monster.eyeR.scale);
  
  //TweenMax.killTweensOf(hero.head.rotation);
  monster.tail.rotation.y = 0;
  
  TweenMax.to(camera.position, 3, { z: cameraPosGame, x: 0, y: 30, ease: Power4.easeInOut });
  TweenMax.to(monster.torso.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.torso.position, 2, { y: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.pawFL.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.pawFR.rotation, 2, { x: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 2, { x: 0.5, ease: Power4.easeInOut });
  
  TweenMax.to(monster.head.rotation, 2, { y: 0, x: -0.3, ease: Power4.easeInOut });
  
  TweenMax.to(hero.mesh.position, 2, { x: 20, ease: Power4.easeInOut });
  TweenMax.to(hero.head.rotation, 2, { x: 0, y: 0, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 2, { x: 0.2, ease: Power4.easeInOut });
  TweenMax.to(monster.mouth.rotation, 1, { x: 0.4, ease: Power4.easeIn, delay: 1, onComplete: function(){
    resetGame();
  }});
}

Fir = function() {
  var height = 200;
  var truncGeom = new THREE.CylinderGeometry(2, 2, height, 6, 1);
  truncGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, height / 2, 0));
  this.mesh = new THREE.Mesh(truncGeom, greenMat);
  this.mesh.castShadow = true;
};

var firs = new THREE.Group();

function createFirs(){
  var nTrees = 100;
  for (var i = 0; i < nTrees; i++){
    var phi = i * (Math.PI * 2) / nTrees;
    var theta = Math.PI / 2;
    theta += (Math.random() > 0.05) ? (0.25 + Math.random() * 0.3) : (-0.35 - Math.random() * 0.1);
   
    var fir = new Tree();
    fir.mesh.position.x = Math.sin(theta) * Math.cos(phi) * floorRadius;
    fir.mesh.position.y = Math.sin(theta) * Math.sin(phi) * (floorRadius - 10);
    fir.mesh.position.z = Math.cos(theta) * floorRadius;
     
    var vec = fir.mesh.position.clone();
    var axis = new THREE.Vector3(0, 1, 0);
    fir.mesh.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
    floor.add(fir.mesh);
  }
}

function createCarrot(){
  carrot = new Carrot();
  scene.add(carrot.mesh);
}

function updateCarrotPosition(){
  carrot.mesh.rotation.y += delta * 6;
  carrot.mesh.rotation.z = Math.PI / 2 - (floorRotation + carrot.angle);
  carrot.mesh.position.y = -floorRadius + Math.sin(floorRotation + carrot.angle) * (floorRadius + 50);
  carrot.mesh.position.x = Math.cos(floorRotation + carrot.angle) * (floorRadius + 50);
}

function updateObstaclePosition(){
  if (obstacle.status == "flying") return;
  
  if (floorRotation + obstacle.angle > 2.5){
    obstacle.angle = -floorRotation + Math.random() * 0.3;
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
  }
  
  obstacle.mesh.rotation.z = floorRotation + obstacle.angle - Math.PI / 2;
  obstacle.mesh.position.y = -floorRadius + Math.sin(floorRotation + obstacle.angle) * (floorRadius + 3);
  obstacle.mesh.position.x = Math.cos(floorRotation + obstacle.angle) * (floorRadius + 3);
}

function updateFloorRotation(){
  floorRotation += delta * 0.03 * speed;
  floorRotation %= (Math.PI * 2);
  floor.rotation.z = floorRotation;
}

function createObstacle(){
  obstacle = new Hedgehog();
  obstacle.body.rotation.y = -Math.PI / 2;
  obstacle.mesh.scale.set(1.1, 1.1, 1.1);
  obstacle.mesh.position.y = floorRadius + 4;
  obstacle.nod();
  scene.add(obstacle.mesh);
}

function createBonusParticles(){
  bonusParticles = new BonusParticles();
  bonusParticles.mesh.visible = false;
  scene.add(bonusParticles.mesh);
}

function checkCollision(){
  var db = hero.mesh.position.clone().sub(carrot.mesh.position.clone());
  var dm = hero.mesh.position.clone().sub(obstacle.mesh.position.clone());
  
  if (db.length() < collisionBonus){
    getBonus();
  }
  
  if (dm.length() < collisionObstacle && obstacle.status != "flying"){
    getMalus();
  }
}

function getBonus(){
  bonusParticles.mesh.position.copy(carrot.mesh.position);
  bonusParticles.mesh.visible = true;
  bonusParticles.explose();
  carrot.angle += Math.PI / 2;
  monsterPosTarget += 0.025;
}

function getMalus(){
  obstacle.status = "flying";
  var tx = (Math.random() > 0.5) ? -20 - Math.random() * 10 : 20 + Math.random() * 5;
  TweenMax.to(obstacle.mesh.position, 4, { x: tx, y: Math.random() * 50, z: 350, ease: Power4.easeOut });
  TweenMax.to(obstacle.mesh.rotation, 4, { x: Math.PI * 3, z: Math.PI * 3, y: Math.PI * 6, ease: Power4.easeOut, onComplete: function(){
    obstacle.status = "ready";
    obstacle.body.rotation.y = Math.random() * Math.PI * 2;
    obstacle.angle = -floorRotation - Math.random() * 0.4;
    obstacle.angle %= (Math.PI * 2);
    obstacle.mesh.rotation.x = 0;
    obstacle.mesh.rotation.y = 0;
    obstacle.mesh.rotation.z = 0;
    obstacle.mesh.position.z = 0;
  }});
  monsterPosTarget -= 0.04;
  TweenMax.from(this, 0.5, { malusClearAlpha: 0.5, onUpdate: function(){
    renderer.setClearColor(malusClearColor, malusClearAlpha);
  }});
}

function updateDistance(){
  distance += delta * speed;
  var d = distance / 2;
  fieldDistance.innerHTML = Math.floor(d);
}

function updateLevel(){
  if (speed >= maxSpeed) return;
  level++;
  speed += 2;
}

function loop(){
  delta = clock.getDelta();
  updateFloorRotation();
  
  if (gameStatus == "play"){
    if (hero.status == "running"){
      hero.run();
    }
    updateDistance();
    updateMonsterPosition();
    updateCarrotPosition();
    updateObstaclePosition();
    checkCollision();
  }
  
  render();
  requestAnimationFrame(loop);
}

function render(){
  renderer.render(scene, camera);
}

window.addEventListener('load', init, false);

function init(event){
  initScreenAnd3D();
  createLights();
  createFloor();
  createHero();
  createMonster();
  createFirs();
  createCarrot();
  createBonusParticles();
  createObstacle();
  initUI();
  resetGame();
  loop();
  //setInterval(hero.blink.bind(hero), 3000);
}

function resetGame(){
  scene.add(hero.mesh);
  hero.mesh.rotation.y = Math.PI / 2;
  hero.mesh.position.set(0, 0, 0);
  
  monsterPos = 0.56;
  monsterPosTarget = 0.65;
  speed = initSpeed;
  level = 0;
  distance = 0;
  carrot.mesh.visible = true;
  obstacle.mesh.visible = true;
  gameStatus = "play";
  hero.status = "running";
  hero.nod();
  audio.play();
  updateLevel();
  levelInterval = setInterval(updateLevel, levelUpdateFreq);
}

function initUI(){
  fieldDistance = document.getElementById("distValue");
  fieldGameOver = document.getElementById("gameoverInstructions");
}

////////////////////////////////////////////////
// MODELS
////////////////////////////////////////////////

// TREE
Tree = function(){
  this.mesh = new THREE.Object3D();
  this.trunc = new Trunc();
  this.mesh.add(this.trunc.mesh);
};

Trunc = function(){
  var truncHeight = 50 + Math.random() * 150;
  var topRadius = 1 + Math.random() * 5;
  var bottomRadius = 5 + Math.random() * 5;
  var mats = [blackMat, brownMat, pinkMat, whiteMat, greenMat, lightBrownMat, pinkMat];
  var matTrunc = blackMat; // or choose randomly from mats
  var nhSegments = 3;
  var nvSegments = 3;
  var geom = new THREE.CylinderGeometry(topRadius, bottomRadius, truncHeight, nhSegments, nvSegments);
  geom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, truncHeight / 2, 0));
  
  this.mesh = new THREE.Mesh(geom, matTrunc);
  
  for (var i = 0; i < geom.vertices.length; i++){
    var noise = Math.random();
    var v = geom.vertices[i];
    v.x += -noise + Math.random() * noise * 2;
    v.y += -noise + Math.random() * noise * 2;
    v.z += -noise + Math.random() * noise * 2;
    geom.computeVertexNormals();
    
    // FRUITS
    if (Math.random() > 0.7){
      var size = Math.random() * 3;
      var fruitGeometry = new THREE.BoxGeometry(size, size, size, 1, 1, 1);
      var matFruit = mats[Math.floor(Math.random() * mats.length)];
      var fruit = new THREE.Mesh(fruitGeometry, matFruit);
      fruit.position.set(v.x, v.y + 3, v.z);
      fruit.rotation.x = Math.random() * Math.PI;
      fruit.rotation.y = Math.random() * Math.PI;
      this.mesh.add(fruit);
    }
    
    // BRANCHES
    if (Math.random() > 0.5 && v.y > 10 && v.y < truncHeight - 10){
      var h = 3 + Math.random() * 5;
      var thickness = 0.2 + Math.random();
      var branchGeometry = new THREE.CylinderGeometry(thickness / 2, thickness, h, 3, 1);
      branchGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, h / 2, 0));
      var branch = new THREE.Mesh(branchGeometry, matTrunc);
      branch.position.set(v.x, v.y, v.z);
      var vec = new THREE.Vector3(v.x, 2, v.z);
      var axis = new THREE.Vector3(0, 1, 0);
      branch.quaternion.setFromUnitVectors(axis, vec.clone().normalize());
      this.mesh.add(branch);
    }
  }
  
  this.mesh.castShadow = true;
};

// END MODELS

// (Any additional code for Carrot, Hedgehog, etc., should be similarly updated if originally using CubeGeometry; the above Hedgehog and BonusParticles constructors are our updated versions.)

// The remainder of the code remains unchanged.

