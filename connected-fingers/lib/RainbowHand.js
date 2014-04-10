
  function RainbowHand( controller , s , connectionGeo , jointGeo , palmGeo , material ){

    this.controller = controller;

    this.size = s || 100;
    this.cGeo = connectionGeo || new THREE.CylinderGeometry( this.size / 40 , this.size / 40 , 1 , 100);
    this.jGeo = jointGeo || new THREE.IcosahedronGeometry( this.size / 30 , 3 );
    this.pGeo = palmGeo || new THREE.CylinderGeometry( this.size / 10 , this.size / 10 , 1 , 100);
    this.material = new THREE.MeshNormalMaterial({ shading: THREE.SmoothShading });

    this.connections  = [];
    this.joints       = [];

    this.maxHands     = 4;

    this.object       = new THREE.Object3D();
    
    this.createConnections( this.cGeo , this.material ); 
    this.createJoints( this.jGeo , this.material );
    this.createPalm( this.pGeo , this.material );

  }

  // To use your own geometry and materials, 
  // just call this function with whichever geo and mat you desire
  RainbowHand.prototype.createConnections = function( geo , material ){

    this.connections = [];
    for( var i = 0; i < this.maxHands * 5; i++ ){

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
    for( var i = 0; i < this.maxHands * 5; i++ ){

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

    this.palms = [];
    for( var i = 0; i < this.maxHands; i++ ){
      var palm = new THREE.Mesh( geo , material );
      this.object.add( palm );
      this.palms.push( palm );

    }
    
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



  RainbowHand.prototype.update = function(){

    this.frame = this.controller.frame();

    for( var i = 0; i < this.maxHands ; i++ ){

      if( this.frame.hands[i] ){
        
        var hand = this.frame.hands[i];
        var handPos = this.leapToScene( hand.palmPosition );

        this.palms[i].position = handPos;
        var rotM = this.rotationMatrix( hand.direction, hand.palmNormal );
        this.palms[i].rotation.setFromRotationMatrix( rotM.transpose() );
        for( var j = 0; j < 5; j ++ ){

          var index = j + (i*5);

          if( this.frame.fingers[index] ){

            var leapFinger  = this.frame.fingers[ index ];
            var fConnections = this.connections[ index ];
            var fJoints     = this.joints[ index ];


            for( var k = 0; k < 4; k++ ){

              var p = this.leapToScene( leapFinger.positions[k] );
              
              var p1;
              
              if( k == 0 )
                p1 = handPos;
              else
                p1 = this.leapToScene( leapFinger.positions[k-1] );

              fJoints[k].position = p;

              var dif = p.clone().sub( p1 );
              fConnections[k].position = p1.clone().add( dif.multiplyScalar( .5 ) );
              var l = dif.length();
              var r = this.fromToRotation( new THREE.Vector3( 0 , 1 , 0 ) , dif );
              fConnections[k].rotation.setFromQuaternion( r );
              fConnections[k].scale.y = l * 2;

            }


          }

        } 
      
      // If there is no hand, move it all offScreen
      }else{

        this.palms[i].position.x = 100000000;

        for( var j = 0; j < 5; j ++ ){

          var index = j + (i*5);

          var leapFinger  = this.frame.fingers[ index ];
          var fConnections = this.connections[ index ];
          var fJoints     = this.joints[ index ];
          for( var k = 0; k < 4; k++ ){

            fConnections[k].position.x = 100000000;
            fJoints[k].position.x = 100000000;

          }
          

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

