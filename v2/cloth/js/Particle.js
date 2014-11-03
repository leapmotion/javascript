
function Particle(position) {
	this.position         = position;
	this.lastPosition     = position.clone();
	this.originalPosition = position.clone();
	this.a = new THREE.Vector3(0, 0, 0); // amount similar to gravity in original.
	this.tmpPos = new THREE.Vector3(); // allows pointer switching
	this.tmpForce = new THREE.Vector3();
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
Particle.prototype.calcPosition = function() {     // why is this squared? And in seconds ?

	var newPos = this.tmpPos.subVectors(this.position, this.lastPosition);
	newPos.multiplyScalar(DRAG).add(this.position);

  // this restoring force is pretty important, as otherwise edges will get way out of sync,
  // and then snap back at infinite speed when becoming once-more fixed.
  // 1/2*k*x^2
  var force = this.tmpForce.subVectors(this.originalPosition, this.position);

  newPos.add( force.normalize().multiplyScalar( force.lengthSq() * DAMPING)  );

	this.tmpPos = this.lastPosition;  // as this is a reference, we set it to something which is ok to mutate later.
	this.lastPosition = this.position;
	this.position = newPos;

};

// converts position offset in to tension.
Particle.prototype.fixPosition = function(){
  this.diff3.subVectors(this.position, this.originalPosition);

  // is this conversion of xyz to w correct?
  this.position.set(
    this.originalPosition.x,
    this.originalPosition.y,
    this.originalPosition.z
  );

  this.lastPosition.copy(this.position);

};
