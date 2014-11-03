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

var DAMPING = 0.06;
var DRAG = 1 - DAMPING;

var colliders = [];


var redDots = [];
var greenDots = [];
var dotGeo = new THREE.SphereGeometry( 1, 4, 4 );
var dotMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );

var visualize = true;
if (visualize){

  var mesh;
  for (var i = 0; i < 2500; i++){
    mesh = new THREE.Mesh( dotGeo, dotMaterial );
    redDots.push( mesh )
  }

  var dotMaterial = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );

  for (var i = 0; i < 1000; i++){
    mesh = new THREE.Mesh( dotGeo, dotMaterial );
    greenDots.push( mesh )
  }
}


// Takes in number of particles wide by height
// in a rather unfortunate naming convention, this.w is in index-space, and this.width is in scene space.
function Cloth(xParticleCount, yParticleCount, springLen) {
  this.mesh = null; // this gets reverse-referenced later.
  this.w = xParticleCount || 10;  // number
  this.h = yParticleCount || 10;
  this.particleSpacing = springLen || 25;

  this.geometry = new THREE.ParametricGeometry(
    this.particlePosition, // this sets the initial position, and is effectively unused
    this.w,
    this.h
  );

  this.geometry.dynamic = true;
  this.geometry.computeFaceNormals(); // why ?

	this.width  = this.particleSpacing * this.w;
	this.height = this.particleSpacing * this.h;

  this.particles  = [];
  this.pinnedParticles = [];
  this.constrains = [];

  // Temporary usage
  this.diff3 = new THREE.Vector3;
  this.rayCaster = new THREE.Raycaster;


  // todo - for now, we assume this never changes -.-
  // should base off of matrixWorld instead
  // used to project particles.
  this.worldNormal = new THREE.Vector3(0,0,1);

  this.addParticles();
  this.addConstraints();

}


Cloth.prototype.addParticles = function(){
	var u, v;

	// Create particles
	for (v=0; v<=this.h; v++) {
		for (u=0; u<=this.w; u++) {
			this.particles.push(

				new Particle(
          this.particlePosition(u/this.w, v/this.h)
        )
			);

		}
	}

};


Cloth.prototype.addConstraints = function(){
	var u, v;

  // starting at bottom left
  // can the order of these two loops be flipped without problem?
	for (v=0;v<this.h;v++) {
		for (u=0;u<this.w;u++) {

      // upwards
      this.constrains.push([
        this.particleAt(u,v),
        this.particleAt(u,v+1)
			]);

      // rightwards
      this.constrains.push([
        this.particleAt(u,v),
        this.particleAt(u+1,v)
			]);

		}
	}

  // edge case, rightmost column
  // upwards (no rightwards)
	for (u=this.w, v=0;v<this.h;v++) {
    this.constrains.push([
      this.particleAt(u,v),
      this.particleAt(u,v+1)

		]);
	}

  // edge case, topmost row
  //
	for (v=this.h, u=0;u<this.w;u++) {
    this.constrains.push([
      this.particleAt(u,v),
      this.particleAt(u+1,v)
		]);
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
Cloth.prototype.satisfyConstraint = function(p1, p2) {
  this.diff3.subVectors(p2.position,p1.position);

// note: length here could be replaced:
// In fact, using only one iteration and approximating the square root removes the stiffness that
// appears otherwise when the sticks are perfectly stiff.
//  http://web.archive.org/web/20080410171619/http://www.teknikus.dk/tj/gdc2001.htm
//  // Pseudo-code for satisfying (C2) using sqrt approximation
//  delta = x2-x1;
//  delta*=restlength*restlength/(delta*delta+restlength*restlength)-0.5;
//  x1 += delta;
//  x2 -= delta;
	var currentDist = this.diff3.length();
	if ( currentDist == 0 ) return; // prevents division by 0

	var correction = this.diff3.multiplyScalar(1 - this.particleSpacing/currentDist);  // vectors
	var correctionHalf = correction.multiplyScalar(0.5);
	p1.position.add(correctionHalf);
	p2.position.sub(correctionHalf);
};


// this should be made in to a Collider class
Cloth.prototype.satisfyCollider = function(collider, particle){
  var particlePosition = particle.position;
  var radius = collider.radius;

  this.diff3.subVectors(particlePosition, collider.position);


  // might not even need this.
  if (this.diff3.length() < radius) { // collided

    this.diff3.setLength(radius);
    particlePosition.add(this.diff3);

  }

  // Allows the collider to slide perfectly under the mesh.  Doesn't attempt to move the mesh, heh.
  // todo - there's no need to raycast each and every particle. We can easily look up by index instead.
  this.rayCaster.set(particle.originalPosition, this.worldNormal.clone().multiplyScalar( collider.physicalSide(this) * -1 ) );
  collider.mesh.updateMatrixWorld(); // make sure ray caster gets the position. // seems strange that this is necessary, as it is a dynamic object.
  var results = this.rayCaster.intersectObject(collider.mesh);
  var result = results[results.length - 1];

  if (result){

    particlePosition.copy(particle.originalPosition).setZ(result.distance * collider.physicalSide(this) * -1  );

  }

};



// takes the position of the collider
// subtracts that of the cloth mesh
// converts position and radius to index and index-step
// returns a subset of particles in an array
// assume that collider positions are world positions (Leap-data)


// in order to do multiple regions:
// first solve top right corner only
// store array of rectangles, each rectangle defined by four points
// do a memcopy of rectangle data so that they can be mutated (split) later without trouble
// if corner intersecting, solve for line segments and areas independently
// must be a recursive function?
//
// todo this offset doesn't work in planes not normal to z :-/
Cloth.prototype.calcNearbyParticlesFor = function(rect){
  var particles = [];
  var boundaryParticles = []; // these ones get pinned.
  var row, i;

  // looks like rectPos.z might need to be updated for multiple fingers..
  var rectPos    = rect.position.clone().sub(this.mesh.getWorldPosition());  // todo - make relative to this mesh space.

  // Discard Z > collider radius * 8 (8 is a bit of a magic number here.)
  // Margin is taken against the origin position of the particle.
  // So far, this works at any orientation.
  // assumes that the mesh is a flat plane, and not curved to the view
  // that would require higher or dynamic z-margin. (Might not be too bad to implement).
  // this should already do a lot when the hand is not near the mesh.
  if ( Math.abs(rectPos.z) > rect.depth ||
    Math.abs(rectPos.x) > this.width / 2 * 1.3 || // todo - dial back these 1.3s
    Math.abs(rectPos.y) > this.height / 2 * 1.3) {

    rect.reset(this);

    return

  } else {

    for (i = 0; i < rect.colliders.length; i++){
      rect.colliders[i].initRelation(this, rectPos.z);
    }

  }


  // convert from meters to index-space.
  // this needs to be reflected as from-center
  rectPos.divideScalar(this.particleSpacing);
  rectPos.x = ~~rectPos.x; // Math.floor - todo - try round and see if it feels better/more centered, especially on lower particle-density systems.
  rectPos.y = ~~rectPos.y;


  // offset is from center, but we're indexed from bottom left
  // this could be sloppy/off by one? Better do the addition before the unit change?
  rectPos.x += ~~(this.w / 2);
  rectPos.y += ~~(this.h / 2);


  var halfWidth  = Math.ceil( rect.halfWidth  / this.particleSpacing ); // avoid 0
  var halfHeight = Math.ceil( rect.halfHeight / this.particleSpacing );
  var width      = halfWidth  * 2;
  var height     = halfHeight * 2;

  var leftBound  = rectPos.x - halfWidth;
  var rightBound = rectPos.x + halfWidth;


  // check for and prevent wraparound
  // possible optimization would be try and no longer necessitate these conditions. todo - by hardcoding constraints
  if (rightBound > this.w) {
    rightBound = this.w;
  }else{
    for (i = 0; i <= height; i++) {
      row = (rectPos.y - halfHeight + i) * (this.w + 1);
      // Skip the three conditions in the other loop - We don't want boundaries moved in artificially
      boundaryParticles.push(this.particles[rightBound + row]);
    }
  }

  if (leftBound < 0) {
    leftBound = 0
  } else {
    for (i = 0; i <= height; i++) {
      row = (rectPos.y - halfHeight + i) * (this.w + 1);

      boundaryParticles.push(this.particles[leftBound + row]);
    }
  }

  // bottom condition:
  if (rectPos.y - halfHeight >= 0){
    row = (rectPos.y - halfHeight)  * (this.w + 1);
    boundaryParticles = boundaryParticles.concat(
      this.particles.slice(leftBound + row, rightBound + row + 1) // second arg is exclusive
    );
  }

  // top condition:
  if (rectPos.y + halfHeight <= this.h){
    row = (rectPos.y + halfHeight) * (this.w + 1);
    boundaryParticles = boundaryParticles.concat(
      this.particles.slice(leftBound + row, rightBound + row + 1) // second arg is exclusive
    );
  }

  // possible opt: looks like boundary particles are a subset of nearbyParticles, which == wasted work?
  for (i = 0; i <= height; i++){
    row = (rectPos.y - halfHeight + i) * (this.w + 1);
    if (row < 0) continue;

    particles.push(
      this.particles.slice(leftBound + row, rightBound + row + 1) // second arg is exclusive
    );

  }

  rect.nearbyParticles = particles;
  rect.boundaryParticles = boundaryParticles;

};

arrayDiff = function(a1, a2) {
  return a1.filter(function(i) {return a2.indexOf(i) < 0;});
};

// call this every animation frame
// should be broken in to smaller methods
// todo -  Use Shader -- not a good idea until happy with the actual algorithms going on.
// note that currently, if finger movement is > fps, some particles may get frozen in poor position :-/ flaky
Cloth.prototype.simulate = function() {

  var i, il, j, jl, k, kl,
    particle, particles = this.particles,
    collider, rect,
    nearbyParticles, boundaryParticles,// affectedParticles = [], noLongerAffectedParticles,
    pRightwards, pDownwards, rects = [];


  // reset dots:
  if (visualize){
    for (i = 0; i < redDots.length; i++){
      redDots[i].visible = false;
    }

    // reset dots:
    for (i = 0; i < greenDots.length; i++){
      greenDots[i].visible = false;
    }
  }

  // it turns out to be quite difficult to track intersections of rectangles
  // for now we just combine them in to one larger rectangle...
  // not as good, but should be fine

  // for each collider
  // check collisions against intersecting rectangles
  // if yes, take both out, add a new.
  var rectCollision = false;
  for (i = 0; i < colliders.length; i++){
    collider = colliders[i];

    for (j = 0; j < rects.length; j++){

      if ( collider.rect.intersects(rects[j]) ) {
        rectCollision = true;

        collider.megaRect = collider.rect.combineWith(
          rects.splice(j,1)[0]
        );

        rects.push(
          collider.megaRect
        );
      } else {

        collider.megaRect = null;

      }

    }

    if (!rectCollision){
      rects.push(
        collider.rect
      );
    }

  }

  // for every collider, run mesh calculations on effected nodes
  for ( i = 0; i < rects.length; i++){

    rect = rects[i];

    // this is a good optimization for a large number of colliders! (tested w/ 50 to 500).
    // returns a 2d array of rows, which we use later to know where to apply constraints.
    // shit - now we have to prevent loop-over
    this.calcNearbyParticlesFor(rect);
    nearbyParticles   = rect.nearbyParticles;
    boundaryParticles = rect.boundaryParticles;

    for (j=0, jl = nearbyParticles.length; j < jl; j++) {

      for (k=0, kl = nearbyParticles[j].length; k < kl; k++) {
        particle = nearbyParticles[j][k];

        if (visualize){
          redDots[(j * jl) + k].visible = true;
          redDots[(j * jl) + k].position.copy(particle.position);
        }

        particle.calcPosition();

        pRightwards = nearbyParticles[j][k + 1];

        // hopefully these conditions don't cause slowness :-/
        // we would then have to re-pre-establish them.
        if (pRightwards) this.satisfyConstraint(particle, pRightwards);

        if ( nearbyParticles[j+1]) {
          pDownwards = nearbyParticles[j+1][k];
          if (pDownwards) this.satisfyConstraint(particle, pDownwards);
        }

        for (var l = 0; l < rect.colliders.length; l++){
          this.satisfyCollider(rect.colliders[l], particle);
        }

      }

    }

    // note that right now, it is undefined what happens when a collider disappears when colliding with particles
    // they could instantly reset
    // it would be cooler, and more fault tolerant, if the glided back in to position.

    for (i = 0, il=boundaryParticles.length; i < il; i++){
      // this could probably be optimized out
      if (!boundaryParticles[i]) continue;

      if (visualize){
        greenDots[i].visible = true;
        greenDots[i].position.copy(boundaryParticles[i].position);
      }

      boundaryParticles[i].fixPosition();
    }

  }



  // can we do anything to enhance the visuals - with a good lighting, material, etc?

  // these following lines should be optimized for idle-state operation. (!)
  // - add vertex ids to particles, use for the copy and vertex normal calculations
  // how to get face normals? Maybe they're layed out in an orderly fashion, as vertices are, allowing us to query them directly?
  for ( i = 0, il = particles.length; i < il; i ++ ) {
    this.geometry.vertices[ i ].copy( particles[ i ].position );
  }

  this.geometry.computeFaceNormals();
  this.geometry.computeVertexNormals();

  this.geometry.normalsNeedUpdate = true;
  this.geometry.verticesNeedUpdate = true;

  return this;
};
