///////////////////////
// HELPER FUNCTIONS  //
///////////////////////

// Create a Box geometry (replacement for CubeGeometry)
// This function generates a BufferGeometry then converts it to a Geometry so you can modify vertices.
function createBoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments) {
    var bufferGeom = new THREE.BoxGeometry(width, height, depth, widthSegments || 1, heightSegments || 1, depthSegments || 1);
    var geom = new THREE.Geometry().fromBufferGeometry(bufferGeom);
    geom.mergeVertices();
    return geom;
  }
  
  // Create a Cylinder geometry and convert to Geometry (if you need to modify vertices)
  function createCylinderGeometry(topRadius, bottomRadius, height, radialSegments, heightSegments) {
    var bufferGeom = new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments || 8, heightSegments || 1);
    var geom = new THREE.Geometry().fromBufferGeometry(bufferGeom);
    geom.mergeVertices();
    return geom;
  }
  
  /////////////////////////
  // GLOBAL VARIABLES   //
  /////////////////////////
  
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
  
  var HEIGHT, WIDTH, windowHalfX, windowHalfY,
      mousePos = { x: 0, y: 0 };
  
  var hero; // 3D object
  
  // Materials
  var blackMat = new THREE.MeshPhongMaterial({
    color: 0x100707,
    shading: THREE.FlatShading
  });
  var brownMat = new THREE.MeshPhongMaterial({
    color: 0xb44b39,
    shininess: 0,
    shading: THREE.FlatShading
  });
  var greenMat = new THREE.MeshPhongMaterial({
    color: 0x7abf8e,
    shininess: 0,
    shading: THREE.FlatShading
  });
  var pinkMat = new THREE.MeshPhongMaterial({
    color: 0xdc5f45,
    shininess: 0,
    shading: THREE.FlatShading
  });
  var lightBrownMat = new THREE.MeshPhongMaterial({
    color: 0xe07a57,
    shading: THREE.FlatShading
  });
  var whiteMat = new THREE.MeshPhongMaterial({
    color: 0xa49789,
    shading: THREE.FlatShading
  });
  var skinMat = new THREE.MeshPhongMaterial({
    color: 0xff9ea5,
    shading: THREE.FlatShading
  });
  
  var PI = Math.PI;
  
  //////////////////////////////
  // INIT & EVENT HANDLERS    //
  //////////////////////////////
  
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
  
    // Uncomment if using OrbitControls:
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
  
  ////////////////////
  // HERO           //
  ////////////////////
  
  Hero = function() {
    this.status = "running";
    this.runningCycle = 0;
    this.mesh = new THREE.Group();
    this.body = new THREE.Group();
    this.mesh.add(this.body);
  
    // Torso
    var torsoGeom = createBoxGeometry(7, 7, 10, 1);
    this.torso = new THREE.Mesh(torsoGeom, brownMat);
    this.torso.position.set(0, 7, 0);
    this.torso.castShadow = true;
    this.body.add(this.torso);
  
    // Pants
    var pantsGeom = createBoxGeometry(9, 9, 5, 1);
    this.pants = new THREE.Mesh(pantsGeom, whiteMat);
    this.pants.position.set(0, 0, -3);
    this.pants.castShadow = true;
    this.torso.add(this.pants);
  
    // Tail
    var tailGeom = createBoxGeometry(3, 3, 3, 1);
    tailGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -2));
    this.tail = new THREE.Mesh(tailGeom, lightBrownMat);
    this.tail.position.set(0, 5, -4);
    this.tail.castShadow = true;
    this.torso.add(this.tail);
  
    this.torso.rotation.x = -Math.PI / 8;
  
    // Head
    var headGeom = createBoxGeometry(10, 10, 13, 1);
    headGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 7.5));
    this.head = new THREE.Mesh(headGeom, brownMat);
    this.head.position.set(0, 11, 2);
    this.head.castShadow = true;
    this.body.add(this.head);
  
    // Cheeks
    var cheekGeom = createBoxGeometry(1, 4, 4, 1);
    this.cheekR = new THREE.Mesh(cheekGeom, pinkMat);
    this.cheekR.position.set(-5, -2.5, 7);
    this.cheekR.castShadow = true;
    this.head.add(this.cheekR);
  
    this.cheekL = this.cheekR.clone();
    this.cheekL.position.x = -this.cheekR.position.x;
    this.head.add(this.cheekL);
  
    // Nose
    var noseGeom = createBoxGeometry(6, 6, 3, 1);
    this.nose = new THREE.Mesh(noseGeom, lightBrownMat);
    this.nose.position.set(0, 2.6, 13.5);
    this.nose.castShadow = true;
    this.head.add(this.nose);
  
    // Mouth
    var mouthGeom = createBoxGeometry(4, 2, 4, 1);
    mouthGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 3));
    mouthGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 12));
    this.mouth = new THREE.Mesh(mouthGeom, brownMat);
    this.mouth.position.set(0, -4, 8);
    this.mouth.castShadow = true;
    this.head.add(this.mouth);
  
    // Front paws
    var pawFGeom = createBoxGeometry(3, 3, 3, 1);
    this.pawFR = new THREE.Mesh(pawFGeom, lightBrownMat);
    this.pawFR.position.set(-2, 1.5, 6);
    this.pawFR.castShadow = true;
    this.body.add(this.pawFR);
  
    this.pawFL = this.pawFR.clone();
    this.pawFL.position.x = -this.pawFR.position.x;
    this.pawFL.castShadow = true;
    this.body.add(this.pawFL);
  
    // Back paws
    var pawBGeom = createBoxGeometry(3, 3, 6, 1);
    this.pawBL = new THREE.Mesh(pawBGeom, lightBrownMat);
    this.pawBL.position.set(5, 1.5, 0);
    this.pawBL.castShadow = true;
    this.body.add(this.pawBL);
  
    this.pawBR = this.pawBL.clone();
    this.pawBR.position.x = -this.pawBL.position.x;
    this.pawBR.castShadow = true;
    this.body.add(this.pawBR);
  
    // Ears – Note: We use a box and then modify vertices.
    var earBuffer = createBoxGeometry(7, 18, 2, 1);
    // Since we need to modify vertices manually, we work on the Geometry version:
    var earGeom = earBuffer;
    // Modify vertices as in the old code:
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
    this.earL.rotation.z = -Math.PI / 12;
    this.earL.castShadow = true;
    this.head.add(this.earL);
  
    this.earR = this.earL.clone();
    this.earR.position.x = -this.earL.position.x;
    this.earR.rotation.z = -this.earL.rotation.z;
    this.earR.castShadow = true;
    this.head.add(this.earR);
  
    // Eyes
    var eyeGeom = createBoxGeometry(2, 4, 4, 1);
    this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
    this.eyeL.position.set(5, 2.9, 5.5);
    this.eyeL.castShadow = true;
    this.head.add(this.eyeL);
  
    var irisGeom = createBoxGeometry(0.6, 2, 2, 1);
    this.iris = new THREE.Mesh(irisGeom, blackMat);
    this.iris.position.set(1.2, 1, 1);
    this.eyeL.add(this.iris);
  
    this.eyeR = this.eyeL.clone();
    // Adjust the child iris position:
    this.eyeR.children[0].position.x = -this.iris.position.x;
    this.eyeR.position.x = -this.eyeL.position.x;
    this.head.add(this.eyeR);
  
    // Ensure all meshes cast and receive shadows:
    this.body.traverse(function(object) {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  };
  
  ////////////////////
  // BONUS PARTICLES
  ////////////////////
  
  BonusParticles = function(){
    this.mesh = new THREE.Group();
    var bigParticleGeom = createBoxGeometry(10, 10, 10, 1);
    var smallParticleGeom = createBoxGeometry(5, 5, 5, 1);
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
  };
  
  ////////////////////
  // HERO METHODS
  ////////////////////
  
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
  
  ////////////////////////
  // MONSTER METHODS    //
  ////////////////////////
  
  Monster = function(){
    this.runningCycle = 0;
    this.mesh = new THREE.Group();
    this.body = new THREE.Group();
    
    var torsoGeom = createBoxGeometry(15, 15, 20, 1);
    this.torso = new THREE.Mesh(torsoGeom, blackMat);
    
    var headGeom = createBoxGeometry(20, 20, 40, 1);
    headGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0,0,20));
    this.head = new THREE.Mesh(headGeom, blackMat);
    this.head.position.set(0, 2, 12);
    
    var mouthGeom = createBoxGeometry(10, 4, 20, 1);
    mouthGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0,-2,10));
    this.mouth = new THREE.Mesh(mouthGeom, blackMat);
    this.mouth.position.set(0, -8, 4);
    this.mouth.rotation.x = 0.4;
    
    this.heroHolder = new THREE.Group();
    this.heroHolder.position.set(0, 0, 20);
    this.mouth.add(this.heroHolder);
    
    var toothGeom = createBoxGeometry(2, 2, 1, 1);
    toothGeom.vertices[1].x -= 1;
    toothGeom.vertices[4].x += 1;
    toothGeom.vertices[5].x += 1;
    toothGeom.vertices[0].x -= 1;
    
    for (var i = 0; i < 3; i++){
      var toothf = new THREE.Mesh(toothGeom, whiteMat);
      toothf.position.set(-2.8 + i * 2.5, 1, 19);
      
      var toothl = new THREE.Mesh(toothGeom, whiteMat);
      toothl.rotation.y = Math.PI / 2;
      toothl.position.set(4, 1, 12 + i * 2.5);
      
      var toothr = toothl.clone();
      toothl.position.x = -4;
      
      this.mouth.add(toothf);
      this.mouth.add(toothl);
      this.mouth.add(toothr);
    }
    
    var tongueGeometry = createBoxGeometry(6, 1, 14, 1);
    tongueGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 7));
    this.tongue = new THREE.Mesh(tongueGeometry, pinkMat);
    this.tongue.position.set(0, 0, 2);
    this.tongue.rotation.x = -0.2;
    this.mouth.add(this.tongue);
    
    var noseGeom = createBoxGeometry(4, 4, 4, 1);
    this.nose = new THREE.Mesh(noseGeom, pinkMat);
    this.nose.position.set(0, 9, 39.5);
    this.head.add(this.nose);
    
    this.head.add(this.mouth);
    
    var eyeGeom = createBoxGeometry(2, 3, 3, 1);
    this.eyeL = new THREE.Mesh(eyeGeom, whiteMat);
    this.eyeL.position.set(10, 5, 5);
    this.eyeL.castShadow = true;
    this.head.add(this.eyeL);
    
    var irisGeom = createBoxGeometry(0.6, 1, 1, 1);
    this.iris = new THREE.Mesh(irisGeom, blackMat);
    this.iris.position.set(1.2, -1, 1);
    this.eyeL.add(this.iris);
    
    this.eyeR = this.eyeL.clone();
    this.eyeR.children[0].position.x = -this.iris.position.x;
    this.eyeR.position.x = -this.eyeL.position.x;
    this.head.add(this.eyeR);
    
    var earGeom = createBoxGeometry(8, 6, 2, 1);
    earGeom.vertices[1].x -= 4;
    earGeom.vertices[4].x += 4;
    earGeom.vertices[5].x += 4;
    earGeom.vertices[5].z -= 2;
    earGeom.vertices[0].x -= 4;
    earGeom.vertices[0].z -= 2;
    earGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 3, 0));
    
    this.earL = new THREE.Mesh(earGeom, blackMat);
    this.earL.position.set(6, 10, 1);
    this.earL.castShadow = true;
    this.head.add(this.earL);
    
    this.earR = this.earL.clone();
    this.earR.position.x = -this.earL.position.x;
    this.earR.rotation.z = -this.earL.rotation.z;
    this.head.add(this.earR);
    
    var eyeGeom2 = createBoxGeometry(2, 4, 4, 1);
    
    // Tail (using a Cylinder geometry – we convert to Geometry)
    var tailBuffer = new THREE.CylinderGeometry(5, 2, 20, 4, 1);
    var tailGeom = new THREE.Geometry().fromBufferGeometry(tailBuffer);
    tailGeom.mergeVertices();
    tailGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0));
    tailGeom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    tailGeom.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI/4));
    this.tail = new THREE.Mesh(tailGeom, blackMat);
    this.tail.position.set(0, 4, -10);
    this.torso.add(this.tail);
    
    // Paw: using Cylinder geometry for a tapered effect
    var pawBuffer = new THREE.CylinderGeometry(1.5, 0, 10, 1);
    var pawGeom = new THREE.Geometry().fromBufferGeometry(pawBuffer);
    pawGeom.mergeVertices();
    pawGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -5, 0));
    this.pawFL = new THREE.Mesh(pawGeom, blackMat);
    this.pawFL.position.set(5.5, -7.5, 8.5);
    this.torso.add(this.pawFL);
    
    this.pawFR = this.pawFL.clone();
    this.pawFR.position.x = -this.pawFL.position.x;
    this.torso.add(this.pawFR);
    
    this.pawBR = this.pawFR.clone();
    this.pawBR.position.z = -this.pawFL.position.z;
    this.torso.add(this.pawBR);
    
    this.pawBL = this.pawBR.clone();
    this.pawBL.position.x = this.pawFL.position.x;
    this.torso.add(this.pawBL);
    
    this.mesh.add(this.body);
    this.torso.add(this.head);
    this.body.add(this.torso);
    
    this.torso.castShadow = true;
    this.head.castShadow = true;
    this.pawFL.castShadow = true;
    this.pawFR.castShadow = true;
    this.pawBL.castShadow = true;
    this.pawBR.castShadow = true;
    
    this.body.rotation.y = Math.PI/2;
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
    this.torso.position.y = 3 - Math.sin(t + Math.PI/2) * 3;
    
    this.head.rotation.x = -0.1 + Math.sin(-t - 1) * 0.4;
    this.mouth.rotation.x = 0.2 + Math.sin(t + Math.PI + 0.3) * 0.4;
    
    this.tail.rotation.x = 0.2 + Math.sin(t - Math.PI/2);
    
    this.eyeR.scale.y = 0.5 + Math.sin(t + Math.PI) * 0.5;
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
  
  ////////////////////
  // FIR METHODS
  ////////////////////
  
  Fir = function() {
    var height = 200;
    var truncGeom = createCylinderGeometry(2, 2, height, 6, 1);
    truncGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, height/2, 0));
    this.mesh = new THREE.Mesh(truncGeom, greenMat);
    this.mesh.castShadow = true;
  };
  
  var firs = new THREE.Group();
  
  ////////////////////
  // GLOBAL LOOP &  //
  ////////////////////
  
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
  
  function updateFloorRotation(){
    floorRotation += delta * 0.03 * speed;
    floorRotation %= (Math.PI * 2);
    floor.rotation.z = floorRotation;
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
    hero.mesh.rotation.y = Math.PI/2;
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
  
  ////////////////////
  // MODELS         //
  ////////////////////
  
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
    var matTrunc = blackMat; // or random from mats
    var nhSegments = 3;
    var nvSegments = 3;
    var geom = createCylinderGeometry(topRadius, bottomRadius, truncHeight, nhSegments, nvSegments);
    
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
        var fruitGeometry = createBoxGeometry(size, size, size, 1);
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
        var branchGeom = createCylinderGeometry(thickness/2, thickness, h, 3, 1);
        branchGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, h/2, 0));
        var branch = new THREE.Mesh(branchGeom, matTrunc);
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
  
  // (Assume that if you have additional models such as Carrot and Hedgehog from your original file, they are updated in the same manner; the above Hedgehog and BonusParticles are our updated versions.)
  