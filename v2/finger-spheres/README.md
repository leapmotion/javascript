Finger Spheres
=====
<img src="http://i.imgur.com/2Y4k8Ge.png">

##Description
Visualizes your hand by placing a Sphere at every joint. Up to 4 hands can be visualized at once

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. finger-spheres):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/finger-spheres
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/finger-spheres
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should see a simple sphere-based hand visualization.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section


##API Methods
* [Hands](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html)
* [Fingers & Joints](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Finger.html)
