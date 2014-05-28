window.gui = new dat.GUI(autoPlace: false)
gui.add(scope, 'x', -Math.PI, Math.PI) # number
gui.add(scope, 'y', -Math.PI, Math.PI) # number
gui.addColor(scope, 'color')
gui.add(scope, 'rate', 0, 10)


document.getElementById('guiContainer').appendChild(gui.domElement)
extraOutput = document.createElement('div')
extraOutput.id = 'extraOutput'
extraOutput.style.paddingTop = '1.2em'
extraOutput.style.color = 'white'
document.getElementById('guiContainer').appendChild(extraOutput)


window.controller = controller = (new Leap.Controller({background: true}))

controller.use('riggedHand', {
  parent: window.scene,
  camera: window.camera,
  scale: 0.25,
  positionScale: 6, # todo: CDGAIN/pointer ballistics
  offset: new THREE.Vector3(0, -2, 0)
  renderFn: -> # no-op until rigged-hand supports `null` here.
  boneColors: (boneMesh, leapHand)->
    return {
      hue: 0.6,
      saturation: 0.2
      lightness: 0.8
    }
})

controller.use 'playback', {
  recording: 'pinch-and-move-57fps.json.lz'
  loop: false
}

controller.connect()



controller.on 'frame', (frame)->
  return unless frame.hands[0]

  hand = frame.hands[0]
  handMesh = hand.data('riggedHand.mesh')

  # we could set the position of the light to the thumb or index finger, but this would make it too easy to bump
  # the object when letting go.  Instead, we do palmPosition with offset.
  if hand.pinchStrength > 0.5
    pos = Leap.vec3.clone(hand.palmPosition)

    offsetDown = Leap.vec3.clone(hand.palmNormal)
    Leap.vec3.multiply(offsetDown, offsetDown, [30,30,30])
    Leap.vec3.add(pos, pos, offsetDown)

    offsetForward = Leap.vec3.clone(hand.direction)
    Leap.vec3.multiply(offsetForward, offsetForward, [30,30,30])
    Leap.vec3.add(pos, pos, offsetForward)

    handMesh.scenePosition(pos, scope.light1position)

  # todo: this would be better as a part of dat.gui.  But it looks like that project is no longer maintained.
  extraOutput.innerHTML = scope.light1position.toArray().map( (num) -> num.toPrecision(2) )


document.body.onkeydown = (e)->
  switch e.which
    when 32
      scope.pause()
    else
      console.log "unbound keycode: #{e.which}"