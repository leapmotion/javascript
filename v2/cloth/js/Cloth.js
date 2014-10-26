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

var colliders = [], numColliders = 1;

var ballGeo = new THREE.SphereGeometry( 20, 20, 20 );
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
var mesh;


for (var i = 0; i < numColliders; i++){
  mesh = new THREE.Mesh( ballGeo, ballMaterial );
  colliders.push( mesh )
}

var dots = [];
var numDots = 100;

var dotGeo = new THREE.SphereGeometry( 10, 10, 10 );
var dotMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );

var center = new THREE.Mesh( dotGeo, dotMaterial.clone() );
center.material.color.setHex( 0x00ff00 );

for (var i = 0; i < numDots; i++){
  mesh = new THREE.Mesh( dotGeo, dotMaterial );
  dots.push( mesh )
}


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
Particle.prototype.calcPosition = function(timesq) {     // why is this squared? And in seconds ?
	var newPos = this.tmp.subVectors(this.position, this.lastPosition);
	newPos.multiplyScalar(DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));

	this.tmp = this.lastPosition;
	this.lastPosition = this.position;
	this.position = newPos;

	this.a.set(0, 0, 0);
};


var diff = new THREE.Vector3();

// Takes in number of particles wide by height
function Cloth(xParticleCount, yParticleCount, springLen) {
  this.w = xParticleCount = xParticleCount || 10;  // number
  this.h = yParticleCount = yParticleCount || 10;
  this.springLength = springLen = springLen || 25;

  this.geometry = new THREE.ParametricGeometry(
    this.particlePosition, // this sets the initial position, and is effectively unused
    this.w,
    this.h
  );

  this.geometry.dynamic = true;
  this.geometry.computeFaceNormals(); // why ?

	this.width = this.springLength * this.w;
	this.height = this.springLength * this.h;

  this.particles  = [];
  this.constrains = [];

  this.pinnedParticles = [];

	var u, v;

	// Create particles
	for (v=0; v<=yParticleCount; v++) {
		for (u=0; u<=xParticleCount; u++) {
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
	for (v=0;v<yParticleCount;v++) {
		for (u=0;u<xParticleCount;u++) {

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
	for (u=xParticleCount, v=0;v<yParticleCount;v++) {
    this.constrains.push([
      this.particleAt(u,v),
      this.particleAt(u,v+1),
			this.springLength

		]);
	}

  // edge case, topmost row
  //
	for (v=yParticleCount, u=0;u<xParticleCount;u++) {
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
    (u - 0.5) * this.width, // was (u - 0.5)
    (v - 0.5) * this.height, // was (v - 0.5)
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

// takes the position of the collider
// subtracts that of the cloth mesh
// converts position and radius to index and index-step
// returns a subset of particles in an array
// assume that collider positions are world positions (Leap-data)
Cloth.prototype.collisionLikelyParticles = function(collider){
  var particles = [];

//  var offset = this.mesh.getWorldPosition().sub(collider.position);
  var offset = collider.position.clone().sub(this.mesh.getWorldPosition());
  var radius = collider.geometry.parameters.radius;


  // Discard Z > collider radius * 8 (8 is a bit of a magic number here.)
  // Margin is taken against the origin position of the particle.
  // So far, this works at any orientation.
  // assumes that the mesh is a flat plane, and not curved to the view
  // that would require higher or dynamic z-margin. (Might not be too bad to implement).
  // this should already do a lot when the hand is not near the mesh.
  if ( Math.abs(offset.z) > radius * 8 ) return particles;
  if ( Math.abs(offset.x) > this.width / 2 * 1.3 ) return particles;
  if ( Math.abs(offset.y) > this.height / 2 * 1.3 ) return particles;

  // convert from meters to index-space.
  // this needs to be reflected as from-center
  offset.divideScalar(this.springLength);
  offset.x = ~~offset.x; // Math.floor
  offset.y = ~~offset.y;

  radius /= (this.springLength * 2); // double for good measure
  radius = Math.ceil(radius);


  // offset is from center, but we're indexed from bottom left
  // this could be sloppy/off by one? Better do the addition before the unit change?
  // note that this is disabled for now, as the vertices are not currently centered on the mesh position, but their BL corner is.
    offset.x += ~~(this.w / 2);
    offset.y += ~~(this.h / 2);


  // call this for every row
  // start with center for now
  // forms a square
  var row;
  for (var i = 0; i <= radius * 2; i++){
    row = (offset.y - radius + i) * (this.w + 1);

    particles = particles.concat(
      this.particles.slice(
        (offset.x - radius) + row,
        (offset.x + radius) + row + 1
      ) // inclusive, exclusive
    );

  }

  return particles;
};


Cloth.prototype.simulate = function(time) {
  if (this.lastTime) {
    var deltaTime = time - this.lastTime / 1000;

    var i, il, particles = cloth.particles, particle, constrains, position, collisionLikelyParticles;

    for (i=0, il = particles.length; i < il; i++) {
      particle = particles[i];
//  		particle.addForce(gravity);

      // actually using delta time seems a little off, so we hold this in for now. Only matters w/ gravity anyhow.
      particle.calcPosition( Math.pow(18 /1000, 2) );
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
    // two optimizations, and compare:
    // 1: Use k-d tree
    // 2: Use Shader

    for (i = 0; i < dots.length; i++){
      dots[i].visible = false;
    }

    for (var j = 0; j < colliders.length; j++){
      var collider = colliders[j],
        radius = collider.geometry.parameters.radius;

      // this is a good optimization for a large number of colliders! (tested w/ 50 to 500).
      collisionLikelyParticles = this.collisionLikelyParticles(collider);
//      collisionLikelyParticles = particles;
//      console.log('queried particles: ', collisionLikelyParticles.length);

      for (i=0, il = collisionLikelyParticles.length;i<il;i++) {

        dots[i].visible = true;
        dots[i].position.copy(collisionLikelyParticles[i].position);


        position = collisionLikelyParticles[i].position;
        diff.subVectors(position, collider.position);

        if (diff.length() < radius) {
          // collided
          diff.normalize().multiplyScalar(radius * 1.5);
          position.copy(collider.position).add(diff);
        }
      }

    }

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
  }

  this.lastTime = time;

  return this;
};
