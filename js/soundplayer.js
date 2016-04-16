var SoundPlayer = (function(){
	
	function SoundPlayer(){
		
		console.log("new SoundPlayer");
		
		this.ended = true;
		this.queue = [];
		this.audio = new Audio();
		
		this.__onended = function(e){
			this.ended = true;
			if (this.queue.length > 0) {
				var file = this.queue.shift();
				this.__play( file );
			}
		};				
		
		this.__play = function(file){
			this.ended = false;
			this.audio.src = file;
			this.audio.play();
		};
		
		this.audio.addEventListener("ended", this.__onended.bind(this), false);	
	};
	
	SoundPlayer.prototype.play = function( file, force ){
		
		if (force == true ) {
// 			alert("force play: " + file);
			// play over the top
			new Audio(file).play();
		}
		else if ( this.ended ) {
// 			alert("play: " + file);
			this.__play( file );
		}
		else {
// 			alert("queue: " + file);
			this.queue.push( file );
		}	
	}
	
	return SoundPlayer;
	
})();