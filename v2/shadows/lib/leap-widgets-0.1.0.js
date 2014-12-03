// This is a 3d box, or 2d immersed surface
// This takes in a Leap Controller and is added to a scene, or
// Would be great to use RequireJS, but that's not set up for this project currently.
// This is an experimental class
// it does:
// - Handle resizing
// -  with visual affordances made from DOM
// - Moving
// - Mesh deformations
// - etc?
// there's very nothing in this class which cares if it is a box or a plane.

(function() {
  'use strict';

window.InteractablePlane = function(planeMesh, controller, options){
  this.options = options || {};
  this.options.cornerInteractionRadius || (this.options.cornerInteractionRadius = 20);
  this.options.resize !== undefined    || (this.options.resize  = false);
  this.options.moveX  !== undefined    || (this.options.moveX   = true );
  this.options.moveY  !== undefined    || (this.options.moveY   = true );
  this.options.moveZ  !== undefined    || (this.options.moveZ   = false );
  this.options.highlight  !== undefined|| (this.options.highlight = true); // this can be configured through this.highlightMesh

  this.mesh = planeMesh;

  if (!(controller instanceof Leap.Controller)) {
    throw "No Controller Given"
  }

  if (!controller.plugins.proximity){
    controller.use('proximity');
  }

  this.controller = controller;
  this.lastPosition = null;

  // set this to false to disable inertia and any hand interactions.
  this.interactable = true;

  // holds the difference (offset) between the intersection point in world space and the local position,
  // at the time of intersection.
  this.intersections = {}; //keyed by the string: hand.id + handPointIndex

  this.touched = false;

  // Usage: pass in an options hash of function(s) keyed x,y,and/or z
  // Functions will be called on every frame when the plane touched, with the new target coordinate in that dimension
  // The return value of the function will replace the coordinate passed in
  // e.g. plane.constrainMovement({y: function(y){ if (y > 0.04) return 0.04; return y; } });
  // Todo - it would be great to have a "bouncy constraint" option, which would act like the scroll limits on OSX
  this.movementConstraints = {};

  // If this is ever increased above one, that initial finger can not be counted when averaging position
  // otherwise, it causes jumpyness.
  this.fingersRequiredForMove = 1;

  this.tempVec3 = new THREE.Vector3;

  this.drag = 1 - 0.12;
  this.density = 1;
  this.mass = this.mesh.geometry.area() * this.density;
  this.k = this.mass;

  // Spring constant of a restoring force
  this.returnSpringK = null;
  this.force = new THREE.Vector3; // instantaneous force on a object.

  this.lastPosition = new THREE.Vector3;
  this.originalPosition = new THREE.Vector3;
  this.resetPosition();

  // keyed by handId-fingerIndex
  this.previousOverlap = {};

  if (this.options.resize){
    this.bindResize();
  }

  if (this.options.moveX || this.options.moveY){
    this.watchXYIntersection();
  }

  this.controller.on('frame', this.updatePosition.bind(this));

  if (this.options.highlight) this.bindHighlight();

};

window.InteractablePlane.prototype = {

  resetPosition: function(){

    this.lastPosition.copy(this.mesh.position);
    this.originalPosition.copy(this.mesh.position);

  },

  // This is analagous to your typical scroll event.
  travel: function(callback){
    this.on('travel', callback);
    return this;
  },

  // Toggles highlight on and off
  highlight: function(highlight) {
    if ( highlight !== undefined ) {
      this.highlightMesh.visible = highlight;
    }
    else {
      return this.highlightMesh.visible;
    }
  },

  bindHighlight: function(){

    this.highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.mesh.geometry.parameters.width+0.005, this.mesh.geometry.parameters.height+0.005),
      new THREE.MeshBasicMaterial({
        color: 0x81d41d
      })
    );
    this.mesh.add(this.highlightMesh);
    // todo - this should subtract the normal
    this.highlightMesh.position.set(0,0,-0.0001);
    this.highlightMesh.visible = false;

    this.touch(function(){
      if (!this.interactable) return;

      this.highlight(true);
    }.bind(this));

    this.release(function(){
      this.highlight(false);
    }.bind(this));

  },

  // This is analagous to your typical scroll event.
  touch: function(callback){
    this.on('touch', callback);
    return this
  },

  // This is analagous to your typical scroll event.
  release: function(callback){
    this.on('release', callback);
    return this
  },

  clearMovementConstraints: function(){
    this.movementConstraints = {};
  },

  // todo - handle rotations as well
  changeParent: function(newParent){
    var key;

    // Clean up so no jump
    for (key in this.intersections){
      delete this.intersections[key];
    }

    this.mesh.position.add( this.mesh.parent.position ); // should be the diff between the old and new parent world positions
    this.lastPosition.copy(this.mesh.position);  // reset velocity (!)
    this.originalPosition.copy(this.mesh.position);

    this.mesh.parent.remove(this.mesh);
    newParent.add(this.mesh);

    console.assert(this.mesh.position); // would fail if this is called with no intersections.
  },

  // Returns the position of the mesh intersected
  // If position is passed in, sets it.
  getPosition: function(position){
    var newPosition = position || new THREE.Vector3, intersectionCount = 0;

    for ( var intersectionKey in this.intersections ){
      if( this.intersections.hasOwnProperty(intersectionKey) ){

        intersectionCount++;

        newPosition.add(
          this.moveProximity.intersectionPoints[intersectionKey].clone().sub(
            this.intersections[intersectionKey]
          )
        )

      }
    }

    // todo - experiment with spring physics, like what's seen in beer-pong
    if ( intersectionCount < this.fingersRequiredForMove) {

      newPosition.copy(this.mesh.position);

    } else {

      newPosition.divideScalar(intersectionCount);

    }


    return newPosition;
  },

  // Takes each of five finger tips
  // stores which side they are on, if any
  // If a finger tip moves through the mesh, moves the mesh accordingly
  // If two fingers fight.. rotate the mesh?
  // Rotation could be interesting, as it would mean that the x/y/z translation functions should
  // be updated, to compensate for the mesh's rotation
  // This would probably work pretty well for flat planes. Not sure about other stuff. (e.g., 3d models which may
  // need a base rotation. Perhaps they could be childs of a plane).
  calcZForce: function(hands){

    var hand, finger, key, overlap, overlapPoint, sumPushthrough = 0;

    // todo, make sure there's no frame lag in matrixWorld
    // (corners may be updated matrix world, causing this to coincidentally work)
    var inverseMatrix = (new THREE.Matrix4).getInverse(this.mesh.matrixWorld); // memoize

    for (var i = 0; i < hands.length; i++) {
      hand = hands[i];

      for (var j = 0; j < 5; j++) {
        finger = hand.fingers[j];
        key = hand.id + "-" + j;

        overlapPoint = this.mesh.pointOverlap(
          (new THREE.Vector3).fromArray(
            finger.tipPosition
          ),
          inverseMatrix
        );

        overlap = (overlapPoint && overlapPoint.z);

        if (overlap && this.previousOverlap[key] &&
           overlap * this.previousOverlap[key] < 0 // not same sign, therefore pushthrough
        ){

          sumPushthrough += overlap;

        }

        // Don't allow changing sign, only allow setting sign/value, or unsetting/nulling it
        if ( !overlap || !this.previousOverlap[key] )this.previousOverlap[key] = overlap;

      }

    }

    this.force.z += this.k * sumPushthrough;

    // note that there can still be significant high-frequency oscillation for large values of returnSpringK.
    // This probably mean that we just shouldn't support high-k (as a real-world material may fracture).
    if ( this.returnSpringK ){

      var springDisplacement = this.mesh.position.clone().sub(this.originalPosition);

      this.force.add(
        springDisplacement.multiplyScalar( - this.returnSpringK )
      )

    }

  },

  // On a frame where there's no interaction, run the physics engine
  // does spring return and velocity
  stepPhysics: function(newPosition){
    // inertia
    // simple verlet integration
    newPosition.subVectors(this.mesh.position, this.lastPosition);

    newPosition.add( this.force.divideScalar(this.mass) );
    this.force.set(0,0,0);

    newPosition.multiplyScalar(this.drag);

    newPosition.add(this.mesh.position);

  },

  watchXYIntersection: function(){

    // for every 2 index, we want to add (4 - 2).  That will equal the boneMesh index.
    // not sure if there is a clever formula for the following array:
    var indexToBoneMeshIndex = [0,1,2,3, 0,1,2,3, 0,1,2,3, 0,1,2,3, 0,1,2,3];

    var setBoneMeshColor = function(hand, index, color){

      // In `index / 2`, `2` is the number of joints per hand we're looking at.
      var meshes = hand.fingers[ Math.floor(index / 4) ].data('boneMeshes');

      if (!meshes) return;

      meshes[
        indexToBoneMeshIndex[index]
      ].material.color.setHex(color)

    };

    // we use proximity for x and y, raycasting for z
    // determine if line and place intersect
    // todo - rename to something that's not a mozilla method
    var proximity = this.moveProximity = this.controller.watch(
      this.mesh,
      this.interactiveEndBones
    );

    // this ties InteractablePlane to boneHand plugin - probably should have callbacks pushed out to scene.
    // happens on every frame before the 'frame' event handler below
    proximity.in( function(hand, intersectionPoint, key, index){
      //console.log('in', key);

      // Let's try out a one-way state machine
      // This doesn't allow intersections to count if I'm already pinching
      // So if they want to move after a pinch, they have to take hand out of picture and re-place.
      if (hand.data('resizing')) return;
      setBoneMeshColor(hand, index, 0xffffff);

      this.intersections[key] = intersectionPoint.clone().sub(this.mesh.position);

      if (!this.touched) {
        this.touched = true;
//        console.log('touch', this.mesh.name);
        this.emit('touch', this);
      }

    }.bind(this) );

    proximity.out( function(hand, intersectionPoint, key, index){
      //console.log('out', key);

//      setBoneMeshColor(hand, index, 0x222222);
      setBoneMeshColor(hand, index, 0xffffff);

      for ( var intersectionKey in this.intersections ){

        if (intersectionKey === key){
          delete this.intersections[intersectionKey];
          break;
        }

      }

      // not sure why, but sometimes getting multiple 0 proximity release events
      if (proximity.intersectionCount() == 0 && this.touched) {
        this.touched = false;
//        console.log('release', this.mesh.name, proximity.intersectionCount());
        this.emit('release', this);
      }

    }.bind(this) );

  },

  // 1: count fingertips past zplace
  // 2: when more than 4, scroll
  // 3: when more than 5, move
  // 4: test/optimize with HMD.
  // note: this is begging for its own class (see all the local methods defined in the constructor??)
  updatePosition: function(frame){
    if (!this.interactable) return false;

    this.tempVec3.set(0,0,0);
    var moveX = false, moveY = false, moveZ = false, newPosition = this.tempVec3;
    this.force.set(0,0,0);

    if (this.options.moveX || this.options.moveY){

      this.getPosition( newPosition );

    } else {

      newPosition.copy(this.mesh.position)

    }

    if (this.options.moveZ){

      // add force to instantaneous velocity (position delta) divided by mass
      // eventually, x and y should be converted to this as well.
      this.calcZForce(frame.hands);

    }

    if ( newPosition.equals( this.mesh.position ) ) {

      // there's been no change, give it up to inertia, forces, and springs
      // Todo - intera/physics stepping should probably take place on frame end, not on frame.
      this.stepPhysics(newPosition);

    }

    this.lastPosition.copy(this.mesh.position);

    // constrain movement to...
    // for now, let's discard z.
    // better:
    // Always move perpendicular to image normal
    // Then set normal equal to average of intersecting line normals
    // (Note: this will require some thought with grab.  Perhaps get carpal intersection, stop re-adjusting angle.)
    // (Note: can't pick just any face normal, so that we can distort the mesh later on.
    // This will allow (but hopefully not require?) expertise to use.

    if (this.options.moveX ){

      if (this.movementConstraints.x){
        newPosition.x = this.movementConstraints.x(newPosition.x);
      }

      if (newPosition.x != this.mesh.position.x){
        this.mesh.position.x = newPosition.x;
        moveX = true;
      }

    }

    if (this.options.moveY ){

      if (this.movementConstraints.y){
        newPosition.y = this.movementConstraints.y(newPosition.y);
      }

      if (newPosition.y != this.mesh.position.y){
        this.mesh.position.y = newPosition.y;
        moveY = true;
      }

    }

    if (this.options.moveZ ){

      if (this.movementConstraints.z){
        newPosition.z = this.movementConstraints.z(newPosition.z);
      }

      if (newPosition.z != this.mesh.position.z){
        this.mesh.position.z = newPosition.z;
        moveZ = true;
      }

    }


    // note - include moveZ here when implemented.
    if ( moveX || moveY || moveZ ) this.emit( 'travel', this, this.mesh );
  },

  bindResize: function(){

    var corners = this.mesh.geometry.corners();
    this.cornerMeshes = [];
    this.cornerProximities = [];
    var mesh, proximity;

    for (var i = 0; i < corners.length; i++) {

      this.cornerMeshes[i] = mesh = new THREE.Mesh(
        new THREE.SphereGeometry(this.options.cornerInteractionRadius, 32, 32),
        new THREE.MeshPhongMaterial({color: 0xffffff})
      );

      mesh.visible = false;
      mesh.name = "corner-" + i; // convenience

      var cornerXY = corners[i];
      mesh.position.set(cornerXY.x, cornerXY.y, 0); // hard coded for PlaneGeometry.. :-/

      this.mesh.add(mesh);

      this.cornerProximities[i] = proximity = this.controller.watch(
        mesh,
        this.cursorPoints
      ).in(
        function(hand, displacement, key, index){
          // test - this could be the context of the proximity.
          this.mesh.material.color.setHex(0x33ee22);
        }
      ).out(
        function(){
          this.mesh.material.color.setHex(0xffffff);
        }
      );

    }

    this.controller.on('hand',
      this.checkResizeProximity.bind(this)
    );

    // todo - make sure pinching on multiple corners is well-defined.  Should always take the closest one.
    // Right now it will always prefer the first-added Plane.
    this.controller.on('pinch', function(hand){

      var activeProximity, key = hand.id + '-0';

      for (var i = 0; i < this.cornerProximities.length; i++) {

        if (this.cornerProximities[i].states[key] === 'in') {
          activeProximity = this.cornerProximities[i];
          break;
        }

      }

      if (!activeProximity) return;

      if ( hand.data('resizing') ) return;

      hand.data('resizing', activeProximity);

    }.bind(this));

    this.controller.on('unpinch', function(hand){
      if (!hand.data('resizing')) return;

      hand.data('resizing', false);
    }.bind(this));
  },

  // Returns coordinates for the last two bones of every finger
  // Format: An array of tuples of ends
  // Order matters for our own use in this class
  // returns a collection of lines to be tested against
  // could be optimized to reuse vectors between frames
  interactiveEndBones: function(hand){
    var out = [], finger;

    for (var i = 0; i < 5; i++){
      finger = hand.fingers[i];

      if (i > 0){ // no thumb proximal
        out.push(
          [
            (new THREE.Vector3).fromArray(finger.proximal.nextJoint),
            (new THREE.Vector3).fromArray(finger.proximal.prevJoint)
          ]
        );
      }

      out.push(
        [
          (new THREE.Vector3).fromArray(finger.medial.nextJoint),
          (new THREE.Vector3).fromArray(finger.medial.prevJoint)
        ],
        [
          (new THREE.Vector3).fromArray(finger.distal.nextJoint),
          (new THREE.Vector3).fromArray(finger.distal.prevJoint)
        ]
      );

    }

    return out;
  },

  intersectionCount: function(){
    var i = 0;
    for (var key in this.intersections){
      i++
    }
    return i;
  },

  // This checks for intersection points before making self interactable
  // If there are any, it will wait for the plane to be untouched before becoming live again.
  // Note that this may need a little more tuning.  As it is right now, a touch/release may flicker, causing this to be
  // not safe enough. Thus leaving in console.logs for now.
  safeSetInteractable: function(interactable){

    if (!interactable) { this.interactable = false; return }

    if ( this.touched ){

      var callback = function(){

        this.interactable = true;
        this.removeListener('release', callback);

      }.bind(this);

      this.release(callback);

    } else {

      this.interactable = true;

    }

  },

  // could be optimized to reuse vectors between frames
  // used for resizing
  cursorPoints: function(hand){
    return [
      (new THREE.Vector3).fromArray(hand.palmPosition)
    ]
  },

  checkResizeProximity: function(hand){
    var targetProximity = hand.data('resizing'), inverseScale;

    if (!targetProximity) return;

    var cursorPosition = this.cursorPoints( hand )[0];

    for (var i = 0; i < this.cornerProximities.length; i++) {

      if ( targetProximity === this.cornerProximities[i] ){

        if (hand.data('pinchEvent.pinching')) {

          this.mesh.setCorner(i, cursorPosition);

          inverseScale = (new THREE.Vector3(1,1,1)).divide(this.mesh.scale);

          for (var j = 0; j < this.cornerProximities.length; j++){
            this.cornerMeshes[j].scale.copy(inverseScale);
          }


        } else {

          hand.data('resizing', false);

        }

      }

    }

  }

}

Leap._.extend(InteractablePlane.prototype, Leap.EventEmitter.prototype);

}).call(this);
// Never set the rotation of a button
// All units, such as throw, are designed to go in the negative Z
// Add it to a parent/pivot, and rotate that.
// alternatively, we could have it so that constraints themselves are transformed by mesh.matrix
// are there any potential cases where such a thing would be bad?
// - if the base shape had to be rotated to appear correct
// it would be nice to not have to wrap a button, just to rotate it.
// todo - dispatch click event
var PushButton = function(interactablePlane, options){
  'use strict';

  this.plane = interactablePlane;
  this.plane.returnSpringK = this.plane.mass / 25;
  this.plane.options.moveX = false;
  this.plane.options.moveY = false;
  this.plane.options.moveZ = true;

  this.options = options || (options = {});

  // A distinct "Pressed in/active" state.
  this.options.locking  !== undefined || (this.options.locking = true);

  // Todo - these should be a percentage of the button size, perhaps.
  this.longThrow  = -0.05;
  this.shortThrow = -0.03;

  this.pressed = false;
  this.canChangeState = true;
  this.plane.movementConstraints.z = this.releasedConstraint.bind(this);

  if (this.options.locking){
    this.bindLocking();
  }

};

PushButton.prototype.bindLocking = function(){

  this.on('press', function(){
    this.pressed = true;

    this.plane.movementConstraints.z = this.pressedConstraint.bind(this);

  }.bind(this));

  this.on('release', function(){
    this.pressed = false;

    this.plane.movementConstraints.z = this.releasedConstraint.bind(this);

  }.bind(this));

};


// todo - make these oriented in the direction plane normal
// returns the correct position
PushButton.prototype.releasedConstraint = function(z){
  var origZ = this.plane.originalPosition.z;

  if (z > origZ) {
    this.canChangeState = true;
    return origZ;
  }

  if (z < origZ + this.longThrow){
    if (!this.pressed && this.canChangeState){
      this.canChangeState = false;
      this.emit('press', this.plane.mesh);
    }
    return origZ + this.longThrow;
  }

  return z;

};

PushButton.prototype.pressedConstraint = function(z){
  var origZ = this.plane.originalPosition.z;

  if (z > origZ + this.shortThrow) {
    this.canRelease = true;
    return origZ + this.shortThrow;
  }

  if (z < origZ + this.longThrow){
    if (this.pressed && this.canRelease) {
      this.canRelease = false;
      this.emit('release', this.plane.mesh);
    }
    return origZ + this.longThrow;
  }

  return z;

};


Leap._.extend(PushButton.prototype, Leap.EventEmitter.prototype);

// Accepts a point in 3d space and a radius length

Leap.plugin('proximity', function(scope){
  'use strict';

  var proximities = [];

  var makeVector3 = function(p){
    if (p instanceof THREE.Vector3){
      return p;
    } else {
      return (new THREE.Vector3).fromArray(p)
    }
  };

  // Takes four vec3 points in global space
  // Returns a point or false.
  // http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
  var intersectionPointBetweenLines = function(l1a, l1b, l2a, l2b){

    // at this point, r and s are on the same plane. Might make sense to do the 2d solution here.
    var r = (new THREE.Vector3).subVectors(l1b, l1a);

    var s = (new THREE.Vector3).subVectors(l2b, l2a);

//    var rxs = r.cross(s);
    var rxs = ( r.x * s.y ) - ( r.y * s.x );


    console.assert(!isNaN(r.x));
    console.assert(!isNaN(r.y));
    console.assert(!isNaN(r.z));

    console.assert(!isNaN(s.x));
    console.assert(!isNaN(s.y));
    console.assert(!isNaN(s.z));

//    console.assert(!isNaN(rxs.x));
//    console.assert(!isNaN(rxs.y));
//    console.assert(!isNaN(rxs.z));

    // t = (q − p) × s / (r × s)
    var diff = l2a.clone().sub(l1a);

    var diffxs = ( diff.x * s.y ) - ( diff.y * s.x );
    var diffxr = ( diff.x * r.y ) - ( diff.y * r.x );

    var t = diffxs / rxs;
    var u = diffxr / rxs;

    if (isNaN(t)) return false;
    if (isNaN(u)) return false;

    if ( t < 0 || t > 1 ) return false;
    if ( u < 0 || u > 1 ) return false;

    return l1a.clone().add(
      r.multiplyScalar(t)
    );

  };

  // todo - not sure what happens with dynamic z.
  var testIntersectionPointBetweenLines = function(){

    var point;
    point = intersectionPointBetweenLines(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0.5,-1,0),
      new THREE.Vector3(0.5,1,0)
    );

    console.assert(point);
    console.assert(point.equals(new THREE.Vector3(0.5,0,0)));

    // nonintersecting
    point = intersectionPointBetweenLines(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,0.2,0),
      new THREE.Vector3(1,0.4,0)
    );

    console.assert(point === false);

    // nonintersecting with z
    point = intersectionPointBetweenLines(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,0.2,0),
      new THREE.Vector3(1,0.4,0.4)
    );

    console.assert(point === false);

    // past end of line a
    point = intersectionPointBetweenLines(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(1.5,-1,0),
      new THREE.Vector3(1.5,1,0)
    );

    console.assert(point === false);


    // past end of line b
    point = intersectionPointBetweenLines(
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0.5,-2,0),
      new THREE.Vector3(0.5,-1,0)
    );

    console.assert(point === false);

  };

  // accepts one option: mode
  // mode: 'points', the default, will be "in" when any of the points are within the mesh.
  //   Expects points to be vec3s from the origin.
  // mode:

  var Proximity = function(mesh, handPoints, options){
    setTimeout( // pop out of angular scope.
      function(){
        testIntersectionPointBetweenLines()
      },
      0
    );

    options || (options = {});
    this.options = options;

    this.mesh = mesh;
    this.handPoints = handPoints;

    // These are both keyed by the string: hand.id + handPointIndex
    this.states = {};
    this.intersectionPoints = {}; // checkLines: one for each handPoint.  Position in world space.

    // Similar to above, but also includes point on the plane, but not on the plane segment.
    // This is used for responding to between-frame motion
    this.possibleIntersectionPoints = {};

    this.distances = {}; // checkPoints: one for each handPoint
    this.lengths = {}; // checkPoints: one for each handPoint
  };

  Proximity.prototype = {

    intersectionCount: function() {
      var intersectionCount = 0, key;

      for ( key in this.intersectionPoints ){
        if( this.intersectionPoints.hasOwnProperty(key) ){
          intersectionCount++;
        }
      }

      return intersectionCount;
    },

    // unlike "over" events, we emit when "in" an object.
    in: function(callback){
      this.on('in', callback);
      return this
    },

    out: function(callback){
      this.on('out', callback);
      return this
    },

    check: function(hand){

      // Handles Spheres. Planes. Boxes? other shapes? custom shapes?

      var handPoints = this.handPoints(hand);

      // this class is designed to either checkLines or checkPoints, but not both
      // This should perhaps be split in to two classes, LineProximity and PointProximity.
      if (handPoints[0] instanceof Array){

        this.checkLines(hand, handPoints);

      }else {

        this.checkPoints(hand, handPoints);

      }

    },

    // There is an issue here where handPoints is not indexed per hand
    // check where index is used, refactor. oops.
    // test pictures and resizing.
    // Todo - this loop is giant, and should be split in to methods for compiler optimization.
    checkLines: function(hand, lines){
      var mesh = this.mesh, state, intersectionPoint, key;

      var worldPosition = (new THREE.Vector3).setFromMatrixPosition( this.mesh.matrixWorld );

      // j because this is inside a loop for every hand
      for (var j = 0; j < lines.length; j++){

        key = hand.id + '-' + j;

        intersectionPoint = mesh.intersectedByLine(lines[j][0], lines[j][1], worldPosition);

        var lastIntersectionPoint = this.possibleIntersectionPoints[key];

        // 1: store lastIntersectionPoint at all times
        // 2: only return values for good intersectionpoints from mesh.intersectedByLine
        // 3:  use it to tune intersectionpoint.
        // This works for both when the hand has entered the plane, and when it has passed through entirely.
        // TODO: there is currently an issue where multiple lines hit this condition in the same frame,
        // and they have disparate offset lengths
        // In that case, the foremost line should push the image, but what happens here and in InteractablePlane#getPosition
        // is the lines are averaged and then move the image
        // InteractablePlane should be aware of this adjustment (perhaps doing so itself)
        if ( this.states[key] === 'out' && intersectionPoint && lastIntersectionPoint ){

          // check all four edges,
          // take the one that actually has a cross
          // if two have a cross (e.g., the intersection travels completely through the place), get the minimum distance one

          // calc corners
          var corners = mesh.getWorldCorners();

          var minLenSq = Infinity;
          var closestEdgeIntersectionPoint = null;

          for (var i = 0; i < 4; i++){

            var point = intersectionPointBetweenLines(
              corners[i],
              corners[(i+1) % 4],
              lastIntersectionPoint,
              intersectionPoint
            );

            if (!point) continue;


            //console.assert(!isNaN(point.x));
            //console.assert(!isNaN(point.y));
            //console.assert(!isNaN(point.z));

            var lengthSq = (new THREE.Vector3).subVectors(point, lastIntersectionPoint).lengthSq();

//            console.log('edge #:', i, 'line #:', j, "distance:", Math.sqrt(lengthSq) );

            if (lengthSq < minLenSq){
              minLenSq = lengthSq;
              closestEdgeIntersectionPoint = point;
            }

          }

          if (closestEdgeIntersectionPoint) {

            //console.log('edge intersection', closestEdgeIntersectionPoint, "between", intersectionPoint, "and", lastIntersectionPoint);

            intersectionPoint = closestEdgeIntersectionPoint;

          }

        }

        // if there already was a valid intersection point,
        // And the new one is valid in z but off in x and y,
        // don't emit an out event.
        // This allows high-speed motions out.
        if ( !intersectionPoint && this.intersectionPoints[key] && mesh.intersectionPoint ) {

          //console.log('found newly lost intersection point');
          intersectionPoint = mesh.intersectionPoint

        }

        if (intersectionPoint){

          this.intersectionPoints[key] = intersectionPoint;

        } else if (this.intersectionPoints[key]) {

          delete this.intersectionPoints[key];

        }

        if (mesh.intersectionPoint){

          this.possibleIntersectionPoints[key] = mesh.intersectionPoint; // mesh.intersectionPoint may be on plane, but not segment.

        } else {

          delete this.possibleIntersectionPoints[key];

        }

        state = intersectionPoint ? 'in' : 'out';

        if ( (state == 'in' && this.states[key] !== 'in') || (state == 'out' && this.states[key] === 'in')){ // this logic prevents initial `out` events.
          this.emit(state, hand, intersectionPoint, key, j); // todo - could include intersection displacement vector here (!)
          this.states[key] = state;
        }

      }

    },

    checkPoints: function(hand, handPoints){
      var mesh = this.mesh, length, state,
        handPoint, meshWorldPosition = new THREE.Vector3,
        distance = new THREE.Vector3, key;

      if (! ( mesh.geometry instanceof THREE.SphereGeometry  ) ){
        console.error("Unsupported geometry", this.mesh.geometry);
        return
      }

      meshWorldPosition.setFromMatrixPosition( mesh.matrixWorld ); // note - this is last frame's position. Should be no problem.
//      console.assert(!isNaN(meshWorldPosition.x));
//      console.assert(!isNaN(meshWorldPosition.y));
//      console.assert(!isNaN(meshWorldPosition.z));

      for (var j = 0; j < handPoints.length; j++){

        key = hand.id + '-' + j;

        handPoint = makeVector3( handPoints[j] );
//        console.assert(!isNaN(handPoint.x));
//        console.assert(!isNaN(handPoint.y));
//        console.assert(!isNaN(handPoint.z));

        // subtract position from handpoint, compare to radius
        // optimization - could square lengths here.
        distance.subVectors(handPoint, meshWorldPosition);
        length = distance.length();
        this.distances[key] = distance;
        this.lengths[key]   = length;

        state = (length < mesh.geometry.parameters.radius) ? 'in' : 'out';

        if (state !== this.states[key]){
          this.emit(state, hand, distance, key, j);
          this.states[key] = state;
        }

      }

    },

    // loop through existing "in" states and emit "out" events.
    clear: function(hand){

      for ( var key in this.states ){
        if( this.states.hasOwnProperty(key) ){

          delete  this.states[key];
          delete  this.intersectionPoints[key];
          delete  this.lengths[key];
          delete  this.distances[key];
          this.emit('out', hand, null, key, parseInt(key.split('-')[1],10) );

        }
      }

    }

  };

  Leap._.extend(Proximity.prototype, Leap.EventEmitter.prototype);

  // can be a sphere or a plane.  Here we'll use an invisible sphere first
  // ideally, we would then emit events off of the object
  // Expects a THREE.js mesh
  // and a function which receives a hand and returns an array of points to check against
  // Returns an object which will emit events.
  // the in event is emitted for a handpoint entering the region
  // the out event is emitted for a handpoint exiting the region
  // note: this architecture is brittle to changing numbers of handPoints.
  this.watch = function(mesh, handPoints){
    console.assert(mesh);
    console.assert(handPoints);
    console.assert(typeof handPoints === 'function');

    var proximity = new Proximity(mesh, handPoints);

    proximities.push(proximity);

    return proximity;
  };

  this.on('handLost', function(hand){

    for (var i = 0; i < proximities.length; i++){
      proximities[i].clear(hand);
    }

  });

  // After setting up a proximity to watch, you can watch for events like so:
  // controller
  //   .watch(myMesh, myPointGetterFunction)
  //   .in(function(index, displacement, fraction){
  //
  //   });
  // Where
  //  - index is the index of the point returned by myPointGetterFunction for which we are responding
  //  - displacement is the THREE.Vector3 from hand point to the mesh.  (Testing a new convention - always send arrows out of the hand, as that expresses intention.)
  //  - fraction is distanceToMeshCenter / meshRadius.


  return {

    // we call this on frame explicitly, rather than hand, so that calculations are done before 'frame' and 'hand' events
    // bound to elsewhere in the app.
    frame: function(frame){

      for (var i = 0; i < frame.hands.length; i++){

        for (var j = 0; j < proximities.length; j++){

          proximities[j].check(frame.hands[i]);

        }

      }

    }

  }
});
// Some custom extensions for THREE.js


(function() {
  'use strict';

// Returns the positions of all the corners of the box
// Uses CSS ordering conventions: CW from TL.  First front face corners, then back.
// http://stackoverflow.com/questions/15302603/three-js-get-the-4-corner-coordinates-of-a-cube
// returns the relative corner positions, unaffected by scale of the box.
THREE.BoxGeometry.prototype.corners = function(){
  this._corners || (this._corners = [
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3,
    new THREE.Vector3
  ]);

  var halfWidth  = this.parameters.width  / 2,
      halfHeight = this.parameters.height / 2,
      halfDepth  = this.parameters.depth  / 2;

  this._corners[0].set( - halfWidth, + halfHeight, + halfDepth);
  this._corners[1].set( + halfWidth, + halfHeight, + halfDepth);
  this._corners[2].set( + halfWidth, - halfHeight, + halfDepth);
  this._corners[3].set( - halfWidth, - halfHeight, + halfDepth);
  this._corners[4].set( - halfWidth, + halfHeight, - halfDepth);
  this._corners[5].set( + halfWidth, + halfHeight, - halfDepth);
  this._corners[6].set( + halfWidth, - halfHeight, - halfDepth);
  this._corners[7].set( - halfWidth, - halfHeight, - halfDepth);

  return this._corners

};

THREE.PlaneGeometry.prototype.corners = function(num){

  this._corners || (this._corners = [
    new THREE.Vector2,
    new THREE.Vector2,
    new THREE.Vector2,
    new THREE.Vector2
  ]);

  var halfWidth  = this.parameters.width  / 2,
      halfHeight = this.parameters.height / 2;

  this._corners[0].set( - halfWidth, + halfHeight);
  this._corners[1].set( + halfWidth, + halfHeight);
  this._corners[2].set( + halfWidth, - halfHeight);
  this._corners[3].set( - halfWidth, - halfHeight);

  if (!isNaN(num)){
    return this._corners[num]
  }else {
    return this._corners
  }

};

// Doesn't change any other corner positions
// scale is a factor of change in corner position, from the original corner position.
THREE.Mesh.prototype.setCorner = function(cornerNo, newCornerPosition, preserveAspectRatio){


  if (preserveAspectRatio){
    // See formulation:
    // https://s3.amazonaws.com/uploads.hipchat.com/28703/213121/yCBzmNgVxNCeqlU/scaling_box_from_corner.pdf
//    console.assert( (this.scale.x === this.scale.y) && (this.scale.y === this.scale.z) );

    var p0 = this.position,
      d = newCornerPosition,
      c = this.corners(cornerNo),
      r0 = this.scale.x;

    // test:
    d = c.clone().add(this.position);

    var q0 = p0.clone().sub(
      c.clone().multiplyScalar(r0)
    );

//    console.assert( !isNaN(q0.x) );

    // TODO: handle 0-division edge cases
    var t = - ( q0.dot(q0) - d.dot(d) + 2 * d.clone().sub(q0).dot(p0) ) /
                      (2 * ( d.clone().sub(q0).dot(c) ) );

//    console.assert( !isNaN(t) );

    var p = p0.clone().add( c.clone().multiplyScalar(t) );

    var r = q0.clone().sub(p0).length();
//    var r = q0.clone().sub(p0).divide(c).length();
//    var r = p0.clone().sub(q0).divide(c).length();


    console.log(p0, p);
    console.log(r0, r);

//    console.assert(r === r0);
//    console.assert(this.position.equals(p));

    this.position.copy(p);

    this.scale.set(r, r, r);

  }else {

    if (! (this.geometry instanceof THREE.PlaneGeometry)) {
      throw "Non planar geometries not currently supported";
      // Not that it would be too hard.  This originally supported Boxes as well, but they werent' necessary.
    }

    var c = this.geometry.corners(cornerNo);
    c = new THREE.Vector3(c.x, c.y,0.1); // hack in 0.1 to avoid divide by 0.

    // Formulation is here:
    // https://drive.google.com/file/d/0B7cqxyA6LUpUcmd5MWtfc2JULTg/view
    this.scale.copy(
      (
        (
          newCornerPosition.clone().sub(this.position).divide(c)
          ).add(this.scale)
        ).divideScalar(2)
    );

    // p'
    this.position.copy(
      newCornerPosition.clone().sub(
        this.scale.clone().multiply(c)
      )
    );

  }





};

// returns the absolute position in world space, factoring in scale, rotation, and position relative to parent.
THREE.Mesh.prototype.getWorldCorners = function(num){

  if (!isNaN(num)){

    return this.corners()[num]

  }else{

    var corners = this.geometry.corners();

    for (var i = 0; i < corners.length; i++){

      corners[i] = new THREE.Vector3( corners[i].x, corners[i].y, 0).applyMatrix4(this.matrixWorld);

    }

    return corners;

  }

};

}).call(this);


THREE.PlaneGeometry.prototype.area = function () {

  return this.parameters.height * this.parameters.width;

};

THREE.CircleGeometry.prototype.area = function () {

  return Math.pow(this.parameters.radius, 2) * Math.PI;

};
// Adds a method to THREE.Mesh which figures out if a line segment intersects it.

// http://en.wikipedia.org/wiki/Line-plane_intersection
// - calculate d (intersection point)
// - see if point is on line segment (add vectors A B C)
//   http://stackoverflow.com/questions/328107/how-can-you-determine-a-point-is-between-two-other-points-on-a-line-segment
// - see if point is on plane segment (dot product of vectors to corners should be positive)
//   http://stackoverflow.com/questions/9638064/check-if-a-point-is-inside-a-plane-segment
//   Sort of like ^^, we transform our four corners to a flat x,y space with the bottom left at 0,0,
//   and compare components of the point d (intersectionPoint)

// Returns the intersectionPoint is it is intersecting, in world space
// Returns false otherwise.
// Accepts an optional third parameter worldPosition, which should be used for nested objects.
// This is not calculated here for performance reasons.
THREE.Mesh.prototype.intersectedByLine = function(lineStart, lineEnd, worldPosition){

  this.lastIntersectionPoint || (this.lastIntersectionPoint = new THREE.Vector3);
  this.lastIntersectionPoint = this.intersectionPoint; // reference copy if object, value copy if null.

  var p0 = worldPosition || this.position; // note that this is local, which would be buggy for nested objects (!)
  var l0 = lineStart;
  // the normal of any face will be the normal of the plane.
  var n  = this.getWorldDirection();
  var l = lineEnd.clone().sub(lineStart);  // order shouldn't matter here.  And they didn't SAY normalize.

  var numerator = p0.clone().sub(l0).dot(n);
  var denominator = l.dot(n);

  if (numerator === 0){
    // no intersection or intersects everywhere.
    this.intersectionPoint = null;
    return false;
  }

  if (denominator === 0){
    // parallel
    this.intersectionPoint = null;
    return false;
  }

  var intersectionPoint = l.clone().multiplyScalar(numerator / denominator).add(l0);

  // see if point is on line segment (add vectors A B C)

  // a,b = lineEnds 1,2
  // c = interSectionPoint

  var dot = lineEnd.clone().sub(lineStart).dot(
    intersectionPoint.clone().sub(lineStart)
  );

  if (dot < 0) {
    this.intersectionPoint = null;
    return false;
  }

  var lengthSq = lineEnd.clone().sub(lineStart).lengthSq();

  if (dot > lengthSq) {
    this.intersectionPoint = null;
    return false;
  }

  // we're on the line segment!


  // store intersection point for later use, whether it's on the segment or not.
  // This will be useful for frame travel of farther than a plane half.
  this.intersectionPoint = intersectionPoint;

  return this.pointOverlap( intersectionPoint.clone() ) ? intersectionPoint : false;

};
// Returns the coordinates in local space of the point relative to the mesh.
// Returns undefined if not overlapping
// Does this by transforming both the point and the plane to flat space,
// and comparing x and y values
// mutates the input point
THREE.Mesh.prototype.pointOverlap = function(point, inverseMatrix){

  inverseMatrix || (inverseMatrix = (new THREE.Matrix4).getInverse(this.matrixWorld));

  return this.geometry.pointOverlap(
    point.applyMatrix4(inverseMatrix)
  )

};

THREE.PlaneGeometry.prototype.pointOverlap = function(point){

  var cornerPositions = this.corners();

  if ( cornerPositions[3].y < point.y &&
       point.y < cornerPositions[0].y &&
       cornerPositions[3].x < point.x &&
       point.x < cornerPositions[2].x ){

    return point;

  }

  // We return undefined here to explicitly prevent any math. (false or null == 0).
  return undefined;

};

// Note that this works so nicely because point has already had inverseMatrixWorld applied,
// Causing it to have a 0 origin. :-)
THREE.CircleGeometry.prototype.pointOverlap = function(point){

  return this.parameters.radius > point.length() ? point : undefined;

  // To get dish effect:
  //return this.parameters.radius > point.length() ? point.z + ((this.parameters.radius - point.length()) / 2 ) : undefined;

};