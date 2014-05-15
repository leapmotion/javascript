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

##Licensing Details
The MIT License (MIT)

Copyright (c) 2014 Leap Motion, Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
