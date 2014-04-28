
/****************
 * Input Engine for taking clicks and actions
 * from the leap application and turning them
 * into events for the UI Engine.
 ***************/

(function(){
    var inputEngine = {
        "singleClicks": {},
        "doubleClicks": {},
        "altClicks": {},
        "events": {}, //Remove an event when you're done with it.
    }

    var currentSingleClicks = {};
    var currentAltClicks = {};
    var currentDoubleClicks = {};

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

        for(var clickId in InputEngine.doubleClicks){
            if(!(clickId in currentDoubleClicks)){
                inputEngine.events[clickId] = Click('doubleClick', inputEngine.doubleClicks[clickId]);
            }
        }

        //Alt Clicks
        for(var clickId in currentAltClicks){
            if(!(clickId in inputEngine.altClicks)){
                inputEngine.events[clickId] = Click('alt_unclick', currentAltClicks[clickId]);
            }
        }

        for(var clickId in inputEngine.altClicks){
            if(!(clickId in currentAltClicks)){
                inputEngine.events[clickId] = Click('alt_click', inputEngine.altClicks[clickId]);
            }
        }

        currentSingleClicks = inputEngine.singleClicks;
        currentAltClicks = inputEngine.altClicks;
        currentDoubleClicks = inputEngine.doubleClicks;
        inputEngine.singleClicks = {};
        inputEngine.altClicks = {};
        inputEngine.doubleClicks = {};
    }

    window.InputEngine = inputEngine;
    console.log(window.InputEngine);
    requestAnimationFrame(update);
})();