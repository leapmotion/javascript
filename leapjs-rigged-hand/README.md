JS Rigged Hand Plugin
==============

This allows a Leap-Enabled hand to be added to any Three.JS scene.
Requires LeapJS Skeletal 0.4.2 or greater with LeapJS-Plugins 0.1.3 or greater.

 - Live Demo: [http://leapmotion.github.io/leapjs-rigged-hand/](http://leapmotion.github.io/leapjs-rigged-hand/)
 - If you don't have a Leap, automatic mode is available.  Ths JSON frame stream is almost 4mb, so give it a moment to load
 and then make sure you have the page in focus for playback. http://leapmotion.github.io/rigged-hand/?spy=1

![hands](https://f.cloud.github.com/assets/407497/2405446/5e7ee120-aa50-11e3-8ac0-579b316efc04.png)

Automatically adds or removes hand meshes to/from the scene as they come in to or out of view of the leap controller.


## Usage:

### Basic

```coffeescript
# simplest possible usage, see `quickstart.html`
(window.controller = new Leap.Controller)
  .use('riggedHand')
  .connect()
```

### Advanced

```coffeescript
# advanced configuration, see `index.html` and `main.coffee`
(window.controller = new Leap.Controller)
  # handHold and handEntry are dependencies of this plugin, available to the controller through leap-plugins.js
  # By default rigged-hand will use these, but we can call explicitly to provide configuration:
  .use('handHold', {})
  .use('handEntry', {})
  .use('riggedHand', {
    parent: scene

    renderFn: ->
      renderer.render(scene, camera)
      # Here we update the camera controls for clicking and rotating
      controls.update()

    # These options are merged with the material options hash
    # Any valid Three.js material options are valid here.
    materialOptions: {
      wireframe: true
    }
    geometryOptions: {}

    # This will show pink dots at the raw position of every leap joint.
    # they will be slightly offset from the rig shape, due to it having slightly different proportions.
    dotsMode: true

    # Sets the default position offset from the parent/scene. Default of new THREE.Vector3(0,-10,0)
    offset: new THREE.Vector3(0,0,0)

    # sets the scale of the mesh in the scene.  The default scale works with a camera of distance ~15.
    scale: 1.5

    # Allows hand movement to be scaled independently of hand size.
    # With a value of 2, the hand will cover twice the distance on screen as it does in the world.
    positionScale: 2

    # allows 2d text to be attached to joint positions on the screen
    # Labels are by default white text with a black dropshadow
    # this method is called for every bone on each frame
    # boneMeshes are named Finger_xx, where the first digit is the finger number, and the second the bone, 0 indexed.
    boneLabels: (boneMesh, leapHand)->
      return boneMesh.name

    # allows individual bones to be colorized
    # Here we turn thumb and index finger blue while pinching
    # this method is called for every bone on each frame
    # should return an object with hue, saturation, and an optional lightness ranging from 0 to 1
    # http://threejs.org/docs/#Reference/Math/Color [setHSL]
    boneColors: (boneMesh, leapHand)->
      if (boneMesh.name.indexOf('Finger_0') == 0) || (boneMesh.name.indexOf('Finger_1') == 0)
        return {
          hue: 0.6,
          saturation: leapHand.pinchStrength
        }

  })
  .connect()
```

### Screen Position

When a hand is on the screen, that hand will be available to your application (such as in a plugin or on 'frame' callback)
 through `frame.hands[index].data('riggedHand.mesh')`.  This will be the Three.js mesh, as is.

To get the css window coordinates of anything in leap-space, use the `handMesh.screenPosition` method, as seen in
main.coffee.  Note that if your WebGL canvas doesn't take up the whole screen in a fixed position, you will need to
add an offset. See [https://github.com/mrdoob/three.js/issues/78](https://github.com/mrdoob/three.js/issues/78).

```coffeescript
controller.on 'frame', (frame)->
  if hand = frame.hands[0]
    handMesh = frame.hands[0].data('riggedHand.mesh')
    # to use screenPosition, we pass in any leap vector3 and the camera
    screenPosition = handMesh.screenPosition(hand.fingers[1].tipPosition, camera)
    cursor.style.left = screenPosition.x
    cursor.style.bottom = screenPosition.y
```

## Contributing

If you're receiving this as a zip and want to make changes, access issues, or get the latest code, contact
pehrlich@leapmotion.com to be added to the github repo.