'use strict'

var SoundPlayer = function(){
	
	/* public methods and variables */	
	this.ended = true;
	
	this.queue = [];
	
	this.audio = new Audio();	
		
	this.onended = function(e){
		if (this.queue.length > 0) {
			var file = this.queue.shift();
			this._play_sound( file );
		}
	};
	
	this.play_sound = function( _file ){
		
		if ( this.ended ) {
			console.log( "play new sound" );
			this._play_sound( _file );
		}
		else {
			console.log( "queue up a sound " + _file );
			this.queue.push( _file );
		}		
	}
	
	/* events and triggers */	
	this.audio.addEventListener("ended", this.onended.bind(this), false);
	
	/* private methods */	
	this._play_sound = function( _file ){
		this.ended = false;
		this.audio.src = _file;
		this.audio.play();
	}
	
};