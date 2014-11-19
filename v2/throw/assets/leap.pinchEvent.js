// this should get a new name, now that it includes grabEvent.
Leap.plugin('pinchEvent', function(scope){

  this.use('handHold');

  // no hysteresis, first time around.
  scope.pinchThreshold || (scope.pinchThreshold = 0.5);
  scope.grabThreshold || (scope.grabThreshold = 0.5);

  var controller = this;

  this.on('handLost', function(hand){

    if (hand.data('pinchEvent.pinching')){
      controller.emit('unpinch', hand );
    }

    if (hand.data('pinchEvent.grabbing')){
      controller.emit('ungrab', hand );
    }

  });


  return {

    hand: function(hand){

      var pinching = hand.pinchStrength > scope.pinchThreshold;

      if (hand.data('pinchEvent.pinching') != pinching){

        controller.emit(
          pinching ? 'pinch' : 'unpinch',
          hand
        );

        hand.data('pinchEvent.pinching', pinching)
      }


      var grabbing = hand.grabStrength > scope.grabThreshold;

      if (hand.data('pinchEvent.grabbing') != grabbing){

        controller.emit(
          grabbing ? 'grab' : 'ungrab',
          hand
        );

        hand.data('pinchEvent.grabbing', grabbing)
      }

    }

  }
});
