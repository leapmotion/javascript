Connected Fingers 
=====

<img src="http://i.imgur.com/mMbt1Bi.png" width="370" height="234">


##Description
To use do the following:

Include the leap.js , three.js , and ConnectedHand.js

```javascript
<script src="path/to/leap.js"></script>
<script src="path/to/three.js"></script>
<script src="path/to/ConnectedHand.js"></script>
```

Inside the Initialization function, set up your Leap Controller, 
and as many Connected hand as your heart desires:

```javascript
var controller;
var hand1 , hand2;

function init(){

  // THREE.JS initializaion Code Goes here

  controller = new Leap.Controller();
  controller.connect();

  hand1 = new ConnectedHand( controller );
  hand2 = new ConnectedHand( controller );

  // Here we add our Connected hand to the scene,
  // but we could easily add it to other objects
  // such as the camera
  hand1.addToScene( scene );
  hand2.addToScene( scene );
}
```

It is important to note that although there are predefined 
geometries / materials, you can pass whatever mesh you want 
into the connected hand. Below you can see us changing the way
hand1 looks

```javascript
// Inside of init function, after we have defined our hands

var geo = new THREE.CubeGeometry( 1 , 1 , 1 );
var mat = new THREE.MeshBasicMaterial({
  color:0xc0ffee, 
  transparent:true,
  opacity:.5 
});
var jointMesh = new THREE.Mesh( geo , mat );

var connectionMesh = new THREE.Mesh( geo , mat );

var centerMesh = new THREE.Mesh( geo , mat );
centerMesh.scale.x = 10;
centerMesh.scale.z = 10;


// Here we create new fingers and a Palm with the geometries
// we have created. This will take care of removing
// the old default meshes as well
hand1.createFingers( jointMesh , connectionMesh );
hand1.createPalm( jointMesh , connectionMesh, centerMesh  );
```


The Last thing you need to do is to make sure that once we have
our hands, that they get updated on every frame. To do this
all you need to do is:

```javascript
function animate() {
  // three.js render calls here

  // The number inside the update call is telling us
  // which leap hand to update compared to.
  hand1.update( 0 );
  hand2.update( 1 );
}
```

We can also define a hand to only update if it is a left
or right hand like so:

```javascript
hand1.update( 'left' );
hand2.update( 'right' );
```

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. connected-fingers):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/connected-fingers
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/connected-fingers
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should see a simple 3D JS hand representation.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section


##API methods
* [Hands](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html)
* [Fingers](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Finger.html)

##Resources
Any Further Questions, contact icohen@leapmotion.com || [@cabbibo](https://www.github.com/cabbibo) 

##Licensing Details
The MIT License (MIT)

Copyright (c) 2014 Leap Motion, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
