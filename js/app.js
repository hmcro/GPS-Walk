var app = new Vue(
{
	el:"#app",
	
	data:{
		state: "welcome",
		geolocationSettings: {
			enableHighAccuracy: false, 
			maximumAge        : 0, 
			timeout           : 20000
		},
		geolocationId: null,
		map: null,
		audio: new Audio(),
		audioName: "",
		currentTime: 0,
		totalTime: 0,
		isPlaying: false,
	},

	created: function(){
		this.audio.addEventListener("timeupdate", this.onAudioUpdate);
		this.audio.addEventListener("ended", this.onAudioEnded);
		this.audio.addEventListener("pause", this.onAudioStopped);
		this.audio.addEventListener("play", this.onAudioStarted);

		/* LOAD & PARSE THE GEOSJON */
		var _this = this;
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', 'https://rawgit.com/hmcro/Maps/master/test-n20sx.geojson', true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				_this.markers = JSON.parse(xobj.responseText);
				// var featureCollection = JSON.parse(xobj.responseText).features;
				// var arr = new Array();

				// for (var n in featureCollection) {
				// 	arr.push({
				// 		latitude: featureCollection[n]['geometry']['coordinates'][0],
				// 		longitude: featureCollection[n]['geometry']['coordinates'][1],
				// 		mp3: featureCollection[n]['properties']['mp3']
				// 	});
				// 	// console.log(featureCollection[n]);
				// }

				// _this.markers = arr;
			}
		};
		xobj.send(null);
	},

	methods:{

		goto: function(newState){

			this.state = newState;

			if (newState == 'map' && !this.map ) {
				this.initGeolocation();
			}
			
		},

		link: function(url){
			location.href = url;
		},

		/* GEOLOCATION STUFF */
		
		initGeolocation: function(){

			/* will trigger a location access request */
			navigator.geolocation.getCurrentPosition(this.onGeolocationSuccess, this.onGeolocationError, this.geolocationSettings);
		},

		onGeolocationSuccess: function(pos){
			
			this.latitude = pos.coords.latitude;
			this.longitude = pos.coords.longitude;

			console.log(this.latitude, this.longitude);

			if (!this.map) {
				this.initMap();
			}
			else {
				/* slide the map to the next position */
				// console.log(this.markers);
			}
		},

		onGeolocationError:function(err){
			console.warn('ERROR('+err.code+'): ' + err.message);
		},

		/* MAPBOX STUFF */

		initMap: function() {

			console.log("map init");

			/* will initialise the mapbox */
			mapboxgl.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';
			this.map = new mapboxgl.Map({
				container: 'map',
				style: 'mapbox://styles/lukesturgeon/cjlrt20fu8i3z2spjnowdy5ae',
				center: [this.longitude, this.latitude],
				zoom: 17.1
			});

			var _this = this;
			this.map.on("load", function(){
				
				/* Loop through the markers array and create graphics */
				_this.markers['features'].forEach(function(marker) {
					
					// create a HTML element for each feature
					var el = document.createElement('div');
					el.className = 'marker';

					// make a marker for each feature and add to the map
					new mapboxgl.Marker(el)
					.setLngLat(marker.geometry.coordinates)
					.addTo(_this.map);
				});

				/* Create a user marker */
				var el = document.createElement('div');
				el.className = 'user';

				// make a marker for each feature and add to the map
				new mapboxgl.Marker(el)
				.setLngLat([_this.longitude,_this.latitude])
				.addTo(_this.map);

				/* listen for geolocation updates and move the map */
				_this.geolocationId = navigator.geolocation.watchPosition(_this.onGeolocationSuccess, _this.onGeolocationError, _this.geolocationSettings);

			});			

		},

		/* AUDIO STUFF */

		playAudio: function(file){
			this.audioName = file;
			this.audio.src = "/audio/"+file+".mp3";
			this.audio.play();
		},

		toggleAudio: function(){
			if (this.isPlaying){
				this.audio.pause();
			} else {
				this.audio.play();
			}
		},

		onAudioUpdate: function(){
			this.currentTime = Math.floor(this.audio.currentTime);
			this.totalTime = Math.floor(this.audio.duration);
		},

		onAudioStarted: function(){
			this.isPlaying = true;
		},

		onAudioStopped: function(){
			this.isPlaying = false;
			console.log("onAudioStopped");
		}

	},

	computed: {

		progress: function(){
			return Math.floor((this.currentTime / this.totalTime) * 100);
		},

		jsSupported: function(){
			/* always return TRUE is javascript is running */
			return true;
		},

		audioSupported: function(){
			return Modernizr.audio;
		},

		geolocationSupported: function(){
			return Modernizr.geolocation;
		},

	}
});