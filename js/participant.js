$(function(){
	
	"use strict"
	
	var JSON_WAYPOINTS_FILE = "data/islington.json";
	var DISTANCE_THRESHOLD = 20;
	
	var geolocation = new GeoLocation(true);
	var compass = new Compass();
	var waypoints = new Waypoints();
	var soundplayer = new SoundPlayer();
	
	var mapbox;
	var user_marker;
	var markers;
	var timerID;
	var startTime;
	var lastWaypointTime;
	var waypointReminderIndex;
	
	/*
		CHECK COOKIE
	*/
	if ( !localStorage.getItem("cid") ) {
		console.log("new user");
	} else {
		console.log("returning user");
		$("input[name=CID]").val( localStorage.getItem("cid") );
		$(".js-cid").text( localStorage.getItem("cid") );
		$(".js-username").text( localStorage.getItem("username") );
		$("input[name=START]").val( "RESUME" );
	}
	
	/*
		CLEAR COOKIE
	*/
	$("input[name=CLEARCACHE]").on("click", function(e){
		localStorage.clear();
		location.reload();
	});
	
	/*
		LISTEN FOR SUBMIT EVENT ON FORM
	*/
	$("#welcome_form").on("submit", function(){
		
		var cid = $(this).find("input[name=CID]").val();
		var fname = getNameFromCID( cid );
		
		// save in cookie
		localStorage.setItem("cid", cid);
		localStorage.setItem("username", fname);
		
		// load from cookie
		$(".js-cid").text( localStorage.getItem("cid") );
		$(".js-username").text( localStorage.getItem("username") );
		
		if (cid == "") {
			alert("You must enter your Citizen ID to start");
		}
		else {
			// remove event listeners
			$("#welcome_form").off().hide();
			
			if ( !localStorage.getItem("showIntro") ) {
				
				localStorage.setItem("showIntro", true);
				
				// welcome animation
				$("#welcome header").hide();
				$("#welcome_animation").show();
				$("#welcome_animation li").each(function(index){					
					$(this).hide().delay(700*index).fadeIn();
				});
				
				var n = $("#welcome_animation li").size();				
				setTimeout(init, n*600+3000);
			}
			else {
				
				// straight to map
				init();				
			}			
		}
		
		// stop default behaviour
		return false;
	});
	
	
	/*
		LISTEN FOR CLICK EVENT ON INFO BUTTON
	*/
	$("#header_info a").on("click", function(e){
		e.preventDefault();		
		$("#info").toggle();
	});
	
	
	/* 
		NUDGE EACH OF THE VIEWS DOWN BELOW THE MENU
	*/
	$('.view').each(function(){
		$(this).css({'margin-top': $('#header').height() + 'px'});	
	});
	
	
	/*
		LOAD THE WAYPOINTS IN THE BACKGROUND
	*/
	$.getJSON(JSON_WAYPOINTS_FILE, function( data ) {			
		waypoints.setJSON(data);
		$(".js-waypoints").text( waypoints.totalWaypoints() );
	});
	
	
	
	function init(){
		
		/*
			CREATE A CUSTOM MARKER TO BE ROTATED
		*/
	    L.RotatedMarker = L.Marker.extend({
			options: { angle: 0 },
			_setPos: function(pos) {
				L.Marker.prototype._setPos.call(this, pos);
				if (L.DomUtil.TRANSFORM) {
					// use the CSS transform rule if available
					this._icon.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.angle + 'deg)';
				} else if (L.Browser.ie) {
					// fallback for IE6, IE7, IE8
					var rad = this.options.angle * L.LatLng.DEG_TO_RAD,
					costheta = Math.cos(rad),
					sintheta = Math.sin(rad);
					this._icon.style.filter += ' progid:DXImageTransform.Microsoft.Matrix(sizingMethod=\'auto expand\', M11=' +
			costheta + ', M12=' + (-sintheta) + ', M21=' + sintheta + ', M22=' + costheta + ')';
				}
			}
		});


		/*
			SETUP MAPBOX
		*/		
		mapbox = L.mapbox.map('mapbox', 'mapbox.streets', {
			accessToken: "pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg"
		}).setView([geolocation.latitude, geolocation.longitude], 16);
		
		user_marker = new L.RotatedMarker([geolocation.latitude, geolocation.longitude], {
		    icon: L.icon({
		    iconUrl: 'img/marker-user.png',
		    iconSize: [48, 104]
		  }),
		}).addTo(mapbox);
		
		
		/*
			SETUP GEOLOCATION EVENTS
		*/
		if (geolocation.isSupported == true) {
			
			$("#js-geolocation").text("supported");
			
			$(document).on("geolocationChange", function(event){

				$("#js-longitude").text(event.detail.longitude);
				$("#js-latitude").text(event.detail.latitude);
				
				user_marker.setLatLng( [event.detail.latitude, event.detail.longitude] );
				
				if (!localStorage.getItem("currentWaypoint")){
					
					// must be showing start point
					checkStartDistance();
					
				} else {
					// must be showing waypoints
					checkStoryDistance();
					checkWaypointDistance();
				}
				
			});			
			geolocation.watchPosition();
			
		}
		else {		
			$("#js-geolocation").text("not supported");			
		}
		
		
		/*
			SETUP COMPASS EVENTS
		*/
		if (compass.isSupported) {
			
			$("js-deviceOrientation").text("supported");
			
			$(document).on("compassChange", function(e) {	
				
				$("#js-heading").text(e.detail.heading);	
						
				user_marker.options.angle = -e.detail.heading * (180 / Math.PI);
			    user_marker.setLatLng( [geolocation.latitude, geolocation.longitude] );
				
			});		
			
			compass.start();
		}
		else {
			$("js-deviceOrientation").text("not supported");
		}
		
		
		/*
			SHOW MAP VIEW
		*/		
		$("#welcome").hide();
		
		
		/*
			SETUP CURRENT MAP STATE
		*/
		if ( !localStorage.getItem("currentWaypoint") ) {
			loadStartMap();
		}
		else {
			loadWaypointMap();
		}
		
	};
	
	
	/*
		add the start point to the map	
	*/
	function loadStartMap(){
		
		$("#map_start").show();
		$("#map_statistics").hide();
		
		console.log("loadStartMap");
		
		markers = [];
		
		var startMarker = new L.Marker(waypoints.getLatLng(0), {
			icon: L.icon({
				iconUrl: 'img/marker-start.png',
				iconSize: [30, 30]
			}),
		}).addTo(mapbox);
		
		markers.push(startMarker);
		
	}
	
	function checkStartDistance(){
		console.log("checkStartDistance");
		
		var dist = Math.floor( user_marker.getLatLng().distanceTo( waypoints.getLatLng(0) ) );
		$(".js-distanceFrom").text( dist );
		
		if (dist <= DISTANCE_THRESHOLD) {
			
			// close enough, clear the map
			for (var m in markers){
				mapbox.removeLayer(markers[m]);
			}
			
			// save in cookie to stop multiple calls
			localStorage.setItem("currentWaypoint", -1);
			
			// load the route, load the 
			loadWaypointMap();
		}
	}
	
	function loadWaypointMap(){
		
		$("#map_start").hide();
		$("#map_statistics").show();
				
		var n = localStorage.getItem( "currentWaypoint");
		
		console.log("currentWaypoint = " +  n );
		
		if ( n < 0 ) {
			
			console.log(">> play welcome");
			
			soundplayer.play( "audio/hmcro/1_Welcome.mp3" );
						
			localStorage.setItem("currentWaypoint", 0);
			
		}
		else {	
				
			console.log(">> start from waypoint: " + n);
			
			waypoints.index = n;
			
			soundplayer.play( waypoints.data.waypoints[n-1].mp3 );
			
		}
		
		$(".js-currentWaypoint").text(waypoints.index);
		$(".js-messagePlay").text(waypoints.totalStories() - waypoints.getStories().length );
		
		markers = [];
		
		var polyline = L.polyline([], {
			color: '#f15a24',
			weight: 10,
			opacity: 1.0
			
		}).addTo(mapbox);
		
		markers.push(polyline);
		
		var yourMarker = L.icon({
			iconUrl: 'img/marker-primary.png',
			iconSize: [15, 15]
		});
		
		var miscMarker = L.icon({
			iconUrl: 'img/marker-secondary.png',
			iconSize: [10, 10]
		});
		
		// save the state
		var wArr = waypoints.getWaypoints();
				
		for (var i in wArr){
			polyline.addLatLng( [ wArr[i].latitude, wArr[i].longitude ] );
		}

		$(".js-messages").text( waypoints.totalStories() );

		var stories = waypoints.getStories();
		
		for (var s in stories) 
	    {
		    /* change the alpha based on type of story */
		    console.log(stories[s].dir);
		    
		    switch (stories[s].dir) {
			    
				case "adversity" :
					console.log("adversity");
					var m = L.marker([ stories[s].latitude, stories[s].longitude ], {
						icon: 		yourMarker,
						clickable: 	false,
						keyboard: 	false,
						opacity:	1.0
					}).addTo(mapbox);
					markers.push(m);
				    break;
				    
			    case "affluent" :			    
			    case "comfortable" :			    
			    case "prosperity" :			    
			    case "stretched" :			    
			    case "hmcro" :
			    default :
				    console.log("other");
				    var m = L.marker([ stories[s].latitude, stories[s].longitude ], {
						icon: 		miscMarker,
						clickable: 	false,
						keyboard: 	false,
						opacity:	1.0
					}).addTo(mapbox);
					markers.push(m);
				    break;
		    }   
	    }
	    
	    startTime = lastWaypointTime = new Date().getTime();
	    
		timerID = setInterval(function(){
			
			onTimerTick.call(this);
		    
		}, 1000);
	}
	
	function checkStoryDistance(){
		
		var stories = waypoints.getStories();
		
		for (var s in stories) {
			
			var dist = user_marker.getLatLng().distanceTo( [stories[s].latitude, stories[s].longitude] );
	
	        if ( dist <= DISTANCE_THRESHOLD ) {
	            // play story
	            soundplayer.play( stories[s].mp3 );
	            
	            $(".js-messagePlay").text(waypoints.totalStories() - waypoints.getStories().length );
	            
	            // remove waypoints from array
	            waypoints.removeStory(s);
	        }
	    }
	}
	
	function checkWaypointDistance(){
		
		console.log("checkWaypointDistance");
		
		var wp = localStorage.getItem("currentWaypoint");
		var dist = Math.floor( user_marker.getLatLng().distanceTo( waypoints.getLatLng( wp ) ) );
		
		$(".js-distanceFrom").text( dist );
		
		if (dist <= DISTANCE_THRESHOLD) {
			console.log("close enough");
			
			// play sound
			soundplayer.play( waypoints.getMp3( wp ), (wp>0) );
						
			lastWaypointTime = new Date().getTime();
			
			if ( wp < waypoints.totalWaypoints()-1 ) {			
				
				// save in cookie to stop multiple calls
				wp++;
				console.log("next waypoint = " + wp);
				localStorage.setItem( "currentWaypoint", wp );
				$(".js-currentWaypoint").text( wp );
			}
			else {
				
				// it's over
				soundplayer.play( "audio/hmcro/21_Over.mp3", true );
				
				for (var m in markers){
					mapbox.removeLayer(markers[m]);
				}
				
				clearInterval(timerID);
				geolocation.stop();
				$(document).on("geolocationChange");
				compass.stop();
				$(document).off("compassChange");			
				
			}
		}
	}
	
	function onTimerTick(){
		var wp = localStorage.getItem("currentWaypoint");
		var now = new Date().getTime();

	    var date_diff = new Date( now - startTime );
	    var diff_min = date_diff.getMinutes();
	    var diff_sec = date_diff.getSeconds();
	    /* format and display duration */
	    if (diff_min < 10) diff_min = "0" + diff_min;
	    if (diff_sec < 10) diff_sec = "0" + diff_sec;
	    $(".js-duration").text(diff_min + ":" + diff_sec );
	    $(".js-distanceFrom").text(66 * date_diff.getMinutes());
	    
	    var waypoint_time_diff = new Date( now - lastWaypointTime );
	    var waypoint_time_diff_min = waypoint_time_diff.getMinutes();
	
	    if (waypoint_time_diff_min > 2 && waypointReminderIndex != wp) {
	        waypointReminderIndex = wp;
	        var mp3_file = "audio/hmcro/TimeKeeping_"+Math.floor(Math.random()*6.99)+".mp3";	
	        soundplayer.play( mp3_file, true );
	    }
	}
	
	function getNameFromCID( cid ){
		var users = {
			"4755674":"Bentley", 
			"4755675":"Vladimir", 
			"4755676":"Annelise", 
			"4755677":"Sam", 
			"4755678":"Kim-Leigh", 
			"4755679":"geoffrey", 
			"4755672":"Janna", 
			"4755671":"Chris", 
			"4755669":"Cosimo", 
			"4755667":"Joshua", 
			"4755664":"Shamik", 
			"4755662":"Ruko", 
			"4755661":"Ivy", 
			"4755660":"Brian", 
			"4755659":"Thea", 
			"4755658":"Ankkit", 
			"4755657":"Nick", 
			"4755656":"Joseph", 
			"4755654":"Ted", 
			"4755652":"Mette", 
			"4755651":"Andrew", 
			"4755650":"Naama", 
			"4755649":"Lucie", 
			"4755647":"Joseph", 
			"4755646":"Nina", 
			"4755645":"Charlotte"
		}
		
		var n = users[cid];
		
		if (!n) {
			console.warn("no matching name");
		}
		else {
			return n;
		}
	}
	
});