window.controller = controller = (new Leap.Controller({
  background: true
  optimizeHMD: true
}))

# this transforms the entire leap coordinate space
# note the usage of Euler rotation, first around the Z axis to right the hand,
# and then a lesser amount around the X give us a top-down perspective
# units are radians and mm.
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
  recording: 'leap-playback-recording-57fps.json.lz'
  resumeOnHandLost: false
}

controller.connect()





makeLight = (hand)->
  light = window.lights.pop()
  lightVisualizer = window.lightVisualizers.pop()

  light.intensity = 8
  hand.data('light', light)

  lightVisualizer.position = light.position
  lightVisualizer.visible = true
  hand.data('lightVisualizer', lightVisualizer)


releaseLight = (hand)->
  light = hand.data('light')
  return unless light

  light.intensity = 0
  window.lights.push(light)
  hand.data('light', null)

  lightVisualizer = hand.data('lightVisualizer')
  lightVisualizer.visible = false
  window.lightVisualizers.push(lightVisualizer)
  hand.data('lightVisualizer', null)



positionLight = (hand)->

  handMesh = hand.data('riggedHand.mesh')

  # we could set the position of the light to the thumb or index finger, but this would make it too easy to bump
  # the object when letting go.  Instead, we do palmPosition with offset.
  if hand.pinchStrength > 0.5
    unless hand.data('pinching')
      makeLight(hand)
      hand.data('pinching', true)

    if light = hand.data('light')

      pos = Leap.vec3.clone(hand.palmPosition)

      offsetDown = Leap.vec3.clone(hand.palmNormal)
      Leap.vec3.multiply(offsetDown, offsetDown, [50,50,50])
      Leap.vec3.add(pos, pos, offsetDown)

      offsetForward = Leap.vec3.clone(hand.direction)
      Leap.vec3.multiply(offsetForward, offsetForward, [30,30,30])
      Leap.vec3.add(pos, pos, offsetForward)

      handMesh.scenePosition(pos, light.position)

  else
    if hand.data('pinching')
      releaseLight(hand)
      hand.data('pinching', false)



controller.on 'handLost',  releaseLight
controller.on 'hand',      positionLight


