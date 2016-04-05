function GeoLocation(){
	
	this.isReady = false;
	
	this.onLocation = function(position){
		
		if (this.isReady == false) {
			
			this.isReady = true;
						
			var event = new CustomEvent("geolocation_ready", {
				detail: {
					longitude: position.coords.longitude,
					latitude: position.coords.latitude
				}
			});			
			document.dispatchEvent( event );				
		}
		
		var event = new CustomEvent("geolocation_update", {
			detail: {
				longitude: position.coords.longitude,
				latitude: position.coords.latitude
			}
		});		
		document.dispatchEvent( event );
		
	};
	
	this.onError = function(error) {
		console.warn("GeoLocation is not available.");
	};
	
	if ("geolocation" in navigator) {
		
		console.log("new GeoLocation");
		
		this.id = navigator.geolocation.watchPosition(
			this.onLocation.bind(this), 
			this.onError.bind(this), {
		        enableHighAccuracy: true, 
		        maximumAge        : 30000, 
		        timeout           : 27000
		    }
	    );
		
	} else {
		
		console.warn("GeoLocation is not available.");
		
	}	
};