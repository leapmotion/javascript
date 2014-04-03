(function() {
  // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function getParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};
  var controller, cursor, initScene, stats;

  initScene = function(element) {
    var axis, pointLight;
    window.scene = new THREE.Scene();
    window.renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    element.appendChild(renderer.domElement);
    axis = new THREE.AxisHelper(5);
    scene.add(axis);
    scene.add(new THREE.AmbientLight(0x888888));
    pointLight = new THREE.PointLight(0xFFffff);
    pointLight.position = new THREE.Vector3(-20, 10, 0);
    pointLight.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(pointLight);
    window.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.fromArray([0, 3, 15]);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    window.controls = new THREE.TrackballControls(camera);
    scene.add(camera);
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      controls.handleResize();
      return renderer.render(scene, camera);
    }, false);
    return renderer.render(scene, camera);
  };

  initScene(document.body);

  stats = new Stats();

  stats.domElement.style.position = 'absolute';

  stats.domElement.style.left = '0px';

  stats.domElement.style.top = '0px';

  document.body.appendChild(stats.domElement);

  window.controller = controller = new Leap.Controller;

  controller.use('handHold').use('handEntry').use('screenPosition').use('riggedHand', {
    parent: scene,
    scale: getParam('scale'),
    positionScale: getParam('positionScale'),
    renderFn: function() {
      renderer.render(scene, camera);
      return controls.update();
    },
    materialOptions: {
      wireframe: getParam('wireframe')
    },
    dotsMode: getParam('dots'),
    stats: stats,
    camera: camera,
    boneLabels: function(boneMesh, leapHand) {
      if (boneMesh.name.indexOf('Finger_03') === 0) {
        return leapHand.pinchStrength;
      }
    },
    boneColors: function(boneMesh, leapHand) {
      if ((boneMesh.name.indexOf('Finger_0') === 0) || (boneMesh.name.indexOf('Finger_1') === 0)) {
        return {
          hue: 0.6,
          saturation: leapHand.pinchStrength
        };
      }
    }
  }).connect();

  if (getParam('screenPosition')) {
    cursor = document.createElement('div');
    cursor.style.width = '50px';
    cursor.style.height = '50px';
    cursor.style.position = 'absolute';
    cursor.style.zIndex = '10';
    cursor.style.backgroundColor = 'green';
    cursor.style.opacity = '0.8';
    cursor.style.color = 'white';
    cursor.style.fontFamily = 'curior';
    cursor.style.textAlign = 'center';
    cursor.innerHTML = "&lt;div&gt;";
    document.body.appendChild(cursor);
    controller.on('frame', function(frame) {
      var hand, handMesh, screenPosition;
      if (hand = frame.hands[0]) {
        handMesh = frame.hands[0].data('riggedHand.mesh');
        screenPosition = handMesh.screenPosition(hand.fingers[1].tipPosition, camera);
        cursor.style.left = screenPosition.x;
        return cursor.style.bottom = screenPosition.y;
      }
    });
  }

  if (getParam('spy')) {
    $.get('http://lm-007.herokuapp.com/record_json/brian', function(data) {
      var spy;
      spy = window.LeapUtils.record_controller(controller, 500);
      return spy.replay({
        frames: data.frames,
        loop: true,
        play_same_frames: true
      });
    });
  }

}).call(this);
