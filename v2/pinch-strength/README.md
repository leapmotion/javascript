Pinch Strength
=====

<img src="https://lm-assets.s3.amazonaws.com/screenshots/pinch_strength.png">

##Description

Simple example showing pinch strength with the Rigged Hand. As your pinch pose becomes stronger (closer to 1), pinching fingers of your rigged hand will be colored blue. 

**NOTE**: Upon running, the demo will show saved Hand Playback Data (via [Leap Playback Plugin](http://leapmotion.github.io/leapjs-plugins/docs/#playback)), until your hands enter the field-of-view. Removing your hands from the field-of-view will restart the canned hand playback.

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. pinch-strength):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/pinch-strength
```

####2. You can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/pinch-strength
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should be seeing the rigged hand.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section

##API Methods
* [Hands & Pinch Strength](https://developer.leapmotion.com/documentation/skeletal/javascript/api/Leap.Hand.html#pinchStrength)

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

