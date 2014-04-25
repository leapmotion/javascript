
  function RainbowHand( controller , s , connectionGeo , jointGeo , palmGeo , material ){

    this.controller = controller;

    this.size = s || 100;
    this.cGeo = connectionGeo || new THREE.CylinderGeometry( this.size / 40 , this.size / 40 , 1 , 100);
    this.jGeo = jointGeo || new THREE.IcosahedronGeometry( this.size / 30 , 3 );
    this.pGeo = palmGeo || new THREE.CylinderGeometry( this.size / 10 , this.size / 10 , 1 , 100);
    this.material = new THREE.MeshNormalMaterial({ shading: THREE.SmoothShading });

    this.connections  = [];
    this.joints       = [];

    this.object       = new THREE.Object3D();
    
    this.createConnections( this.cGeo , this.material ); 
    this.createJoints( this.jGeo , this.material );
    this.createPalm( this.pGeo , this.material );

  }

  // To use your own geometry and materials, 
  // just call this function with whichever geo and mat you desire
  RainbowHand.prototype.createConnections = function( geo , material ){

    this.connections = [];
    for( var i = 0; i < 5; i++ ){

      var connection = [];
      for( var j = 0; j < 4; j++){

        var mesh = new THREE.Mesh( geo , material );
        connection.push( mesh );
        this.object.add( mesh );

      }
      this.connections.push( connection );
    }


  }

  // To use your own geometry and materials, 
  // just call this function with whichever geo and mat you desire
  RainbowHand.prototype.createJoints = function( geo , material ){

    this.joints = [];
    for( var i = 0; i <  5; i++ ){

      var joint = [];
      for(  var j = 0; j < 4; j++){

        var mesh = new THREE.Mesh( geo , material );
        joint.push( mesh );
        this.object.add( mesh );

      }
      this.joints.push( joint );
    }

  }

  // To use your own geometry and materials, 
  // just call this function with whichever geo and mat you desire
  RainbowHand.prototype.createPalm = function( geo , material ){

    this.palm = new THREE.Mesh( geo , material );
    this.object.add( this.palm );
    
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

    var handPos = this.leapToScene( hand.palmPosition );
    this.palm.position = handPos;
    var rotM = this.rotationMatrix( hand.direction, hand.palmNormal );
    this.palm.rotation.setFromRotationMatrix( rotM.transpose() );

  }

  RainbowHand.prototype.placeJoints = function( leapFinger , connections , joints ){

    
    for( var i = 0; i < 4; i++ ){

      var to = this.leapToScene( leapFinger.positions[i] );
 
      var from;
      
      // If it is the first joint, connect from the hand
      if( i == 0 )
        from = this.palm.position;
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

  RainbowHand.prototype.update = function( handIndex ){
   
    this.frame = this.controller.frame();

    var hand = this.frame.hands[ handIndex ];

    // If the hand we pass through exists,
    // place the hand, otherwise, move the hand offscreen
    if( hand ){
      
      this.placePalm( hand  );
      
      for( var i = 0; i < 5; i ++ ){

        var index = i;

        if( hand.fingers[i] ){

          var leapFinger    = hand.fingers[i];
          var fConnections  = this.connections[i];
          var fJoints       = this.joints[i];

          this.placeJoints( leapFinger , fConnections , fJoints );

        }

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

