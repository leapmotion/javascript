
function Particle(position, mass) {
	this.position         = position;
	this.lastPosition     = position.clone();
	this.originalPosition = position.clone();
  // we always add to `w`, as it's the length of a position delta
//	this.a = new THREE.Vector4(0, 0, 0, -1000); // acceleration  -- what constant should we choose?
//	this.a = new THREE.Vector4(0, 0, 0, -981 * 1.4); // amount similar to gravity in original.
	this.a = new THREE.Vector4(0, 0, 0, 0); // amount similar to gravity in original.
//	this.a = new THREE.Vector4(0, 0, 0, -981 * 0.014); // amount similar to gravity in original.
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
Particle.prototype.calcPosition = function() {     // why is this squared? And in seconds ?
	var newPos = this.tmpPos.subVectors(this.position, this.lastPosition);
	newPos.multiplyScalar(DRAG).add(this.position);

	this.tmpPos = this.lastPosition;  // as this is a reference, we set it to something which is ok to mutate later.
	this.lastPosition = this.position;
	this.position = newPos;

  // for now, constant tensional force
//	this.a.set(0, 0, 0);
};

// converts position offset in to tension.
Particle.prototype.fixPosition = function(){
  this.diff3.subVectors(this.position, this.originalPosition);

  // is this conversion of xyz to w correct?
  this.position.set(
    this.originalPosition.x,
    this.originalPosition.y,
    this.originalPosition.z,
//    this.position.w + this.diff3.length() // don't do this.
    0
  );

  this.lastPosition.copy(this.position);

};
