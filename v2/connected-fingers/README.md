Connected Fingers 
=====

<img src="http://i.imgur.com/mMbt1Bi.png" width="370" height="234">

To use do the following:

Include the leap.js , three.js , and ConnectedHand.js

```
<script src="path/to/leap.js"></script>
<script src="path/to/three.js"></script>
<script src="path/to/ConnectedHand.js"></script>

```

Inside the Initialization function, set up your Leap Controller, 
and as many Connected hand as your heart desires:

```
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

```

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

```

function animate(){

  // three.js render calls here

  // The number inside the update call is telling us
  // which leap hand to update compared to.
  hand1.update( 0 );
  hand2.update( 1 );

}


```

We can also define a hand to only update if it is a left
or right hand like so:

```

  hand1.update( 'left' );
  hand2.update( 'right' );

```

Any Further Questions, contact icohen@leapmotion.com || @cabbibo 
