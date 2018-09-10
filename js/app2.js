var app = {

	audio: new Audio(),
	isAudioPlaying: false,
	
    init: function( settings ) {
        app.config = {
            items: $( "#app li" ),
            container: $( "<div class='container'></div>" ),
            urlBase: "/foo.php?item="
        };
 
        // Allow overriding the default config
        $.extend( app.config, settings );
 
        app.setup();
    },
 
    setup: function() {
		console.log('hmcro v 3.0r4');

		// hide all pages except welcome
		$('#js-error').hide();
		$('#requirements').hide();
		$('#map').hide();
		$('#privacy').hide();

		// hide the technical warnings
		if ( Modernizr.audio ) $('#audioSupported').hide();
		if ( Modernizr.geolocation ) $('#geolocationSupported').hide();

		// setup button events
		$('a[href="#requirements"]').click(function(){
			$('#welcome').hide();
			$('#requirements').show();
			app.playAudio('1_Welcome');
		});

        app.audio.addEventListener("timeupdate", app.onAudioUpdate);
		app.audio.addEventListener("ended", app.onAudioStopped);
		app.audio.addEventListener("pause", app.onAudioStopped);
		app.audio.addEventListener("play", app.onAudioStarted);


	},
	
	playAudio: function(file){
		console.log("playAudio: " + file);
		app.audio.src = "/audio/"+file+".mp3";
		app.audio.play();
	},
 
    onAudioUpdate: function() {
        var currentTime = Math.floor(app.audio.currentTime);
		var totalTime = Math.floor(app.audio.duration);
		var progress = Math.floor((currentTime / totalTime) * 100);
		console.log(progress, currentTime, totalTime);
	},

	onAudioStarted: function(){
		console.log("onAudioStarted");
		console.log(this);
		app.isAudioPlaying = true;
	},
	
	onAudioStopped: function(){
		app.isAudioPlaying = false;
		console.log("onAudioStopped");
	}
};

$( document ).ready( app.init );