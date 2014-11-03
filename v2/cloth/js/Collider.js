COLLIDER_RECT_SCALE_FACTOR = 8; // how many times larger is the rect than the collider

function Collider(mesh) {
  this.mesh     = mesh;
  this.radius   = mesh.geometry.parameters.radius;
  this.position = mesh.position;
  this.clothRelations = {}; // when pushing through a mesh, this tracks which direction the collider came from

  this.rect = new Rect(
    this.position,
    this.radius * COLLIDER_RECT_SCALE_FACTOR,
    this.radius * COLLIDER_RECT_SCALE_FACTOR,
    [this]
  );

  // hold a reference to the combination-rect of multiple colliders, so that it can be reset on hand lost.
  this.megaRect = null;

}

// Tracks which side of a cloth a collider is physically on
// (so that it knows whether to deform to that point, regardless of speed or interval)
// takes in a cloth and the relative distance of this collider from that cloth.
Collider.prototype.initRelation = function(cloth, zOffset){
  if ( !isNaN(this.clothRelations[cloth.mesh.id]) ) return;

  this.clothRelations[cloth.mesh.id] = Math.sign(zOffset);
};

Collider.prototype.resetRelation = function(cloth) {

  delete this.clothRelations[cloth.mesh.id];

};

// Returns 1 or -1
Collider.prototype.physicalSide = function(cloth){

  return this.clothRelations[cloth.mesh.id];

};



// rectangle in particle 2d world space.
function Rect(position, halfWidth, halfHeight, colliders){
  this.position   = position;
  this.halfWidth  = halfWidth;
  this.halfHeight = halfHeight;
  this.depth = 40; // so-to-speak. This threshold of z-offset where simulation is running.
  this.colliders = colliders;
  
  // possible opt would be to only add or remove items from these arrays, rather than replacing them.
  this.nearbyParticles = [];
  this.boundaryParticles = [];
}


// http://stackoverflow.com/questions/16005136/how-do-i-see-if-two-rectangles-intersect-in-javascript-or-pseudocode
// we work in actual world space
Rect.prototype.intersects = function(rect){

  var isLeft  = (this.position.x + this.halfWidth ) < (rect.position.x - rect.halfWidth );
  var isRight = (this.position.x - this.halfWidth ) > (rect.position.x + rect.halfWidth );
  var isAbove = (this.position.y - this.halfHeight) > (rect.position.y + rect.halfHeight);
  var isBelow = (this.position.y + this.halfHeight) < (rect.position.y - rect.halfHeight);

  return !( isLeft || isRight || isAbove || isBelow );
};

// get the minimum enclosing rectangle
Rect.prototype.combineWith = function(rect){

  var left   = Math.min(this.position.x - this.halfWidth , rect.position.x - rect.halfWidth );
  var right  = Math.max(this.position.x + this.halfWidth , rect.position.x + rect.halfWidth );
  var bottom = Math.min(this.position.y - this.halfHeight, rect.position.y - rect.halfHeight);
  var top    = Math.max(this.position.y + this.halfHeight, rect.position.y + rect.halfHeight);

  // for now, z-indices are totally thrown away.  So we ignore them when creating a position.
  return new Rect(
    new THREE.Vector3(
      (right + left) / 2,
      (bottom + top) / 2,
      NaN // tossed later..
    ),
    (right - left) / 2,
    (top - bottom) / 2,
    [].concat(rect.colliders).concat(this.colliders)
  );

};


// note: this has not been performance audited
Rect.prototype.forEachNearbyParticle = function(callback){

  for (var i=0, il = this.nearbyParticles.length; i < il; i++) {

    // note: this is a square, and could be optimized.
    for (var j = 0, jk = this.nearbyParticles[i].length; j < jk; j++) {

      callback(this.nearbyParticles[i][j]);

    }
  }

};

// kind of a cheap method.  Should be gutted and replaced by something which animates the particles back in to place
// rather than snapping them there and ceasing simulation
Rect.prototype.reset = function(cloth){
  if (this.nearbyParticles.length === 0) return;

  this.forEachNearbyParticle(function(particle){

    particle.fixPosition()

  });

  this.nearbyParticles = [];
  this.boundaryParticles = [];

  for (var i = 0; i < this.colliders.length; i++){
    this.colliders[i].resetRelation(cloth);
  }

};