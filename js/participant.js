$(function(){
	
	"use strict"
	
	var geolocation = new GeoLocation(true);
	var compass = new Compass();
	var waypoints = new Waypoints();
	
	var mapbox;
	var user_marker;
	
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
		
		// save in cookie
		localStorage.setItem("cid", cid);
		localStorage.setItem("username", "{Luke}");
		
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
	$.getJSON( "data/acton.json", function( data ) {			
		waypoints.setJSON(data);
		$(".js-waypoints").text( waypoints.getTotalWaypoints() );
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
		    iconSize: [48, 136]
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
			SETUP WAYPOINTS
		*/
		
		
		/*
			SHOW MAP VIEW
		*/		
		$("#welcome").hide();
		
		
		/*
			GET CURRENT STATE
		*/
		if ( !localStorage.getItem("skipStartPoint") ) {
			
			// add the start point to the map			
			var startMarker = new L.Marker([0, 0], {
				icon: L.icon({
					iconUrl: 'img/marker-user.png',
					iconSize: [48, 136]
				}),
			}).addTo(mapbox);
			
		}
		else {
			// just load the map points
		}
		
	};
	
});