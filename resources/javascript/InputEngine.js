(function(){
	var inputEngine = {
		"singleClicks": {},
		"events": {}, //Remove an event when you're done with it.
	} 

	var currentSingleClicks = {};

	//Click Object
	var Click = function(state, vector){
		return {
			'state': state,
			'position': vector,
		}
	}

	var update = function(){
		inputEngine.events = {};
		requestAnimationFrame(update);

		for(var clickId in currentSingleClicks){
			if(!(clickId in inputEngine.singleClicks)){
				inputEngine.events[clickId] = Click('unclick', currentSingleClicks[clickId]);
			}
			else 
			{
				if(currentSingleClicks[clickId] != inputEngine.singleClicks[clickId])
				{
					inputEngine.events[clickId] = Click('move', inputEngine.singleClicks[clickId]);
				}
			}
		}

		for(var clickId in inputEngine.singleClicks){
			if(!(clickId in currentSingleClicks)){
				inputEngine.events[clickId] = Click('click', inputEngine.singleClicks[clickId]);
			}
		}

		currentSingleClicks = inputEngine.singleClicks;
		inputEngine.singleClicks = {};
	}

	window.InputEngine = inputEngine;
	console.log(window.InputEngine);
	requestAnimationFrame(update);
})();