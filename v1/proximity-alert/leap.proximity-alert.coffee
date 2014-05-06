# The live demo for this plugin is available at:
# http://codepen.io/leapmotion/pen/smwlG
#
# notes:
# http://patorjk.com/experiments/tones/
# http://it-ebooks.info/book/2072/
# http://www.html5rocks.com/en/tutorials/webaudio/games/
# http://en.wikipedia.org/wiki/Piano_key_frequencies
Leap.Controller.plugin 'proximityAlert', (scope = {})->
  scope.beepFrq ||= 1318.51 # E6
  scope.continuousFrq ||= 1396.91 # F6
  scope.waveType ||= 0 # 0 sine, 1 square, 2 sawtooth, 3 triangle
  scope.beepDuration ||= (distance)-> Math.pow((0.7 - distance), 3) # this returns beep length as a function of proximity
  scope.minBeepDuration ||= 0.02 # when this threshold is crossed, the constant tone will play

  context = new webkitAudioContext()
  panner = context.createPanner()
  masterGain = context.createGain()
  masterGain.connect(context.destination)
  panner.connect(masterGain)

  # takes in a value between 0 and 1
  scope.setVolume = (value)->
    masterGain.gain.value = value

  # this is a wrapper funciton around the web audio api, taking care of some of the more fiddley bits,
  # such as the fact that osciallators can only be used once.
  oscillate = (freq, duration)->
    oscillator = context.createOscillator()
    oscillator.type = scope.waveType
    oscillator.connect(panner)
    oscillator.frequency.value = freq
    oscillator.start(0)
    oscillator.stop(context.currentTime + duration) if duration
    oscillator


  playingUntil = undefined
  activeOscillator = undefined

  # Plays a tone for a specified amount of time
  playBeep = (freq, duration)->
    spacing = duration / 2

    # stop playing continuous
    if playingUntil == Infinity
      activeOscillator.stop(0)
      activeOscillator = null
    else if context.currentTime < playingUntil
      return

    activeOscillator = oscillate(freq, duration)
    playingUntil = context.currentTime + duration + spacing

  # Starts an un-ending tone
  playContinuous = (freq) ->
    return if context.currentTime < playingUntil

    activeOscillator = oscillate(freq)
    activeOscillator.continuous = true # our own custom detail
    playingUntil = Infinity

  # Stops all noise
  silence = ->
    if activeOscillator && activeOscillator.continuous
      activeOscillator.stop(0)
      activeOscillator = undefined
      playingUntil = undefined


  # Takes in a a target number and a range
  # Returns how far the target is from the closest end of the range
  # e.g.,
  # distanceFromSegment( 1.5, [0,1]) == 0.5
  # distanceFromSegment(-0.7, [0,1]) == 0.7
  distanceFromSegment = (number, range) ->
    if number > range[1]
      return number - range[1]
    if number < range[0]
      return range[0] - number
    return false # inside the segment

  setPannerPosition = (hand)->
    panner.setPosition(
      hand.stabilizedPalmPosition[0] / 100,
      hand.stabilizedPalmPosition[1] / 100,
      hand.stabilizedPalmPosition[2] / 100
    )

  # Bind the 'handLost' event, which is given by the handEntry plugin.
  @on 'handLost', ->
    # for now, we don't have fancy multi-hand support.
    silence()


  {
    hand: (hand)->
      return unless iBox = hand.frame.interactionBox

      # normalizePoint returns an array of three numbers representing fractional position within the interaction box.
      # e.g., a point in the middle of the box would be [0.5,0.5,0.5], and one outside to the right could be [0.5,1.2,0.5]
      proximities = iBox.normalizePoint(hand.palmPosition)
      for proximity in proximities
        if (distance = distanceFromSegment(proximity, [0,1]))
          hand.proximity = true

          setPannerPosition(hand)
          duration = scope.beepDuration(distance)
          if duration < scope.minBeepDuration
            playContinuous(scope.continuousFrq)
          else
            playBeep(scope.beepFrq, duration)

          return # for now, only check one proximity at a time.

      silence()
  }