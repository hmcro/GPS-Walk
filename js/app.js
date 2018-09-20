var app = {

	audio: new Audio(),
	timeKeepingAudio: new Audio(),
	isAudioPlaying: false,
	mapbox: null,
	lngLat: [0,0],
	markers: [],
	route: [],
	userMarker: null,
	timeKeepingTimer: null,
	
    init: function( settings ) {
        app.config = {
            geolocationSettings: {
				enableHighAccuracy: false, 
				maximumAge        : 0, 
				timeout           : 20000
			},
			markersUrl: '/data/markers.geojson',
			routeUrl: '/data/route.geojson',
			mapboxUrl: 'mapbox://styles/lukesturgeon/cjlrt20fu8i3z2spjnowdy5ae',
			audioDistance: 13,
			timeKeeping: 1000 * 60 * 1
        };
 
        // Allow overriding the default config
        $.extend( app.config, settings );
 
        app.setup();
    },
 
    setup: function() {
		console.log('hmcro v 3.1r1');

		// hide all pages
		app.goto();

		// hide the technical warnings
		if ( Modernizr.audio ) $('#audioSupported').hide();
		if ( Modernizr.geolocation ) $('#geolocationSupported').hide();

		// setup button events
		$('a[href="#requirements"]').click(function(){
			app.goto('#requirements');
		});

		$('a[href="#map"]').click(function(){

			navigator.geolocation.getCurrentPosition(
				app.onGeolocationSuccess, 
				app.onGeolocationError, 
				app.config.geolocationSettings);

			app.goto('#map');
			app.playAudio('1_Welcome', true);
		});

		$('a[href="#welcome"]').click(function(){
			app.goto('#welcome');
		});

		$('a[href="#privacy"]').click(function(){
			app.goto('#privacy');
		});

		// setup audio player
        app.audio.addEventListener("timeupdate", app.onAudioUpdate);
		app.audio.addEventListener("ended", app.onAudioStopped);
		app.audio.addEventListener("pause", app.onAudioStopped);
		app.audio.addEventListener("play", app.onAudioStarted);

		// load data
		$.ajax({
			dataType: "json",
			url: app.config.markersUrl,
			success: app.onMarkersLoaded
		});
	},

	goto: function( hash ){

		// hide all pages except welcome
		$('#js-error').hide();
		$('#welcome').hide();
		$('#requirements').hide();
		$('#map').hide();
		$('#privacy').hide();

		// show the new page
		$(hash).show();
	},

	onMarkersLoaded: function( data ) {
		console.log("onMarkersLoaded");

		data.features.forEach(function(marker){
			app.markers.push({
				lngLat: [
					marker.geometry.coordinates[0],
					marker.geometry.coordinates[1]
				],
				mp3: marker.properties.mp3
			});
			// console.log(marker);
		});

		// load the send route
		$.ajax({
			dataType: "json",
			url: app.config.routeUrl,
			success: app.onRouteLoaded
		});
	},

	onRouteLoaded: function( data ){
		console.log("onRouteLoaded");

		data.features.forEach(function(marker){
			app.route.push({
				lngLat: [
					marker.geometry.coordinates[0],
					marker.geometry.coordinates[1]
				],
				mp3: marker.properties.mp3
			});
			// console.log(marker);
		});

		// now the data has loaded, start the experience
		app.goto('#welcome');
	},

	setupMapbox: function() {
		console.log("setupMapbox");

		/* will initialise the mapbox */
		mapboxgl.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';
		app.mapbox = new mapboxgl.Map({
			container: 'mapbox',
			style: app.config.mapboxUrl,
			center: app.lngLat,
			zoom: 17.1
		});

		app.mapbox.on("load", function(){

			/* hide the animator */
			$('#map .loading-img').hide();
				
			/* Loop through the markers array and create graphics */
			app.route.forEach(function(marker) {				
				// create a HTML element for each feature
				var el = document.createElement('div');
				el.className = 'route';

				// make a marker for each feature and add to the map
				new mapboxgl.Marker(el)
				.setLngLat(marker.lngLat)
				.addTo(app.mapbox);
			});

			app.markers.forEach(function(marker) {				
				// create a HTML element for each feature
				var el = document.createElement('div');
				el.className = 'marker';

				// make a marker for each feature and add to the map
				new mapboxgl.Marker(el)
				.setLngLat(marker.lngLat)
				.addTo(app.mapbox);
			});

			/* Create a user marker */
			var el = document.createElement('div');
			el.className = 'user';

			// make a marker for each feature and add to the map
			app.userMarker = new mapboxgl.Marker(el)
			.setLngLat(app.lngLat)
			.addTo(app.mapbox);

			/* listen for geolocation updates and move the map */
			navigator.geolocation.watchPosition(
				app.onGeolocationSuccess, 
				app.onGeolocationError, 
				app.geolocationSettings
			);

		});		
		
	},

	onGeolocationSuccess: function( pos ) {
		app.lngLat[0] = pos.coords.longitude;
		app.lngLat[1] = pos.coords.latitude;
		console.log(app.lngLat);

		if ( !app.mapbox ) {
			app.setupMapbox();
		}
		else {
			/* update the position of the user */
			if (app.userMarker) {
				app.userMarker.setLngLat(app.lngLat);
			}

			/* slide the map to the next position */
			app.mapbox.panTo(app.lngLat);
			
			/* play some audio? */
			app.findMarkerToPlay();
			app.findRouteToPlay();
		}
	},

	onGeolocationError: function(error) {
		if (error.code == 1) {
			alert("Location access is denied. Use your phone's settings to enable.");
		}
		else {
			console.warn('ERROR('+error.code+'): ' + error.message);
			alert( error.message );
		}	
	},

	findMarkerToPlay: function() {

		for (var i = app.markers.length - 1; i >= 0; i--) {

			var marker = app.markers[i];

			/* measure the distance between the user position and each marker position */
			var from = turf.point(app.lngLat);
			var to = turf.point(marker.lngLat);

			/* convert km to nearest metre */				
			var distance = Math.floor( turf.distance(from, to) * 1000 );

			if ( distance <= app.config.audioDistance ) {
				// play the audio
				app.playAudio( marker.mp3 );

				// remove the item from the array
				app.markers.splice(i, 1);

				alert("play " + marker.mp3 );
			}
		}
	},

	findRouteToPlay: function() {

		for (var i = app.route.length - 1; i >= 0; i--) {

			var marker = app.route[i];

			/* measure the distance between the user position and each marker position */
			var from = turf.point(app.lngLat);
			var to = turf.point(marker.lngLat);

			/* convert km to nearest metre */				
			var distance = Math.floor( turf.distance(from, to) * 1000 );

			if ( distance <= app.config.audioDistance ) {
				// play the audio
				app.playAudio( marker.mp3, true );

				// remove the item from the array
				app.route.splice(i, 1);

				alert("play " + marker.mp3 );
			}
		}
	},
	
	playAudio: function(file, isHidden){
		if (isHidden) {
			console.log('[hidden] playAudio');
			app.audio.pause();
			app.timeKeepingAudio.src = "/audio/"+file+".mp3";
			app.timeKeepingAudio.play();
		}
		else {
			console.log("playAudio: " + file);
			app.audio.src = "/audio/"+file+".mp3";
			app.audio.play();
	
			// stop timekeeping audio if it's playing
			app.timeKeepingAudio.pause();
	
			// setup the text data
			$('#player .audio-title').text(file + ".mp3");
		}
	},
 
    onAudioUpdate: function() {
        var currentTime = Math.floor(app.audio.currentTime);
		var totalTime = Math.floor(app.audio.duration);
		var progress = Math.floor((currentTime / totalTime) * 100);

		$('#player .audio-bar').css({ width : progress + '%' });
	},

	onAudioStarted: function(){
		app.isAudioPlaying = true;
		console.log("onAudioStarted");

		// stop the reminder timer
		clearInterval(app.timeKeepingTimer);

		//reset the bar
		$('#player .audio-bar').css({ width : '0%' });

		// show the player
		$('#player').show();
	},
	
	onAudioStopped: function(){
		app.isAudioPlaying = false;
		console.log("onAudioStopped");
		$('#player').hide();

		// restart the timekeeping player
		timeKeepingTimer = setInterval(app.onTimeKeeping, 20000);
	},

	onTimeKeeping: function() {
		var n = Math.floor( Math.random() * 6.9 );
		app.playAudio("TimeKeeping_" + n, true);
	}
};

$( document ).ready( app.init );