paused = false
window.scope = {
  x: 0
  y: 0
  light1position: new THREE.Vector3(1, 1, 1)
  pause: ->
    paused = !paused
  rate: 1
}


window.scene = new THREE.Scene()
window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)

renderer = new THREE.WebGLRenderer({antialias: true})
renderer.setSize window.innerWidth, window.innerHeight

renderer.shadowMapEnabled = true;


document.body.appendChild renderer.domElement




geometry = new THREE.CubeGeometry(75, 75, 16)
material = new THREE.MeshPhongMaterial(color: 0x0000ff)
cube = new THREE.Mesh(geometry, material)
cube.position.set(80,0,-400)
cube.receiveShadow = true
scene.add cube

geometry = new THREE.CubeGeometry(75, 75, 16)
material = new THREE.MeshPhongMaterial(color: 0x0000ff)
cube2 = new THREE.Mesh(geometry, material)
cube2.position.set(-80,0,-400)
cube2.castShadow = true
cube2.receiveShadow = true
scene.add cube2


camera.position.fromArray([0, 160, 400])
camera.lookAt(new THREE.Vector3(0, 0, 0))


ambientLight = new THREE.DirectionalLight( 0xffffff, 2 )
ambientLight.position.set( 0, -1, 0 )
#scene.add ambientLight




#light = new THREE.PointLight( 0xffffff, 8, 100 )

light = new THREE.DirectionalLight( 0xffffff, 2 )
scene.add light


lightVisualizer = new THREE.Mesh(
  new THREE.SphereGeometry( 4 )
  new THREE.MeshBasicMaterial(0x555555)
)
lightVisualizer.position = light.position
scene.add lightVisualizer


render = ->
  unless paused
    window.scope.x += scope.rate * 0.004
    window.scope.y += scope.rate * 0.002

    cube2.rotation.x += scope.rate * 0.004
    cube2.rotation.y += scope.rate * 0.002

  cube.rotation.x = window.scope.x
  cube.rotation.y = window.scope.y

  renderer.render scene, camera

  requestAnimationFrame render

render()
