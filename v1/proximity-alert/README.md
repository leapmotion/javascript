Proximity Alert
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/proximity_alert.png">

##Description

Fun example to showcase how the Leap Motion controller recognizes your hand at various locations within its field-of-view. As you move your hand, you'll hear different pitches as it gets nearer and farther from the controller.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. proximity-alert):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/proximity-alert
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/proximity-alert
http-server
```

####3. You're done!
* Be sure you toggle the **Click to Unmute** link.
* Move your hands above the Leap Motion Controller and you should hear various pitches based on your hand's location in the controller's field-of-view. 
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Leap Motion Coordinate System](https://developer.leapmotion.com/documentation/skeletal/javascript/devguide/Leap_Overview.html)
* [Hands](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html)
