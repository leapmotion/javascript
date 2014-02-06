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
		'topTouchZone': 25,
		'color': '#f33',
		'children':[{
				'class':'icon',
				'title': 'an app',
				'width': '40%',
				'height': '40%',
				'x': '5%',
				'y': '5%',
				'color': '#ddd',
				'body':'icon text',
		}],
	},{
		'class':'window',
		'title': 'Chat',
		'width': '20%',
		'height': '40%',
		'x': '70%',
		'y': '20%',
		'color': '#3f3',
		'topTouchZone': 25,
		'children':[],
	},{
		'class':'window',
		'title': 'Text Editor',
		'width': '50%',
		'height': '50%',
		'x': '20%',
		'y': '50%',
		'color': '#33f',
		'topTouchZone': 25,
		'children':[],
	}];

	$(window).resize(function(){
		screenWidth = $(window).width();
		screenHeight = $(window).height();
	});

	var update = function(){
		var time = new Date().getTime() / 1000.0;
		requestAnimationFrame(update);

		for(var inputEvent in inputEngine.events){
			//console.log(time, inputEngine.events[inputEvent].state, inputEngine.events[inputEvent].position);
		}

		for(var inputId in inputEngine.events)
		{
			var inputEvent = inputEngine.events[inputEvent];
			var position = inputEvent.position;
			position.x = position.x * screenWidth;
			position.y = screenHeight - (position.y * screenHeight);

			if(inputEvent.state == 'click') {
				var elem = document.elementFromPoint(position.x-1, position.y+1);

				bringToFront(elem);
				//console.log($(elem).attr('class'));
				if($(elem).attr('class') == 'window' || $(elem).attr('class') == 'icon'){
					selectElem(elem, inputId, position);
				}
			}
			else if(inputEvent.state == 'unclick')
			{
				deselectElem(inputId);
			}
			else if(inputEvent.state == 'move')
			{
				//console.log('move');
				var moveElem = function(elem, newPos)
				{
					//console.log("MoveElem", elem, newPos);
					var offset = {'x':0, 'y':0};
					offset.x = $(elem).attr('data-selectPosX');
					offset.y = $(elem).attr('data-selectPosY');

					console.log($(elem).attr('data-topTouchZone'));
					console.log(offset.y);
					console.log(offset.y <= (Number)($(elem).attr('data-topTouchZone')));
					if($(elem).attr('data-topTouchZone') == undefined || offset.y <= (Number)($(elem).attr('data-topTouchZone')))
					{
						var xPos = newPos.x - offset.x;
						var yPos = newPos.y - offset.y;

						$(elem).offset({'left':Math.max(xPos,0), 'top':Math.max(yPos,0)});
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
		}

		setWindowZOrder();
	}

	var selectElem = function(elem, clickId, clickPosition){
		console.log('select: ' + elem);
		$(elem).attr('data-selectId', clickId);
		$(elem).attr('data-selectPosX', clickPosition.x - $(elem).offset().left);
		$(elem).attr('data-selectPosY', clickPosition.y - $(elem).offset().top);
		
	}

	var deselectElem = function(clickId){
		var checkElem = function(elem){
			if($(elem).attr('data-selectId') == clickId){
				$(elem).attr('data-selectId', -1);
			}
		}

		windows.forEach(checkElem);
		icons.forEach(checkElem);
	}

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
			console.log(windows);
		} 
	}


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