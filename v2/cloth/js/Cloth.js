/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.1;

var GRAVITY = 981 * 1.4; //
var gravity = new THREE.Vector3( 0, -GRAVITY, 0 ).multiplyScalar(MASS); // note - this could/should be moved in to addForce. Probably out here for performance.

var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;

var colliders = [], numColliders = 50;

var ballGeo = new THREE.SphereGeometry( 20, 20, 20 );
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
var mesh;


for (var i = 0; i < numColliders; i++){
  mesh = new THREE.Mesh( ballGeo, ballMaterial );
  colliders.push( mesh )
}



var ballRadius = 20;

var lastTime;


function Particle(position, mass) {
	this.position         = position;
	this.lastPosition     = position.clone();
	this.originalPosition = position.clone();
	this.a = new THREE.Vector3(0, 0, 0); // acceleration
	this.mass = mass;
	this.tmp = new THREE.Vector3(); // wat
	this.tmp2 = new THREE.Vector3();
}

// Force -> Acceleration
Particle.prototype.addForce = function(force) {
	this.a.add(
		this.tmp2.copy(force)
	);
};


// Performs verlet integration
// instantaneous velocity times drag plus position plus acceleration times time
Particle.prototype.calcPosition = function(timesq) {
	var newPos = this.tmp.subVectors(this.position, this.lastPosition);
	newPos.multiplyScalar(DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));

	this.tmp = this.lastPosition;
	this.lastPosition = this.position;
	this.position = newPos;

	this.a.set(0, 0, 0);
};


var diff = new THREE.Vector3();

function Cloth(w, h) {
	w = w || 10;
	h = h || 10;
	this.w = w;
	this.h = h;

  this.geometry = new THREE.ParametricGeometry(
    this.particlePosition, // this sets the initial position, and is effectively unused
    this.w,
    this.h
  );

  this.geometry.dynamic = true;
  this.geometry.computeFaceNormals(); // why ?

  this.springLength = 25;
	this.width = this.springLength * this.w;
	this.height = this.springLength * this.h;

  this.particles  = [];
  this.constrains = [];

  this.pinnedParticles = [];

	var u, v;

	// Create particles
	for (v=0; v<=h; v++) {
		for (u=0; u<=w; u++) {
			this.particles.push(

				new Particle(
          this.particlePosition(u/this.w, v/this.h),
          MASS
        )

			);
		}
	}

	// Structural

  // starting at bottom left
  // can the order of these two loops be flipped without problem?
	for (v=0;v<h;v++) {
		for (u=0;u<w;u++) {

      // upwards
      this.constrains.push([
        this.particleAt(u,v),
        this.particleAt(u,v+1),
				this.springLength
			]);

      // rightwards
      this.constrains.push([
        this.particleAt(u,v),
        this.particleAt(u+1,v),
				this.springLength
			]);

		}
	}

  // edge case, rightmost column
  // upwards (no rightwards)
	for (u=w, v=0;v<h;v++) {
    this.constrains.push([
      this.particleAt(u,v),
      this.particleAt(u,v+1),
			this.springLength

		]);
	}

  // edge case, topmost row
  //
	for (v=h, u=0;u<w;u++) {
    this.constrains.push([
      this.particleAt(u,v),
      this.particleAt(u+1,v),
			this.springLength
		]);
	}

}

Cloth.prototype.particleAt = function(u,v){
  return this.particles[u + v * (this.w + 1)];
};


// takes in a fractional position (0-1) and returns a position in 3d mesh space.
// works from the bottom left
// sets the vertex position for the parametric geometry, on initialization. Gets updated on render.
Cloth.prototype.particlePosition = function(u, v) {
  // for now, only positive numbers, easier to track.
  return new THREE.Vector3(
    u * this.width, // was (u - 0.5)
    v * this.height, // was (v - 0.5)
    0
  );
};

Cloth.prototype.pinAt = function(u,v){
  this.pinnedParticles.push(
    this.particleAt(u,v)
  );
  return this;
};

// conservation of energy
// the position offset is spread between two nodes
Cloth.prototype.satisfyConstraint = function(constraint) {
  var p1 = constraint[0], p2 = constraint[1], distance  = constraint[2];
	diff.subVectors(p2.position, p1.position);

	var currentDist = diff.length();
	if (currentDist==0) return; // prevents division by 0

	var correction = diff.multiplyScalar(1 - distance/currentDist);  // vectors
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);
};


Cloth.prototype.simulate = function(time) {
	if (!lastTime) {
		lastTime = time;
		return this;
	}
	
	var i, il, particles = cloth.particles, particle, constrains, position;
	
	for (i=0, il = particles.length; i < il; i++) {
		particle = particles[i];
//		particle.addForce(gravity);

		particle.calcPosition(TIMESTEP_SQ);
	}

	// Start Constrains

	constrains = cloth.constrains;
	il = constrains.length;
	for (i=0;i<il;i++) {
    this.satisfyConstraint(constrains[i]);
	}

	// Ball Constrains

  // compares every particle to the ball position
  // might be better off with a k-d tree!
  // see http://threejs.org/examples/#webgl_nearestneighbour
//	if (sphere.visible) {
  // two optimizations, and compare:
  // 1: Use k-d tree
  // 2: Use Shader
  for (var j = 0; j < colliders.length; j++){
    var collider = colliders[j];

    for (i=0, il = particles.length;i<il;i++) {
      position = particles[i].position;
      diff.subVectors(position, collider.position);

      if (diff.length() < ballRadius) {
        // collided
        console.assert(collider.geometry.parameters.radius);
        diff.normalize().multiplyScalar(collider.geometry.parameters.radius);
        position.copy(collider.position).add(diff);
      }
    }

  }

//	}

	// Pin Constrains
  // Assuming that it is faster to correct a few positions than check a large number.
	for (i=0, il=this.pinnedParticles.length;i<il;i++) {
		var particle = this.pinnedParticles[i];
		particle.position.copy(particle.originalPosition);
		particle.lastPosition.copy(particle.originalPosition); // ?
	}
  
  
  for ( var i = 0, il = particles.length; i < il; i ++ ) {

    this.geometry.vertices[ i ].copy( particles[ i ].position );

  }

  this.geometry.computeFaceNormals();
  this.geometry.computeVertexNormals();

  this.geometry.normalsNeedUpdate = true;
  this.geometry.verticesNeedUpdate = true;

  return this;
};
