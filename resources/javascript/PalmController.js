$( document ).ready(function(){
	console.log("Go");
	const PALM_TRACKING = true;
	const HAND_DIRECTION = false;
	const PINCH_CLICK = true;
	const KEY_CLICK = true;
	const LEAP_MIN = { 'x':-15.0, 'y':15.0, 'z':-20.0 };
	const LEAP_MAX = { 'x': 15.0, 'y':26.0, 'z': 20.0 };
	const PINCH_MIN = 0.7;
	const MAX_HANDS = 2;

	var inputEngine = window.InputEngine;
	var currentFrame;
	var deltaTime = 0; //Seconds
	var lastTime = new Date().getTime() / 1000.0; //Seconds
	var screenWidth = $(window).width();
	var screenHeight = $(window).height();

	$(window).resize(function(){
		screenWidth = $(window).width();
		screenHeight = $(window).height();
	});

	//Vector Factory
	var Vector = function(mX,mY,mZ){
		return { 
			'x':typeof mX!=='undefined'?mX:0, 
			'y':typeof mY!=='undefined'?mY:0, 
			'z':typeof mZ!=='undefined'?mZ:0, 
		};
	}

	var setup = function() {
		for(var i=0;i<MAX_HANDS;i++){
			$('body').append("<div class='cursor' id=cursor_"+i+"><img src='resources/images/cursor.png' /></div>");
			$('#cursor_'+i).hide();
		}
	}

	var update = function(frame) {
		var clickCoordinants = {};
		deltaTime = (new Date().getTime() / 1000.0) - lastTime;
		
		for(var i=0;i<MAX_HANDS;i++){
			if(i < frame.hands.length){
				var hand = frame.hands[i];
				if(hand.valid){
					var position = palmTracking(hand);
					if(PINCH_CLICK && pinchTest(hand)) { clickCoordinants[hand.id] = position; }
					drawHand(position, i);
				}
			}
			else {
				hideHand(i);
			}
		}

		if(KEY_CLICK){
			frame.gestures.forEach(function(gesture){
				if(gesture.type == 'keyTap'){
					if(indexTest(frame, gesture.handIds[0], gesture.pointableIds[0]))
					{
						var hand = idToHand(frame, gesture.handIds[0]);
						clickCoordinants[hand.id] = position;
					}
				}
			});
		}

		clickBehavior(clickCoordinants);
	}

	var clickBehavior = function(clickCoords){
		for(var click in clickCoords)
		{
			inputEngine.singleClicks[click] = clickCoords[click];
		}
	}

	var pinchTest = function(hand){
		return hand.pinchStrength >= PINCH_MIN;
	}

	var indexTest = function(frame, hand_id, finger_id){
		var hand = idToHand(frame, hand_id);
		return hand.fingers[1].id == finger_id;
	}

	var idToHand = function(frame, hand_id){
		var retHand;
		frame.hands.forEach(function(hand){
			if(hand.id == hand_id) { retHand = hand; }
		});
		return retHand;
	}

	//return normalized palm position
	var palmTracking = function(hand){
		var palmPos = Vector(hand.palmPosition[0]/10.0, hand.palmPosition[1]/10.0, hand.palmPosition[2]/10.0);
	 	 palmPos.x = Math.max(0,Math.min(0.99,(palmPos.x - LEAP_MIN.x) / (LEAP_MAX.x - LEAP_MIN.x)));
	 	 palmPos.y = Math.max(0.01,Math.min(1,(palmPos.y - LEAP_MIN.y) / (LEAP_MAX.y - LEAP_MIN.y)));
	 	 palmPos.z = Math.max(0,Math.min(0.99,(palmPos.z - LEAP_MIN.z) / (LEAP_MAX.z - LEAP_MIN.z)));
	 	 return palmPos;
	}

	//returns if the current hand is on sceen
	var drawHand = function(handPosition, index){
		var cursor = $('#cursor_'+index);
		cursor.show();
		var l = handPosition.x * screenWidth;
		var t = screenHeight - (handPosition.y * screenHeight);
		$('#cursor_'+index).offset({ top: t, left: l });
	}

	var hideHand = function(index){
		$('#cursor_'+index).hide();
	}

	setup()
	Leap.loop({enableGestures: true}, update); 
});