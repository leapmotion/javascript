
  function RainbowHand( controller , s , connectionGeo , jointGeo , palmGeo , material ){

    this.controller = controller;

    this.size = s || 100;
    this.cGeo = connectionGeo || new THREE.CylinderGeometry( this.size / 40 , this.size / 40 , 1 , 100);
    this.jGeo = jointGeo || new THREE.IcosahedronGeometry( this.size / 30 , 3 );
    this.pGeo = palmGeo || new THREE.CylinderGeometry( this.size / 10 , this.size / 10 , 1 , 100);
    this.material = new THREE.MeshNormalMaterial({ shading: THREE.SmoothShading });

    var jMesh = new THREE.Mesh( this.jGeo , this.material );
    var cMesh = new THREE.Mesh( this.cGeo , this.material );
    var pMesh = new THREE.Mesh( this.pGeo , this.material );
  
    this.fingers = this.createFingers( jMesh , cMesh );
    this.palm    = this.createPalm( jMesh , cMesh , pMesh );


    this.object       = new THREE.Object3D();
   

  }


  RainbowHand.prototype.createFingers = function( jointMesh , connectionMesh ){

    var fingers = [];

    for( var i = 0; i < 5; i++ ){

      this.createFinger( jointMesh , connnectionMesh );

    }

  }

  RainbowHand.prototype.createFinger = function( jointMesh , connectionMesh ){
  
    var finger = {

      connections:[],
      joints:[]

    }

    for( var i = 0; i < 3; i++ ){

      var joint = jointMesh.clone();
      var connection = connectionMesh.clone();

      finger.connections.push( connection );
      finger.joints.push( joint );

    }

    return finger;

  }


  RainbowHand.prototype.createPalm = function( jointMesh , connectionMesh , centerMesh ){

    var palm = {

      connections:[],
      joints:[],

    }

    for( var i = 0; i < 6; i++ ){

      var joint = jointMesh.clone();
      var connection = connectionMesh.clone();

      finger.connections.push( connection );
      finger.joints.push( joint );

    }

    palm.center = centerMesh.clone();

    return finger;
   

  }

  RainbowHand.prototype.leapToScene = function( position ){

    var p = this.frame.interactionBox.normalizePoint( position );

    p[0] -= .5;
    p[1] -= .5;
    p[2] -= .5;

    p[0] *= this.size;
    p[1] *= this.size;
    p[2] *= this.size;

    p[2] -= this.size; //move away a bit TODO: neccesary?

    var pos = new THREE.Vector3().fromArray( p );
    pos.applyMatrix4( this.object.matrix );

    return pos;

  }


  RainbowHand.prototype.placePalm = function( hand ){

    var handPos         = this.leapToScene( hand.palmPosition );
    var rotationMatrix  = this.rotationMatrix( hand.direction, hand.palmNormal );
    
    this.palm.position = handPos;
    this.palm.rotation.setFromRotationMatrix( rotationMatrix.transpose() );

  }


  RainbowHand.prototype.placeExtraPoints = function( fingers ){

    var p1 = this.leapToScene( fingers[0].mcpPosition );
    var p2 = this.leapToScene( fingers[1].mcpPosition );
    var p3 = this.leapToScene( fingers[4].mcpPosition );


    var dif = p1.clone().sub( p3 );

    console.la
    var center = p1.sub( dif.multiplyScalar( .5 ) );


    var dif = center.clone().sub( p2 );

    var rear = center.clone().add( dif );



    this.rear.position  = rear;
    this.center.position = center;

   // console.log( this.center.position );

    //this.rear.position = position;


  }
  
  RainbowHand.prototype.placeCenter = function( hand ){

    this.center.position = this.leapToScene( hand.palmPosition );

  }



  RainbowHand.prototype.placeJoints = function( leapFinger , connections , joints ){

   
    //console.log( leapFinger.type );
    for( var i = 0; i < 4; i++ ){

      var to = this.leapToScene( leapFinger.positions[i] );
 
      var from;
      
      // If it is the first joint, connect from the hand
      if( i == 0 )
        from = this.center.position;
      else
        from = this.leapToScene( leapFinger.positions[i-1] );

      // Places our joint at the to position
      joints[i].position = to;

      // Gets a vector going from the previous joint to the current Joint
      var toFromVector = to.clone().sub( from );

      var midPoint = toFromVector.clone().multiplyScalar( .5 );

      // Places the connection between the two hands
      connections[i].position = from.clone().add( midPoint );
      var length = toFromVector.length();
      
      var y = new THREE.Vector3( 0 , 1 , 0 );

      // Gets the rotation of each connection via the toFromVector
      var rotation = this.fromToRotation( y , toFromVector );
      connections[i].rotation.setFromQuaternion( rotation );

      //Scales the connection to go from finger to finger
      connections[i].scale.y = length;

    }



  }


  RainbowHand.prototype.placeFinger = function( finger , leapFinger ){


    for( var i = 0; i < 4; i++ ){

    }


  }
  RainbowHand.prototype.placeFingers = function( leapFingers ){

    for( var i = 0; i < 5; i++ ){

      var leapFinger = leapFingers[i];
  
      var finger = this.fingers[i];

      this.placeFinger( finger , leapFinger );

    }


  }

  

  RainbowHand.prototype.update = function( handIndex ){
   
    this.frame = this.controller.frame();

    var hand = this.frame.hands[ handIndex ];

    if( hand ){

      var fingers = this.orderFingers( hand );

      this.placeFingers( fingers );
      this.placePalm( fingers );

    }else{

      this.removeFingers();
      this.removePalm();

    }

    // If the hand we pass through exists,
    // place the hand, otherwise, move the hand offscreen
    if( hand ){
      
     // this.placePalm( hand );

      // Makes sure that we always have the fingerts in proper order
      var fingers = this.orderFingers( hand );

      this.placeExtraPoints( fingers );
      
      for( var i = 0; i < 5; i ++ ){

        var leapFinger    = fingers[i];
        var connections  = this.connections[i];
        var joints       = this.joints[i];

        this.placeJoints( leapFinger , connections , joints );

      } 
      
    // If there is no hand, move it all offScreen
    }else{

      this.palm.position.x = 100000000;

      for( var j = 0; j < 5; j ++ ){

        var index = j;
        var fConnections = this.connections[ index ];
        var fJoints     = this.joints[ index ];
        for( var k = 0; k < 4; k++ ){

          fConnections[k].position.x = 100000000;
          fJoints[k].position.x = 100000000;

        }
        

      }

    }


  }


  RainbowHand.prototype.orderFingers = function( hand ){

    var fingers = hand.fingers.sort( function( f1 , f2 ){ 
      return f1.type < f2.type ? -1 : 1 
    });

    return fingers

  }

  RainbowHand.prototype.fromToRotation = function( vec1 , vec2 ){

    var axis = vec1.clone().cross( vec2 ).normalize();

    var x = vec1.clone().dot( vec2 ) / ( vec1.length() * vec2.length() );
    angle = Math.acos( x );

    return new THREE.Quaternion().setFromAxisAngle( axis , angle );

  }

  RainbowHand.prototype.rotationMatrix = function( vec1 , vec2 ){

    var a1 = new THREE.Vector3().fromArray( vec1 );
    var a2 = new THREE.Vector3().fromArray( vec2 );
    var a3 = a1.clone().cross( a2 );

    var matrix = new THREE.Matrix4( 
      a1.x , a1.y , a1.z, 0,
      a2.x , a2.y , a2.z, 0,
      a3.x , a3.y , a3.z, 0,
      0    , 0    , 0   , 1
    )

    return matrix; 

  }

