var app=new Vue({el:"#app",data:{state:"welcome",audio:new Audio,audioName:"",currentTime:0,totalTime:0,isPlaying:!1},created:function(){this.audio.addEventListener("timeupdate",this.onAudioUpdate),this.audio.addEventListener("ended",this.onAudioEnded),this.audio.addEventListener("pause",this.onAudioStopped),this.audio.addEventListener("play",this.onAudioStarted)},methods:{playAudio:function(i){this.audioName=i,this.audio.src="/audio/"+i+".mp3",this.audio.play()},toggleAudio:function(){this.isPlaying?this.audio.pause():this.audio.play()},onAudioUpdate:function(){this.currentTime=Math.floor(this.audio.currentTime),this.totalTime=Math.floor(this.audio.duration)},onAudioStarted:function(){this.isPlaying=!0},onAudioStopped:function(){this.isPlaying=!1,console.log("onAudioStopped")}},computed:{progress:function(){return Math.floor(this.currentTime/this.totalTime*100)}}});