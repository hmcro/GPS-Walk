$(function(){
	
	/*
		SETUP MAPBOX
	*/	
	L.mapbox.accessToken = 'pk.eyJ1IjoibHVrZXN0dXJnZW9uIiwiYSI6ImNpazcwenlzYjAwenZpZm0yZGVtOXpzNGoifQ.qBHqidaLVWQtIEu09uhSkg';
		
	var mapbox = L.mapbox.map('map', 'mapbox.streets').setView([51.5242407, -0.0952766], 16);
	
});