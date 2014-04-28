
  function ConnectedHand( controller , s , jointMesh, connectionMesh , centerMesh ){

    this.controller = controller;

    this.size = s || 100;

    this.defaults = {};

    this.defaults.material = new THREE.MeshNormalMaterial({ shading: THREE.SmoothShading });

    var s = this.size;
    
    this.defaults.jointGeometry       = new THREE.IcosahedronGeometry( s / 30 , 3 );
    this.defaults.connectionGeometry  = new THREE.CylinderGeometry( s / 40 , s / 40 , 1 , 100); 
    this.defaults.centerGeometry      = new THREE.CylinderGeometry( s / 10 , s / 10 , 1 , 100);


    var d = this.defaults;

    d.jointMesh       = jointMesh       || new THREE.Mesh( d.jointGeometry      , d.material );
    d.connectionMesh  = connectionMesh  || new THREE.Mesh( d.connectionGeometry , d.material );
    d.centerMesh      = centerMesh      || new THREE.Mesh( d.centerGeometry     , d.material );

    this.object   = new THREE.Object3D();
  
    this.createFingers( d.jointMesh , d.connectionMesh );
    this.createPalm( d.jointMesh , d.connectionMesh , d.centerMesh );
 
 
  }

  ConnectedHand.prototype.createFingers = function( jointMesh , connectionMesh ){

    var jointMesh       = jointMesh       || this.defaults.jointMesh;
    var connectionMesh  = connectionMesh  || this.defaults.connectionMesh;

    if( this.fingers ) this.deleteFingers();

    var fingers = [];

    for( var i = 0; i < 5; i++ ){

      var finger = this.createFinger( jointMesh , connectionMesh );
      fingers.push( finger );

    }

    this.fingers = fingers;

  }

  ConnectedHand.prototype.createFinger = function( jointMesh , connectionMesh ){
  
    var finger = {

      connections:[],
      joints:[]

    }

    for( var i = 0; i < 3; i++ ){

      var joint = jointMesh.clone();
      var connection = connectionMesh.clone();

      finger.connections.push( connection );
      finger.joints.push( joint );

      this.object.add( joint );
      this.object.add( connection );

    }

    return finger;

  }


  ConnectedHand.prototype.createPalm = function( jointMesh , connectionMesh , centerMesh ){
    
    var jointMesh       = jointMesh       || this.defaults.jointMesh;
    var connectionMesh  = connectionMesh  || this.defaults.connectionMesh;
    var centerMesh      = centerMesh      || this.defaults.centerMesh;

    if( this.palm ) this.deletePalm();

    var palm = {

      connections:[],
      joints:[],

    }

    for( var i = 0; i < 6; i++ ){

      var joint = jointMesh.clone();
      var connection = connectionMesh.clone();

      palm.connections.push( connection );
      palm.joints.push( joint );

      this.object.add( joint );
      this.object.add( connection );

    }

    palm.center = centerMesh.clone();
    this.object.add( palm.center );

    this.palm = palm;
   

  }


  ConnectedHand.prototype.placePalm = function( hand , fingers ){


    /*
     
       Get our rear and center points

    */
    var p1 = this.leapToScene( fingers[0].mcpPosition );
    var p2 = this.leapToScene( fingers[1].mcpPosition );
    var p3 = this.leapToScene( fingers[4].mcpPosition );


    var dif = p1.clone().sub( p3 );
    var center = p1.sub( dif.multiplyScalar( .5 ) );
    var dif = center.clone().sub( p2 );
    var rear = center.clone().add( dif );

    /*
    
       Place all the joints

    */
    this.palm.joints[0].position  = this.leapToScene( fingers[0].mcpPosition );
    this.palm.joints[1].position  = this.leapToScene( fingers[1].mcpPosition );
    this.palm.joints[2].position  = this.leapToScene( fingers[2].mcpPosition );
    this.palm.joints[3].position  = this.leapToScene( fingers[3].mcpPosition );
    this.palm.joints[4].position  = this.leapToScene( fingers[4].mcpPosition );
    this.palm.joints[5].position  = rear;

    this.palm.center.position     = center;

    var rotationMatrix  = this.rotationMatrix( hand.direction, hand.palmNormal );
    this.palm.center.rotation.setFromRotationMatrix( rotationMatrix );
    

    /*
    
       Place all the connections

    */
    for( var i = 0; i < this.palm.joints.length; i++ ){

      var toJoint = this.palm.joints[i];
      var fromJoint;
      if( i == 0 ){
        fromJoint = this.palm.joints[ this.palm.joints.length - 1];
      }else{
        fromJoint = this.palm.joints[ i - 1 ];
      }

      var c = this.palm.connections[i];

      var to = toJoint.position;
      var from = fromJoint.position;

      this.placeConnection( c , toJoint.position , fromJoint.position );

    }

  }


  ConnectedHand.prototype.placeFinger = function( finger , leapFinger ){

    for( var i = 1; i < 4; i++ ){

      var to    = this.leapToScene( leapFinger.positions[i] );
      var from  = this.leapToScene( leapFinger.positions[i-1] );

      finger.joints[ i - 1 ].position = to;
      
      this.placeConnection( finger.connections[i-1] , to , from );

    }


  }

  ConnectedHand.prototype.placeFingers = function( leapFingers ){

    for( var i = 0; i < 5; i++ ){

      var leapFinger = leapFingers[i];
  
      var finger = this.fingers[i];

      this.placeFinger( finger , leapFinger );

    }


  }

  ConnectedHand.prototype.placeConnection = function( connection , toPoint , fromPoint ){

    var toFromVec       = toPoint.clone().sub( fromPoint );
    var midPoint        = toFromVec.clone().multiplyScalar(.5);
    
    var y               = new THREE.Vector3( 0 , 1 , 0 );
    
    var rotation        = this.fromToRotation( y , toFromVec );
      
    connection.position = fromPoint.clone().add( midPoint );  
    connection.scale.y  = toFromVec.length();

    connection.rotation.setFromQuaternion( rotation );


  }

  ConnectedHand.prototype.deleteFingers = function(){

    for( var i = 0; i< this.fingers.length; i++ ){

      var finger = this.fingers[i];
      for( var j=0; j< 3; j++ ){
      
        this.object.remove(finger.joints[j]);
        this.object.remove(finger.connections[j]);
      
      }

    }

  }

  ConnectedHand.prototype.deletePalm = function(){

    for( var i =0; i < this.palm.joints.length; i++ ){

      this.object.remove(this.palm.joints[i]);
      this.object.remove(this.palm.connections[i]);

    }

    this.object.remove( this.palm.center );

  }

  ConnectedHand.prototype.removeFingers = function(){

    for( var i = 0; i < 5; i++ ){

      var finger = this.fingers[i];

      for( var j = 0; j < 3; j++ ){

        finger.joints[j].position.x       = this.size * 100000000;
        finger.connections[j].position.x  = this.size * 100000000;

      }

    }

  }

  ConnectedHand.prototype.removePalm = function(){

    for( var i = 0; i < this.palm.joints.length; i++ ){

      this.palm.joints[i].position.x      = this.size * 1000000;
      this.palm.connections[i].position.x = this.size * 1000000;

    }
    
    this.palm.center.position.x = this.size * 1000000;

  }
  

  ConnectedHand.prototype.update = function( handIndex ){
   

    if( !handIndex ) handIndex = 0;

    this.frame = this.controller.frame();

    var hand;

    if( typeof handIndex == 'number' ){

      hand = this.frame.hands[ handIndex ];
    
    }else if( typeof handIndex == 'string' ){

      for( var i = 0; i < this.frame.hands.length; i++ ){

        if( handIndex == this.frame.hands[i].type ){
          hand = this.frame.hands[i];
        }

      }

    }

    if( hand ){

      var fingers = this.orderFingers( hand );

      this.placeFingers( fingers );
      this.placePalm( hand , fingers );

    }else{

      this.removeFingers();
      this.removePalm();

    }

  }

  


  /*


   UTILS

  
  */

  ConnectedHand.prototype.addToScene = function( scene ){

    scene.add( this.object );

  }

  ConnectedHand.prototype.removeFromScene = function( scene ){

    scene.remove( this.object );

  }


  ConnectedHand.prototype.leapToScene = function( position ){

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


  ConnectedHand.prototype.orderFingers = function( hand ){

    var fingers = hand.fingers.sort( function( f1 , f2 ){ 
      return f1.type < f2.type ? -1 : 1 
    });

    return fingers

  }

  ConnectedHand.prototype.fromToRotation = function( vec1 , vec2 ){

    var axis = vec1.clone().cross( vec2 ).normalize();

    var x = vec1.clone().dot( vec2 ) / ( vec1.length() * vec2.length() );
    angle = Math.acos( x );

    return new THREE.Quaternion().setFromAxisAngle( axis , angle );

  }

  ConnectedHand.prototype.rotationMatrix = function( vec1 , vec2 ){

    var a1 = new THREE.Vector3().fromArray( vec1 );
    var a2 = new THREE.Vector3().fromArray( vec2 );
    var a3 = a1.clone().cross( a2 );

    var matrix = new THREE.Matrix4( 
      a1.x , a1.y , a1.z, 0,
      a2.x , a2.y , a2.z, 0,
      a3.x , a3.y , a3.z, 0,
      0    , 0    , 0   , 1
    )


    var matrix = new THREE.Matrix4( 
      a1.x , a2.x , a3.x, 0,
      a1.y , a2.y , a3.y, 0,
      a1.z , a2.z , a3.z, 0,
      0    , 0    , 0   , 1
    )

    return matrix; 

  }

