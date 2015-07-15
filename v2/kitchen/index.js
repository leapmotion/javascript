Leap = require('leapjs');

console.log('hello world');

Leap.loop(function(frame){
  console.log('frame', frame.id);
});