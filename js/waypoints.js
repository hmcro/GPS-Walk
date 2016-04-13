var Waypoints = (function(){
	
	function Waypoints(){
				
		console.log("new Waypoints");
		
		this.data = {};
		this.stories = [];
	};
	
	
	
	Waypoints.prototype.setJSON = function(json){
		this.data = json;
		
		for (var s in json.stories) {
			this.stories.push({
				latitude: json.stories[s].latitude,
				longitude: json.stories[s].longitude, 
				mp3:json.stories[s].mp3,
				dir:json.stories[s].dir
			});
		}
	}
	
	
	
	Waypoints.prototype.getWaypoints = function(){
		return this.data.waypoints;
	}
	
	Waypoints.prototype.totalWaypoints = function(){
		return this.data.waypoints.length;
	}
	
	Waypoints.prototype.getLatLng = function(n){
		return [ this.data.waypoints[n].latitude , this.data.waypoints[n].longitude, ];
	}
	
	Waypoints.prototype.getMp3 = function(n){
		return this.data.waypoints[n].mp3;
	}
	
	
	
	Waypoints.prototype.getStories = function(){
		return this.stories;
	}
	
	Waypoints.prototype.totalStories = function(){
		return this.data.stories.length;
	}
	
	Waypoints.prototype.removeStory = function(n){
		this.stories.splice(n, 1);
	}
	
	/*Waypoints.prototype.getWaypointAudio = function(){
		
	}
	
	Waypoints.prototype.getNextWaypoint = function(){
		return [ this.data.waypoints[this.index].latitude, this.data.waypoints[this.index].longitude ];
	}
	
	Waypoints.prototype.getTotalWaypoints = function(){
		
	}
	
	Waypoints.prototype.getStartPoint = function(){
		return [this.data.waypoints[0].latitude, this.data.waypoints[0].longitude];
	}	
	
	
	
	
	
	
	
	Waypoints.prototype.removeStory = function(n){
		console.log("removing story " + n);
		this.stories.splice(n, 1);
	}*/
	
	return Waypoints;
	
})();