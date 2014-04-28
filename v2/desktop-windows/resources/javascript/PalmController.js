/****************
 *
 * LeapMotion Skeletal Pinch Detection Example
 * Author: Daniel Plemmons
 *
 * Shows basic pinch detection and sends that pinch to
 * a basic UI engine allowing users to drag around windows
 * by grabbing a title bar.
 *
 ***************/

var announce_id = 0;
var ANN_DELAY = 1500;
function announce(event, data){
    $('#event').append('<div id="ann_' + announce_id + '"><b>' + event + '</b>:' + data + '</div>');
    var aid = announce_id;
    ++announce_id;
    setTimeout(function(){
        $('#ann_' + aid).hide();
    }, ANN_DELAY);
}


$( document ).ready(function(){
    console.log("Go");
    const PALM_TRACKING = true;
    const HAND_DIRECTION = false;
    const TRIGGER_CLICK = true;
    const PINCH_CLICK = true;
    const PINCH_DOUBLE = false;
    const ALT_PINCH = false;
    const DOUBLE_TAP = false;
    const KEY_CLICK = true;
    const LEAP_MIN = { 'x':-15.0, 'y':15.0, 'z':-20.0 };
    const LEAP_MAX = { 'x': 15.0, 'y':26.0, 'z': 20.0 };
    const PINCH_MIN = 0.7;
    const MAX_HANDS = 2;
    const TRIGGER_BOUND = 0.8;
    const ALT_PINCH_BOUND = 27.0;

    var inputEngine = window.InputEngine;
    var currentFrame;
    var deltaTime = 0; //Seconds
    var lastTime = new Date().getTime() / 1000.0; //Seconds
    var screenWidth = $(window).width();
    var screenHeight = $(window).height();

    /*
     * If the window gets resized, get the new sizes.
     * Calling the dom for this every frame is slow.
     */

    $(window).resize(function(){
        screenWidth = $(window).width();
        screenHeight = $(window).height();
    });

    /*
     * Symantic sugar. Maps finger names to IDs.
     */
    const fingerMap = {
        'thumb': 0,
        'index': 1,
        'middle':2,
        'ring': 3,
        'pinky': 4,
    }

    /*
     * Add the cursors to the page.
     */
    var setup = function() {
        for(var i=0;i<MAX_HANDS;i++){
            $('body').append("<div class='cursor' id=cursor_"+i+"><img src='https://s3-us-west-2.amazonaws.com/s.cdpn.io/109794/cursor.png' /></div>");
            $('#cursor_'+i).hide();
        }
    }

    /*
     * Look for all enabled gestures and run their behaviors
     */
    var update = function(frame) {
        var clickCoordinants = {};
        var altclickCoordinants = {};
        var doubleClickCoordinants = {};
        var position;
        deltaTime = (new Date().getTime() / 1000.0) - lastTime;

        for(var i=0;i<MAX_HANDS;i++){
            if(i < frame.hands.length){
                var hand = frame.hands[i];
                if(hand.valid){
                    var position = normalizeVector(hand.palmPosition);
                    if(ALT_PINCH && altPinchTest(hand)) {
                        altclickCoordinants[hand.id] = position;
                    }
                    else if(PINCH_CLICK && fingerSpecificPinchTest(fingerMap.index, hand)) {
                        clickCoordinants[hand.id] = position;
                    }
                    else if(TRIGGER_CLICK && triggerTest(hand)) {
                        clickCoordinants[hand.id] = position;
                    }
                    else if(PINCH_DOUBLE && fingerSpecificPinchTest(fingerMap.middle, hand)) {
                        doubleClickCoordinants[hand.id] = position;
                    }

                    drawHand(position, i);
                }
                else
                {
                    hideHand(i);
                }
            }
            else {
                hideHand(i);
            }
        }

        //Double click with double keytap.
        if(DOUBLE_TAP){
            var tappingHands = doubleKeytapList(frame);

            tappingHands.forEach(function(hand){
                position = normalizeVector(hand.palmPosition);
                doubleClickCoordinants[hand.id] = position;
            });
        }

        //Single click with single keytap
        if(KEY_CLICK){
            frame.gestures.forEach(function(gesture){
                if(gesture.type == 'keyTap'){
                    if(fingerPositionTest(frame, gesture.pointableIds[0], fingerMap.index, gesture.handIds[0]))
                    {
                        var hand = frame.hand(gesture.handIds[0]);
                        if(!(hand.id in doubleClickCoordinants)){
                            position = normalizeVector(hand.palmPosition);
                            clickCoordinants[hand.id] = position;
                        }
                    }
                }
            });
        }

        clickBehavior(clickCoordinants);
        doubleClickBehavior(doubleClickCoordinants);
        altClickBehavior(altclickCoordinants);
    }

    /*
     * Returns a list of hands that have double keytapped with
     * their index and middle or ring fingers.
     */
    function doubleKeytapList(frame){
        gestures = frame.gestures;
        var handList = [];
        var handHash = {};

        gestures.forEach(function(gesture){
            if(gesture.type == 'keyTap' && gesture.handIds[0] != undefined){
                if(gesture.handIds[0] in handHash){
                    handHash[gesture.handIds[0]][frame.finger(gesture.pointableIds[0]).type] = 1;
                }
                else {
                    handHash[gesture.handIds[0]] = {};
                    handHash[gesture.handIds[0]][frame.finger(gesture.pointableIds[0]).type] = 1;
                }
            }
        });


        for(var handId in handHash){
            var tappingFingers = handHash[handId];

            console.log(tappingFingers);

            if(fingerMap.index in tappingFingers && (fingerMap.middle in tappingFingers || fingerMap.ring in tappingFingers))
            {
                handList.push(frame.hand(handId));
            }
        }

        return handList;
    }

    /*
     * Logic to run on the single clicks detected
     */
    function clickBehavior(clickCoords){
        for(var click in clickCoords)
        {
            inputEngine.singleClicks[click] = clickCoords[click];
        }
    }

    /*
     * Logic to run on the double clicks detected
     */
    function doubleClickBehavior(doubleClickCoords){
        //console.log("doubleClickCoords: " + doubleClickCoords);
        for(var click in doubleClickCoords)
        {
            inputEngine.doubleClicks[click] = doubleClickCoords[click];
        }
    }

    /*
     * Logic to run on the alt clicks detected
     */
    function altClickBehavior(altClickCoords){
        for(var click in altClickCoords)
        {
            inputEngine.altClicks[click] = altClickCoords[click];
        }
    }

    /*
     * Basic pinch between Thumb and any finger
     */
    function basicPinchTest(hand){
        return hand.pinchStrength >= PINCH_MIN;
    }

    /*
     * Tests if the user is pinching with both their index and middle finger.
     */
    function altPinchTest(hand){
        var retVal = false;
        var index = fingerAtPosition(fingerMap.index, hand);
        var middle = fingerAtPosition(fingerMap.middle, hand);
        var isIndexPinching = fingerSpecificPinchTest(fingerMap.index, hand);

        if(isIndexPinching){
            var indexPosition = leapToVector(index.pipPosition);
            var middlePosition = leapToVector(middle.pipPosition);
            var diff = middlePosition.subtract(indexPosition);
            var mag = diff.magnitude();
            if(mag <= ALT_PINCH_BOUND){ retVal = true; }
        }

        return retVal;
    }

    /*
     * Pinch test where the pinch must be from a given finger.
     * Function is expanded for ease of debugging.
     */
    function fingerSpecificPinchTest(finger_position, hand) {
        var retVal = false;
        var isPinching = hand.pinchStrength >= PINCH_MIN;

        if(isPinching)
        {
            var thumb = fingerAtPosition(0, hand);
            var closeFinger = findClosestFingerTo(thumb.id, hand);
            var closePosition = closeFinger.type;
            var isCorrectFinger = closePosition == finger_position;
            retVal = isCorrectFinger;
        }

        return retVal;
    }

    /*
     * Test if the thumb and index finger are pointed in more or less the same direction.
     * As if the user had just pulled the trigger on a fake gun. *Bang Bang*
     */
    function triggerTest(hand){
        var thumb = fingerAtPosition(fingerMap.thumb, hand);
        var index = fingerAtPosition(fingerMap.index, hand);
        var middle = fingerAtPosition(fingerMap.middle, hand);
        var ring = fingerAtPosition(fingerMap.ring, hand);
        var pinky = fingerAtPosition(fingerMap.pinky, hand);

        var dir1 = (new Vector(thumb.dipPosition[0],thumb.dipPosition[1],thumb.dipPosition[2]).subtract(new Vector(thumb.pipPosition[0],thumb.pipPosition[1],thumb.pipPosition[2])));
        var dir2 = (new Vector(index.dipPosition[0],index.dipPosition[1],index.dipPosition[2]).subtract(new Vector(index.pipPosition[0],index.pipPosition[1],index.pipPosition[2])));
        var dot = dir1.dotProduct(dir2);

        if(dot >= TRIGGER_BOUND && index.extended && !middle.extended && !ring.extended && !pinky.extended) { return true; }
    }

    /*
     * Find the closest finger to the given ID on the hand.
     */
    function findClosestFingerTo(finger_id, hand){
        var baseFinger = hand.finger(finger_id);
        if(baseFinger.valid) {
            var basePosition = normalizeVector(
                baseFinger.stabilizedTipPosition
              //  baseFinger.tipPosition
            );
            var minDist = Number.MAX_VALUE;
            var minFinger = undefined;
            var distances = [];
            hand.fingers.forEach(function(finger){
                if(finger.id != finger_id){
                    var fingerPosition = normalizeVector(finger.tipPosition);
                    var dist = basePosition.squaredDistanceTo(fingerPosition);
                    distances.push(Math.round(dist*100)/100);
                    if(dist < minDist) {
                        minDist = dist;
                        minFinger = finger;
                    }
                }
            });
            return minFinger;
        }
        else {
            return undefined;
        }
    }

    /*
     * Find the finger on the hand at a given position
     */
    function fingerAtPosition(finger_position, hand){
        for(var i=0;i<hand.fingers.length;i++){
            if(hand.fingers[i].type == finger_position) { return hand.fingers[i]; }
        }

        return undefined;
    }

    /*
     * Test if the given finger_id in goal_position on the given hand.
     * Example: Is this finger ID an index finger. fingerTest(frame, myFinger.id, fingerMap.index, myHand.id)
     */
    function fingerPositionTest(frame, finger_id, goal_position, hand_id){
        var hand = frame.hand(hand_id);
        return hand.fingers[goal_position].id == finger_id;
    }

    /*
     * Return normalized palm position
     */
    function normalizeVector(position){
        var palmPos = new Vector(position[0]/10.0, position[1]/10.0, position[2]/10.0);
        palmPos.x = Math.max(0,Math.min(0.99,(palmPos.x - LEAP_MIN.x) / (LEAP_MAX.x - LEAP_MIN.x)));
        palmPos.y = Math.max(0.01,Math.min(1,(palmPos.y - LEAP_MIN.y) / (LEAP_MAX.y - LEAP_MIN.y)));
        palmPos.z = Math.max(0,Math.min(0.99,(palmPos.z - LEAP_MIN.z) / (LEAP_MAX.z - LEAP_MIN.z)));
        return palmPos;
    }

    /*
     * Move the given cursor to the given hand position.
     * Returns if the current position is on sceen.
     */
    function drawHand(handPosition, index){
        var cursor = $('#cursor_'+index);
        cursor.show();
        var l = handPosition.x * screenWidth;
        var t = screenHeight - (handPosition.y * screenHeight);
        $('#cursor_'+index).offset({ top: t, left: l });
    }

    function hideHand(index){
        $('#cursor_'+index).hide();
    }

    setup()
    Leap.loop({enableGestures: true}, update);
});

/****************
 * UI Engine for pushing the windows in the
 * DOM. Takes events from the Input Engine.
 ***************/

(function(){
    var inputEngine = window.InputEngine;
    var windows = [];
    var icons = [];
    var screenWidth = $(window).width();
    var screenHeight = $(window).height();
    var windowCount = 0;

    var ui = [{
        'class':'window',
        'title': 'Browser',
        'width': '50%',
        'height': '50%',
        'x': '5%',
        'y': '5%',
        'topTouchZone': 100,
        'color': '#aaa',
        /*'children':[{
         'class':'icon',
         'title': 'an app',
         'width': '40%',
         'height': '40%',
         'x': '5%',
         'y': '5%',
         'color': '#ddd',
         'body':'Icon Text',
         }],*/
    },{
        'class':'window',
        'title': 'Chat',
        'width': '20%',
        'height': '40%',
        'x': '70%',
        'y': '20%',
        'color': '#aaa',
        'topTouchZone': 100,
        'children':[],
    },{
        'class':'window',
        'title': 'Text Editor',
        'width': '50%',
        'height': '50%',
        'x': '20%',
        'y': '50%',
        'color': '#aaa',
        'topTouchZone': 100,
        'children':[],
    }];

    $(window).resize(function(){
        screenWidth = $(window).width();
        screenHeight = $(window).height();
    });
    /*
     * UI update loop. Parses the incoming input events and
     * preforms the proper behaviors.
     */
    var update = function(){
        var time = new Date().getTime() / 1000.0;
        requestAnimationFrame(update);

        for(var inputId in inputEngine.events)
        {
            var inputEvent = inputEngine.events[inputId];
            var position = inputEvent.position;
            position.x = position.x * screenWidth;
            position.y = screenHeight - (position.y * screenHeight);

            if(inputEvent.state == 'click') {
                var elem = document.elementFromPoint(position.x-1, position.y+1);

                bringToFront(elem);
                if($(elem).attr('class') == 'window' || $(elem).attr('class') == 'icon'){
                    announce('click', elem.id);
                    selectElem(elem, inputId, position);
                }
            }
            else if(inputEvent.state == 'unclick')
            {
                deselectElem(inputId);
            }
            else if(inputEvent.state == 'move')
            {
                var moveElem = function(elem, newPos)
                {
                    var offset = {'x':0, 'y':0};
                    offset.x = $(elem).attr('data-selectPosX');
                    offset.y = $(elem).attr('data-selectPosY');

                    if($(elem).attr('data-topTouchZone') == undefined || offset.y <= (Number)($(elem).attr('data-topTouchZone')))
                    {
                        var xPos = newPos.x - offset.x;
                        var yPos = newPos.y - offset.y;

                        $(elem).offset({'left':Math.min(Math.max(xPos,0), window.innerWidth - 100), 'top':Math.min(window.innerHeight - 100, Math.max(yPos,0))});
                    }
                }

                var moveProperElem = function(clickId, elem, newPos)
                {
                    if($(elem).attr('data-selectId') == clickId){
                        moveElem(elem, newPos);
                    }
                }

                windows.forEach(function(elem){ moveProperElem(inputId, elem, inputEvent.position); });
            }
            else if(inputEvent.state == 'doubleClick')
            {
                console.log('double click hide');
                var elem = document.elementFromPoint(position.x-1, position.y+1);
                console.log("doubleClick");
                $(elem).hide().slideDown(50);
            }
            else if(inputEvent.state == 'alt_click')
            {
                console.log("alt_click: " + inputId);
            }
            else if(inputEvent.state == 'alt_unclick')
            {
                console.log("alt_unclick: " + inputId);
            }
        }

        setWindowZOrder();
    }

    /*
     * Set the data-selectId and position properties of the
     * given element to the given clickId. These properties
     * are used to determine if an element is selected by
     * a particular clickId and where the initial selection
     * ocurred relative to the object.
     */
    var selectElem = function(elem, clickId, clickPosition){
        $(elem).attr('data-selectId', clickId);
        $(elem).attr('data-selectPosX', clickPosition.x - $(elem).offset().left);
        $(elem).attr('data-selectPosY', clickPosition.y - $(elem).offset().top);

    }

    /*
     * Unset the data-selectedId property of elements selected by the
     * given clickID. This property is used to determine if an element
     * is currently selected by a given clickID.
     */
    var deselectElem = function(clickId){
        var checkElem = function(elem){
            if($(elem).attr('data-selectId') == clickId){
                $(elem).attr('data-selectId', -1);
            }
        }

        windows.forEach(checkElem);
        icons.forEach(checkElem);
    }

    /*
     * Using the ordering in the 'windows' list
     * This element will still be behind the cursors.
     */
    var setWindowZOrder = function(){
        var ittr = 9998;

        $('.cursor').each(function(){
            $(this).css('z-index', 9999);
        });

        windows.forEach(function(elem){
            if(ittr == 9998) { $(elem).css('box-shadow', '3px 3px 10px #333'); }
            else { $(elem).css('box-shadow', '2px 2px 8px #888'); }
            $(elem).css('z-index', ittr);
            ittr--;
        });
    }

    /*
     * Bring the given element to the front of the windows list.
     * setWindowZOrder() uses the order of elements in this list
     * to set the z-order of elements on the page.
     */
    var bringToFront = function(elem) {
        var ittr = 0;
        var found = false;

        if($(elem).attr('class') == 'icon'){
            elem = $(elem).parent();
        }

        for(ittr=0;ittr<windows.length;ittr++)
        {
            var elem2 = windows[ittr];
            if($(elem).attr('id') == $(elem2).attr('id')) {
                found = true;
                break;
            }
        }

        if(found){
            elem = windows.splice(ittr, 1);
            windows.unshift(elem[0]);
        }
    }

    /*
     * Parse the UI JSON and create HTML for the UI.
     * This mostly exists to keep the visual defenition in the UI Engine.
     */
    var startUIParse = function(){
        var jsonToHTML = function(uiElement){
            var htmlString = "";


            if(uiElement.hasOwnProperty("class")) {
                htmlString += "<div ";
                htmlString += "class="+uiElement.class+" ";
                if(uiElement.class == 'window') { windowCount++; htmlString+='id="window_'+windowCount+'" ' }
                htmlString += 'style="';
                if('width' in uiElement) htmlString += 'width:'+uiElement.width+'; ';
                if('height' in uiElement) htmlString += 'height:'+uiElement.height+'; ';
                if('x' in uiElement) htmlString += 'left:'+uiElement.x+'; ';
                if('y' in uiElement) htmlString += 'top:'+uiElement.y+'; ';
                if('color' in uiElement) htmlString += 'background-color:'+uiElement.color+'; ';
                htmlString += '" ';
                if('topTouchZone' in uiElement) htmlString += 'data-topTouchZone='+uiElement.topTouchZone+" ";
                htmlString += ">";
            }

            if('body' in uiElement) htmlString += uiElement.body;

            if(uiElement.hasOwnProperty("children") && uiElement.children.length > 0)
            {
                uiElement.children.forEach(function(childElement){
                    htmlString += jsonToHTML(childElement);
                });
            }

            if('class' in uiElement) htmlString += "</div>";
            return htmlString;
        }

        var htmlString = "";
        ui.forEach(function(root){
            htmlString+=jsonToHTML(root);
        });
        $("body").append(htmlString);
        $(".window").each(function(){
            windows.push(this);
        });

        $(".icon").each(function(){
            icons.push(this);
        });
        windows.forEach(function(elem){
            console.log(windows[elem]);
        });
    }

    startUIParse();
    requestAnimationFrame(update);
})();