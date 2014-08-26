window.controller = controller = (new Leap.Controller({background: true}))

# this transforms the entire leap coordinate space
# note the usage of Euler rotation, first around the Z axis to right the hand,
# and then a lesser amount around the X give us a top-down perspective
controller.use('transform', {
  quaternion: (new THREE.Quaternion).setFromEuler(
    new THREE.Euler(
      Math.PI * -0.3,
      0,
      Math.PI,
      'ZXY'
    )
  )
  position: new THREE.Vector3(0,100,0)
})

controller.use('riggedHand', {
  parent: window.scene,
  camera: window.camera,
  # this causes the hand to move at 2x real-space speed
  positionScale: 2,
  renderFn: null
  boneColors: (boneMesh, leapHand)->
    return {
      hue: 0.6,
      saturation: 0.2
      lightness: 0.8
    }
})

controller.use 'playback', {
  recording: 'top-down-pinch-37fps.json.lz'
  loop: false
}

controller.connect()





# the following three methods are bound in controller.coffee
createLight = (hand)->

#  window.light = new THREE.PointLight( 0xffffff, 8, 1000 )
#  scene.add light

#  light = new THREE.PointLight( 0xffffff, 8, 10000 )
#  scene.add light
#  hand.data('light', light)
#  console.log 'added light', light

#  lightVisualizer = new THREE.Mesh(
#    new THREE.SphereGeometry( 4 )
#    new THREE.MeshBasicMaterial(0x555555)
#  )
#  lightVisualizer.position = light.position
#  scene.add lightVisualizer
#  hand.data('lightVisualizer', lightVisualizer)


removeLight = (hand)->
  light = hand.data('light')
  scene.remove light
  hand.data('light', null)

  lightVisualizer = hand.data('lightVisualizer')
  scene.remove lightVisualizer
  hand.data('lightVisualizer', null)


positionLight = (hand)->
  # x range: -100 to 100
  # y range: -100 to 100ish
  # z range is roughly -50 to -300

  handMesh = hand.data('riggedHand.mesh')
  light = hand.data('light')

  # we could set the position of the light to the thumb or index finger, but this would make it too easy to bump
  # the object when letting go.  Instead, we do palmPosition with offset.
  if hand.pinchStrength > 0.5
    pos = Leap.vec3.clone(hand.palmPosition)

    offsetDown = Leap.vec3.clone(hand.palmNormal)
    Leap.vec3.multiply(offsetDown, offsetDown, [13,13,13])
    Leap.vec3.add(pos, pos, offsetDown)

    offsetForward = Leap.vec3.clone(hand.direction)
    Leap.vec3.multiply(offsetForward, offsetForward, [13,13,13])
    Leap.vec3.add(pos, pos, offsetForward)

#    handMesh.scenePosition(pos, light.position)
    handMesh.scenePosition(pos, window.light.position)




controller.on 'handFound', createLight
controller.on 'handLost',  removeLight
controller.on 'hand',      positionLight





document.body.onkeydown = (e)->
  switch e.which
    when 32
      scope.pause()
    else
      console.log "unbound keycode: #{e.which}"