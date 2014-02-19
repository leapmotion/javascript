/****************
 * Vector Object - mostly for the sake of symantics.
 ***************/
function Vector(mX,mY,mZ){
    this.x = typeof mX!=='undefined'?mX:0;
    this.y = typeof mY!=='undefined'?mY:0;
    this.z = typeof mZ!=='undefined'?mZ:0;
}

Vector.prototype.add = function(v2){
    return new Vector(
        this.x + v2.x,
        this.y + v2.y,
        this.z + v2.z);
}

Vector.prototype.subtract = function(v2){
    return new Vector(
        this.x - v2.x,
        this.y - v2.y,
        this.z - v2.z);
}

Vector.prototype.equals = function(v2){
    return this.x == v2.x && this.y == v2.y && this.z == v2.z;
}

Vector.prototype.squaredDistanceTo = function(v2){
    var diff = this.subtract(v2);
    return (diff.x*diff.x)+(diff.y*diff.y)+(diff.z*diff.z);
}

Vector.prototype.normalized = function() {
    var mag = this.magnitude();
    return new Vector(
        this.x / mag,
        this.y / mag,
        this.z / mag);
}

Vector.prototype.magnitude = function() {
    return Math.sqrt((this.x*this.x)+(this.y*this.y)+(this.z*this.z));
}

Vector.prototype.distanceTo = function(v2){
    return Math.sqrt(this.squaredDistance(v2));
}

Vector.prototype.dotProduct = function(v2) {
    var v1 = this.normalized();
    v2 = v2.normalized();
    var n = 0;
    n += v1.x * v2.x;
    n += v1.y * v2.y;
    n += v1.z * v2.z;
    return n;
}

function leapToVector(leapPosition){
    return new Vector(leapPosition[0], leapPosition[1], leapPosition[2]);
}