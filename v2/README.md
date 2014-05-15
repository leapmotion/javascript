<img src="https://di4564baj7skl.cloudfront.net/assets/leapjs/leapjs-logo-270-6bbee8a1836a10769c1ba84951450006.png"><img src="https://lm-assets.s3.amazonaws.com/screenshots/skeletal_beta_3.png">
=====

<img src="https://di4564baj7skl.cloudfront.net/assets/mac-a3b33298ed46dbf8a36151ac0357dbef.png">

##V2: Skeletal Beta
The following repository contains Leap Motion SDK examples built with Javascript. Each project is built using V2 Core Services Skeletal Tracking code from [Leap Motion's Developer Portal](https://developer.leapmotion.com/downloads/skeletal-beta). For additional support with these examples and more, feel free to reach out to us via: [Leap Motion's Community Forums](https://community.leapmotion.com/category/beta)  

**NOTE**: The V2 Skeletal Beta code is NOT currently released to production for consumers. 

##V2: LeapJS Skeletal Beta API
```javascript
<script src="//js.leapmotion.com/leap-0.6.0-beta2.min.js"></script>
```

##Getting Started
####1. Clone the GitHub repository and choose a project (i.e. finger-labels):
```bash
git clone git@github.com:leapmotion-examples/javascript
cd javascript/v2/finger-labels
```

####2. Open finger-labels/index.html in your favorite web browser. Similarly, you can use a basic [Node.js Web Server](https://www.npmjs.org/package/node-http-server) to serve your static file directory:
```bash
sudo npm install http-server -g
cd <clone_directory>/javascript/v2/finger-labels
http-server
```

####3. You're done!
* Move your hands above the Leap Motion Controller and you should be seeing a simple hand with joints.
* If not, see our [FAQ](https://developer.leapmotion.com/downloads/skeletal-beta/faq) section


##Resources
* V2 Skeletal Tracking Beta Access, Email: beta@leapmotion.com
* Each Javascript project example folder has a short README
* [Leap Motion API Docs (Javascript)](https://developer.leapmotion.com/documentation/skeletal/javascript/index.html)
* [LeapJS Getting Started](https://developer.leapmotion.com/leapjs/getting-started) **(NOTE: Uses Production LeapJS instead of Beta)**

##Contributing
* Make a fork, name your branch, add your addition or fix.
* Add your name, email, and github account to the CONTRIBUTORS.txt list, thereby agreeing to the terms and conditions of the Contributor License Agreement.
* Open a Pull Request. If your information is not in the CONTRIBUTORS file, your pull request will not be reviewed.

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
