// - use grabStrength to control volume
// - ignore swipes done with not good grabStrength?
// recipe: http://www.foodnetwork.com/recipes/tyler-florence/the-ultimate-beef-wellington-recipe2.html
// a matching hand ID should be able to control volume post-swipe
// say when a gesture is done, matching gestureID.
Leap = require('leapjs');
//_ = Leap._;
_ = require('underscore'); // note that we require a new version of underscore for proper trailing: false
recipe = require('./recipe.json');

console.log('hello world');

Leap.loop({enableGestures: true});






var Speaker = function(recipe){
  this.directions = recipe.directions.split('.');
  this.directionsIndex = 0;
  console.log("Loaded recipe, " + this.directions.length + " sentences");
};
Speaker.prototype = {

  handleGesture: _.throttle(function(gesture){
    if ( gesture.direction[0] > 0 ){
      this.sayNextLine();
    }else{
      this.sayPreviousLine();
    }
  }, 2000, {trailing: false} ),

  sayPreviousLine: function(){
    console.log('previous line');
    if (this.directionsIndex === 0) return;
  },

  sayNextLine: function(){
    if (this.directionsIndex === this.directions.length) return; // may be off by one.

    console.log('next line:' + this.directions[this.directionsIndex]);
    this.directionsIndex++;
  }

};


speaker = new Speaker(recipe);

Leap.loopController.on('gesture', function(gesture){
  if (gesture.type != 'swipe' && gesture.type != 'start') return;

  var hand = Leap.loopController.frame().hand(gesture.handIds[0]);

  if (hand.grabStrength > 0.7){
    console.log('rejecting due to high grabStrength: ' + hand.grabStrength);
    return
  } else {
    //console.log('grabStrength: ' + hand.grabStrength);
  }

  if (
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]) &&
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[2])
  ){
    //console.log('gesture', arguments);
    speaker.handleGesture(gesture);
  }

});
