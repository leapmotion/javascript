/*
 * Cloth Simulation using a relaxed constrains solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

// Certain things could be stored to attempt to reduce GC
// such as `diff`

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.1;

var colliders = [], numColliders = 1;

var ballGeo = new THREE.SphereGeometry( 4, 20, 20 );
var ballMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff } );
var mesh;

for (var i = 0; i < numColliders; i++){
  mesh = new THREE.Mesh( ballGeo, ballMaterial );
  mesh.position.set(0,0,20);
  colliders.push( mesh )
}

var dots = [];
var numDots = 5000;
var dotGeo = new THREE.SphereGeometry( 1, 10, 10 );
var dotMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );

for (var i = 0; i < numDots; i++){
  mesh = new THREE.Mesh( dotGeo, dotMaterial );
  dots.push( mesh )
}


function Particle(position, mass) {
	this.position         = position;
	this.lastPosition     = position.clone();
	this.originalPosition = position.clone();
  // we always add to `w`, as it's the length of a position delta
//	this.a = new THREE.Vector4(0, 0, 0, -1000); // acceleration  -- what constant should we choose?
	this.a = new THREE.Vector4(0, 0, 0, -981 * 1.4); // amount similar to gravity in original.
	this.mass = mass; // constant and unused.
	this.tmpPos = new THREE.Vector4(); // allows pointer switching
	this.tmpForce = new THREE.Vector4();
	this.diff3  = new THREE.Vector3();
}

// Force -> Acceleration
Particle.prototype.addForce = function(force) {
	this.a.add(
		this.tmpForce.copy(force)
	);
};


// Performs verlet integration
// instantaneous velocity times drag plus position plus acceleration times time
Particle.prototype.calcPosition = function(timesq) {     // why is this squared? And in seconds ?
	var newPos = this.tmpPos.subVectors(this.position, this.lastPosition);
//  console.assert(!isNaN(newPos.x));
	newPos.multiplyScalar(DRAG).add(this.position);
	newPos.add(this.a.multiplyScalar(timesq));
//  console.assert(!isNaN(this.position.x));

	this.tmpPos = this.lastPosition;  // as this is a reference, we set it to something which is ok to mutate later.
	this.lastPosition = this.position;
	this.position = newPos;

  // for now, constant tensional force
//	this.a.set(0, 0, 0);
};

// converts position offset in to tension.
Particle.prototype.fixPosition = function(){
  this.diff3.subVectors(this.position, this.originalPosition);

//  console.assert(this.position.equals(this.lastPosition));
//  console.assert((new THREE.Vector4).subVectors(this.position, this.lastPosition).length() < 1);
//  this.position.copy(this.originalPosition);
//  this.lastPosition.copy(this.originalPosition); // ? necessary ?

  // is this conversion of xyz to w correct?
  this.position.set(
    this.originalPosition.x,
    this.originalPosition.y,
    this.originalPosition.z,
    this.position.w + this.diff3.length()
  );


//  console.assert(!isNaN(this.position.x));
};


// Takes in number of particles wide by height
function Cloth(xParticleCount, yParticleCount, springLen) {
  this.w = xParticleCount || 10;  // number
  this.h = yParticleCount || 10;
  this.springLength = springLen || 25;

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
  this.pinnedParticles = [];

  this.lastTime = null;
  this.lastAffectedParticles = [];

  // Temporary usage
  this.diff3 = new THREE.Vector3;
  this.diff4 = new THREE.Vector4;

  this.addParticles();

//  this.pinCorners();

}

Cloth.prototype.pinCorners = function(){
  // Four corners:
  this.pinAt(0,0);
  this.pinAt(0,this.h);
  this.pinAt(this.w,0);
  this.pinAt(this.w,this.h);
};

Cloth.prototype.addParticles = function(){
	var u, v;

	// Create particles
	for (v=0; v<=this.h; v++) {
		for (u=0; u<=this.w; u++) {
			this.particles.push(

				new Particle(
          this.particlePosition(u/this.w, v/this.h),
          MASS
        )
			);

		}
	}

};

Cloth.prototype.particleAt = function(u,v){
  return this.particles[u + v * (this.w + 1)];
};


// takes in a fractional position (0-1) and returns a position in 3d mesh space.
// works from the bottom left
// sets the vertex position for the parametric geometry, on initialization. Gets updated on render.
Cloth.prototype.particlePosition = function(u, v) {
  // for now, only positive numbers, easier to track.
  return new THREE.Vector4(
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
Cloth.prototype.satisfyConstraint = function(p1, p2) {
  this.diff4.subVectors(p2.position,p1.position);

// note: length here could be replaced:
// In fact, using only one iteration and approximating the square root removes the stiffness that
// appears otherwise when the sticks are perfectly stiff.
//  http://web.archive.org/web/20080410171619/http://www.teknikus.dk/tj/gdc2001.htm
//  // Pseudo-code for satisfying (C2) using sqrt approximation
//  delta = x2-x1;
//  delta*=restlength*restlength/(delta*delta+restlength*restlength)-0.5;
//  x1 += delta;
//  x2 -= delta;
	var currentDist = this.diff4.length();
	if (currentDist==0) return; // prevents division by 0

	var correction = this.diff4.multiplyScalar(1 - this.springLength/currentDist);  // vectors
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);
};


// this should be made in to a Collider class
Cloth.prototype.satisfyCollider = function(collider, radius, particle){
  var position = particle.position;

  // this vec3 takes only the 3d components of position.
  this.diff3.subVectors(position, collider.position);

  if (this.diff3.length() < radius) { // collided
    this.diff3.normalize().multiplyScalar(radius);
//    position.copy(collider.position).add(diff);
    position.add(this.diff3);
  }
};


// takes the position of the collider
// subtracts that of the cloth mesh
// converts position and radius to index and index-step
// returns a subset of particles in an array
// assume that collider positions are world positions (Leap-data)
Cloth.prototype.nearbyParticles = function(collider){
  var particles = [];

  var offset = collider.position.clone().sub(this.mesh.getWorldPosition());
  var radius = collider.geometry.parameters.radius * 16;

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
  var row, leftBound, rightBound;
  for (var i = 0; i <= radius * 2; i++){
    row = (offset.y - radius + i);
    leftBound  = offset.x - radius;
    rightBound = offset.x + radius;

    // check for and prevent wraparound
    // possible optimization would be try and no longer necessitate these conditions.
    if (rightBound >= this.w) rightBound = this.w;
    if (leftBound < 0) leftBound = 0;
    if (row < 0) continue;

    row *= (this.w + 1);

    particles.push(
      this.particles.slice(leftBound + row, rightBound + row + 1) // second arg is exclusive
    );

  }

  return particles;
};

arrayDiff = function(a1, a2) {
  return a1.filter(function(i) {return a2.indexOf(i) < 0;});
};

// call this every animation frame
// should be broken in to smaller methods
Cloth.prototype.simulate = function(time) {
  if (this.lastTime) {
    var deltaTime = time - this.lastTime / 1000;

    var i, il, j, jl, k, kl,
      particle, particles = this.particles,
      collider, radius,
      nearbyParticles, affectedParticles = [], noLongerAffectedParticles,
      pRightwards, pDownwards, pLeftwards, pUpwards;



    // compares every particle to the ball position
    // might be better off with a k-d tree!
    // see http://threejs.org/examples/#webgl_nearestneighbour
    // two optimizations, and compare:
    // 1: Use k-d tree -- not necessary as we have natural indexing.
    // 2: Use Shader -- not a good idea until happy with the actual algorithms going on. They should not be an excuse for wasted cycles.

    // reset dots:
    for (i = 0; i < dots.length; i++){
      dots[i].visible = false;
    }

    // for every collider, run mesh calculations on effected nodes
    for ( i = 0; i < colliders.length; i++){

      collider = colliders[i];
      radius = collider.geometry.parameters.radius;

      // this is a good optimization for a large number of colliders! (tested w/ 50 to 500).
      // returns a 2d array of rows, which we use later to know where to apply constraints.
      // shit - now we have to prevent loop-over
      nearbyParticles = this.nearbyParticles(collider);

      // store all particles in flat array
      if (nearbyParticles.length > 0){
        affectedParticles = affectedParticles.concat(
          nearbyParticles.reduce(function(a,b){ return a.concat(b) })
        );
      }

      for (j=0, jl = nearbyParticles.length; j < jl; j++) {

        for (k=0, kl = nearbyParticles[j].length; k < kl; k++) {
          particle = nearbyParticles[j][k];

          dots[(j * jl) + k].visible = true;
          dots[(j * jl) + k].position.copy(particle.position);

//          console.assert(!isNaN(particle.position.x));


          // actually using delta time seems a little off, so we hold this in for now. Only matters w/ gravity anyhow.
          particle.calcPosition( Math.pow(18 /1000, 2) );

//          console.assert(!isNaN(particle.position.x));

          pRightwards = nearbyParticles[j][k + 1];
          pLeftwards = nearbyParticles[j][k - 1];
          if ( nearbyParticles[j-1]) {
            pUpwards = nearbyParticles[j - 1][k];
          }

          // hopefully these conditions don't cause slowness :-/
          // we would then have to re-pre-establish them.
          if (pRightwards) this.satisfyConstraint(particle, pRightwards);
//          console.assert(!isNaN(particle.position.x));

          if ( nearbyParticles[j+1]) {
            pDownwards = nearbyParticles[j+1][k];
//            console.assert(!isNaN(pDownwards.position.x));
            if (pDownwards) this.satisfyConstraint(particle, pDownwards);
//            console.assert(!isNaN(particle.position.x));
          }

          if (pUpwards && pDownwards && pLeftwards && pRightwards){
            this.satisfyCollider(collider, radius, particle);
//            console.assert(!isNaN(particle.position.x));
          }

        }

      }

    }

    // note - this could be made faster by taking advantage of the intrinsic ordering of the particles in the array
    noLongerAffectedParticles = arrayDiff(this.lastAffectedParticles, affectedParticles);
    this.lastAffectedParticles = affectedParticles;

    for (i = 0, il=noLongerAffectedParticles.length; i < il; i++){
      noLongerAffectedParticles[i].fixPosition();
    }

    // Pin Constrains
    // Assuming that it is faster to correct a few positions than check a large number.
    for (i=0, il=this.pinnedParticles.length;i<il;i++) {
      this.pinnedParticles[i].fixPosition();
    }


    for ( i = 0, il = particles.length; i < il; i ++ ) {
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
