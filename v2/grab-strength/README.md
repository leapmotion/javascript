Grab Strength
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/grabstrength.png">

##Description

Simple example showing grab strength with the Rigged Hand. As your grab pose becomes stronger (closer to 1), parts of your rigged hand will be colored blue. 

**NOTE**: Upon running, the demo will show saved Hand Playback Data (via [Leap Playback Plugin](http://leapmotion.github.io/leapjs-plugins/docs/#playback)), until your hands enter the field-of-view. Removing your hands from the field-of-view will restart the canned hand playback.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. grab-strength):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/grab-strength
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/grab-strength
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should be seeing the rigged hand.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Hands & Grab Strength](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html#grabStrength)
