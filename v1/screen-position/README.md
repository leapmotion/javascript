Screen Position
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/screen_position.png">

##Description

Simple example showing how 3D Leap Motion position coordinates can be translated to 2D screen coordinates.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. screen-position):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/screen-position
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/screen-position
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should see the screen position coordinates (upper-left) change.
* Also, a simple, 2D ball will follow your hand based on screen position.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Hands](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html)
