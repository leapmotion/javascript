Desktop Windows
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/desktop-windows.png">

##Description

Use your hands to move 2D windows with the controls listed below. Uses pinchStrength API to move windows.

####Controls
* Tap index to click.
* Pinch thumb and index to click or click and drag.
* Windows can be dragged via their title(top) bar
* Pinch thumb and middle to alt click.
* Make a sideways trigger with your hand and fire to click.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. desktop-windows):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/desktop-windows
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory.
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/desktop-windows
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should be seeing the rigged.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Hands & Pinch Strength](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html#pinchStrength)
