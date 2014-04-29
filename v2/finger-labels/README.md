Finger Labels
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/finger-labels.png">

##Description

Wave your hands over the Leap Motion to see 2D hands, fingers and joints rendered on the screen. The supporting code will show you how to access each finger to your desire.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. finger-labels):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/finger-labels
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/finger-labels
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should be seeing a rendered hand.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Hands](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html)
* [Fingers & Joints](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Finger.html)
