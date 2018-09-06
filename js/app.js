var app = new Vue(
  {
    el:"#app",
    data:{
		state: "welcome",
			
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
    },
    
    methods:{

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
      }

    }
  }
);