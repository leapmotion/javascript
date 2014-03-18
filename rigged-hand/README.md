JS Rigged Hand Plugin
==============

This allows a Leap-Enabled hand to be added to any Three.JS scene.
Requires LeapJS Skeletal 0.4.2 or greater with LeapJS-Plugins 0.1.3 or greater.

 - Live Demo: [http://leapmotion.github.io/rigged-hand/](http://leapmotion.github.io/rigged-hand/)
 - If you don't have a Leap, automatic mode is available.  Ths JSON frame stream is almost 4mb, so give it a moment to load
 and then make sure you have the page in focus for playback. http://leapmotion.github.io/rigged-hand/?spy=1

![hands](https://f.cloud.github.com/assets/407497/2405446/5e7ee120-aa50-11e3-8ac0-579b316efc04.png)

Automatically adds or removes hand meshes to/from the scene as they come in to or out of view of the leap controller.


## Usage:

(See `Main.coffee` or `main.js`)

```coffeescript
# simplest possible usage
(new Leap.Controller)
  # handHold and handEntry are dependencies of this plugin, which must be "used" before the riggedHand plugin.
  # They are available to the controller through leap-plugins-0.4.3.js
  .use('handHold')
  .use('handEntry')
  .use('riggedHand', {
    # this is the Three Object3d which the hands will be added to
    parent: myScene
    # this method, if provided, will be called on every leap animationFrame.
    # If not provided, the hand data will still be updated in the scene, but the scene not re-rendered.
    renderFn: ->
      myRenderer.render(myScene, myCamera)
  })
  .connect()
```

<br/>
```coffeescript
# with options
(new Leap.Controller)
  .use('handHold')
  .use('handEntry')
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

  })
  .connect()
```

When a hand is on the screen, that hand will be available to your application through `leapHand.data('riggedHand.mesh')`.
This will be the Three.js mesh, as is.

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