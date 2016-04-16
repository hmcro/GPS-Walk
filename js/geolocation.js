var GeoLocation = (function(){
	
	function GeoLocation(autoPrompt){
		
		console.log("new GeoLocation");
	
		this.isSupported = false;
		this.id = null;
		this.latitude = 0;
	    this.longitude = 0;
		this.options = {
	        enableHighAccuracy: true, 
	        maximumAge        : 30000, 
	        timeout           : 27000
	    };	    
		
		if ("geolocation" in navigator) {
			
			this.isSupported = true;
			
			if (autoPrompt) {
				//trigger a location access request
				navigator.geolocation.getCurrentPosition(this.onSuccess.bind(this), this.onError.bind(this), this.options);
			}
		}
		else {					
			console.log("Geolocation not supported");				
		}
		
	};
	
	
	GeoLocation.prototype.onSuccess = function(pos){
		
		this.latitude = pos.coords.latitude;
	    this.longitude = pos.coords.longitude;
	    
		var event = new CustomEvent("geolocationChange", {
			detail: {
				longitude: pos.coords.longitude,
				latitude: pos.coords.latitude
			}
		});			
		document.dispatchEvent( event );
	};
	
	
	GeoLocation.prototype.onError = function(error){
		console.warn('ERROR(' + error.code + '): ' + error.message);
	};
	
	
	GeoLocation.prototype.watchPosition = function(){		
		this.id = navigator.geolocation.watchPosition(this.onSuccess.bind(this), this.onError.bind(this), this.options );
	};
	
	GeoLocation.prototype.stop = function(){
		navigator.geolocation.clearWatch( this.id );
	}
		
	return GeoLocation;
	
})();