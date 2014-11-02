function Collider(mesh) {
  this.mesh = mesh;
  this.radius   = mesh.geometry.parameters.radius;
  this.position = mesh.position;
  this.nearbyParticles = [];
  this.boundaryParticles = [];
}

// note: this has not been performance audited
Collider.prototype.forEachNearbyParticle = function(callback){

  for (var i=0, il = this.nearbyParticles.length; i < il; i++) {

    // note: this is a square, and could be optimized.
    for (var j = 0, jk = this.nearbyParticles[i].length; j < jk; j++) {

      callback(this.nearbyParticles[i][j]);

    }
  }

};


