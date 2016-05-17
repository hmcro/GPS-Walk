var Waypoints = (function(){
	
	function Waypoints(){
				
		console.log("new Waypoints");
		
		this.totalWaypoints = 0;
		this.totalStories = 0;
		
		this._stories = [];
		this._waypoints = [];
	};
	
	
	
	Waypoints.prototype.setJSON = function(json){
				
		this.totalStories = json.stories.length;
		
		// Parse the stories data
		for(var i = 0; i < json.stories.length; i++) {
			
			var obj = json.stories[i];
						
			this._stories.push({
				latitude: obj.latitude,
				longitude: obj.longitude, 
				mp3: obj.mp3,
				dir: obj.dir
			});
		}
		
		this.totalWaypoints = json.waypoints.length;
		
		// Parse the waypoints data
		for(var i = 0; i < json.waypoints.length; i++) {
			
			var obj = json.waypoints[i];
						
			this._waypoints.push({
				latlng: [obj.latitude, obj.longitude],
				mp3: obj.mp3
			});
		}
	}
	
	
	
	Waypoints.prototype.getWaypoint = function(n){
		return this._waypoints[n];
	}
	
	Waypoints.prototype.getWaypoints = function(){
		return this._waypoints;
	}
	
	Waypoints.prototype.getWaypointsFrom = function(n){
		if (n < 0) {
			return this._waypoints;
		}
		else {
			return this._waypoints.slice(n);
		}
	}
	
	
	
/*
	Waypoints.prototype.totalWaypoints = function(){
		return this.data.waypoints.length;
	}
*/
	
/*
	Waypoints.prototype.getLatLng = function(n){
		return [ this.data.waypoints[n].latitude , this.data.waypoints[n].longitude, ];
	}
*/
	
/*
	Waypoints.prototype.getMp3 = function(n){
		return this.data.waypoints[n].mp3;
	}
*/
	
	
	
	Waypoints.prototype.getStories = function(){
		return this._stories;
	}
	
	Waypoints.prototype.removeStory = function(n){
		this._stories.splice(n, 1);
	}
	
	return Waypoints;
	
})();