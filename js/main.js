$(function(){
	
	
	/*
		SETUP SCREEN ORIENTATION
	*/
// 	window.screen.lockOrientation('portrait');
	
	
	/* 
		SETUP CODE FOR TABS 
	*/
	var $list_elements = [];
	var $tab_elements = [];
	var current_index = 0;
	
	$('#view-menu a').each(function( _index, _element ){
			
		/* get the href/ID for each tab from the nav */
		var href = $(_element).attr('href');
		
		/* get the DOM elements */
		var $list_element = $(_element).parent();
		var $tab_element = $(href);
		
		/* add button and tab to arrays */
		$list_elements.push( $list_element );
		$tab_elements.push( $tab_element );
		
		/* add click event to button */
		$( _element ).click(function(e){
			e.preventDefault();
			gotoTab( _index );
		});
		
		/* hide the tab initially */
		$tab_element.hide();
	});
	
	var gotoTab = function( _index ){
		
		/* clear active tab */
		$list_elements[current_index].removeClass('active');
		
		/* hide the open tab */
		$tab_elements[current_index].hide();
		
		/* save the new index value */
		current_index = _index;
		
		/* activate the current btn */
		$list_elements[current_index].addClass('active');
		
		/* show the current tab */
		$tab_elements[current_index].show();
	}
	
	if ( $list_elements.length > 0 ) {
		/* select the first tab */
		gotoTab(0);
	}
	
	
	/*
		SETUP GEOLOCATION
	*/
	var user_latlng;
	var user_marker;
	var mapbox;
	
	var geolocation = new GeoLocation();	
	document.addEventListener("geolocation_ready", function(e) {
		
		/* 
			NUDGE EACH OF THE VIEWS DOWN BELOW THE MENU
		*/
		$('.view').each(function(){
			$(this).css({'margin-top': $('#view-menu').height() + 'px'});	
		});
		
		
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
		L.mapbox.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';
		
		mapbox = L.mapbox.map('map', 'mapbox.streets').setView([e.detail.latitude, e.detail.longitude], 16);
		
		user_latlng = new L.latLng([e.detail.latitude, e.detail.longitude]);
		user_marker = new L.RotatedMarker(L.latLng([e.detail.latitude, e.detail.longitude]), {
		    icon: L.icon({
		    iconUrl: 'img/marker-user.png',
		    iconSize: [48, 136]
		  }),
		}).addTo(mapbox);
						
	}, false);
	
	
	/*
		LISTEN FOR GEOLOCATION UPDATES AND MOVE MARKER
	*/
	document.addEventListener("geolocation_update", function(e) { 
			
			$('#geo-longitude').text(e.detail.longitude);
			$('#geo-latitude').text(e.detail.latitude);
			
			user_latlng = L.latLng(e.detail.latitude, e.detail.longitude);
									
	}, false);
	
	
	/*
		SETUP COMPASS
	*/
	var compass = new Compass();
	document.addEventListener("compass_update", function(e) { 
		
		$('#geo-heading').text(e.detail.heading);
		
		user_marker.options.angle = -e.detail.heading * (180 / Math.PI);
	    user_marker.setLatLng( user_latlng );
		
	}, false);
	
});

