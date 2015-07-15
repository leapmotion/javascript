// - use grabStrength to control volume
// - ignore swipes done with not good grabStrength?
// recipe: http://www.foodnetwork.com/recipes/tyler-florence/the-ultimate-beef-wellington-recipe2.html
// a matching hand ID should be able to control volume post-swipe
// say when a gesture is done, matching gestureID.
// use hand speed for speech rate! (rolling average?) can we modify this in real time?

// default speech rate: 175 WPM
// default hand rate: 0.9

Leap = require('leapjs');
//_ = Leap._;
_ = require('underscore'); // note that we require a newer version thatn Leap include, of underscore for throttle's {trailing: false}
recipe = require('./recipe.json');

var say = require('say'); // todo - publish fork, or use https://github.com/Marak/say.js/pull/10
var loudness = require('loudness');  // https://github.com/LinusU/node-loudness


Leap.loop({enableGestures: true});





var Speaker = function(recipe){
  this.speech = null;

  this.directions = recipe.directions.split('.');
  this.directionsIndex = 0;

  console.log("Loaded recipe, " + this.directions.length + " sentences");
};

Speaker.prototype = {

  handleGesture: _.throttle(function(gesture){
    console.log('speed:', gesture.speed, 'gesture', gesture.id);

    if ( gesture.direction[0] > 0 ){
      this.sayNextLine(Math.abs(gesture.speed) - 30);
    }else{
      this.sayPreviousLine();
    }

  }, 2000, {trailing: false} ),

  sayPreviousLine: function(){
    if (this.speech){
      this.speech.kill('SIGHUP');
    }else {
      console.log('previous line');
      this.directionsIndex--;
    }
    if (this.directionsIndex === 0) return;
  },

  sayNextLine: function(rate){


    console.log('next line:' + this.directions[this.directionsIndex]);
    if (this.speech) this.speech.kill('SIGHUP');

    var text = this.directionsIndex === this.directions.length ? "All Done!" : this.directions[this.directionsIndex]; // may be off by one.

    this.speech = say.speak('Alex',
      text,
      _.bind(this.speakingDone, this),
      {rate: rate }
    );

    if (this.directionsIndex < this.directions.length) this.directionsIndex++;
  },

  speakingDone: function(){
    // note -this needs to be updated for concurrent async speech
    //this.speech = null;
  },

  loudnessError: function(){}

};


speaker = new Speaker(recipe);

Leap.loopController.on('gesture', function(gesture){
  //if (gesture.type != 'swipe' && gesture.type != 'update') console.log('u', gesture.id);
  if (gesture.type != 'swipe' && gesture.type != 'start') return;

  var hand = Leap.loopController.frame().hand(gesture.handIds[0]);

  if (hand.grabStrength > 0.7){
    console.log('rejecting due to high grabStrength: ' + hand.grabStrength);
    return
  }

  if (
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]) &&
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[2])
  ){
    speaker.handleGesture(gesture);
  }

});
