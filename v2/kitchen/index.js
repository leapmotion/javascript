Leap = require('leapjs');
_ = Leap._;

console.log('hello world');

Leap.loop({enableGestures: true});




var Speaker = function(){
};
Speaker.prototype = {

  sayNextLine: _.throttle(function(gesture){
    console.log('now speaking. right: ', gesture.direction[0] > 0);
  }, 2000, {trailing: false})

};


speaker = new Speaker();

Leap.loopController.on('gesture', function(gesture){
  if (gesture.type != 'swipe') return;

  if (
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]) &&
    Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[2])
  ){
    //console.log('gesture', arguments);
    speaker.sayNextLine(gesture);
  }

});
