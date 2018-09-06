var app = new Vue(
  {
    el:"#app",
    data:{
      audio: new Audio(),
      audioName: "",
      currentTime: 0,
      totalTime: 0,
      isPlaying: false,
      files: [
        {name:"Administrator"},
        {name:"AlgoCommunities"},
        {name:"AlwaysWatching"},
        {name:"Belongings"},
        {name:"Blank"},
        {name:"Canal"},
        {name:"Canal2"},
        {name:"Charity"},
        {name:"Church"},
        {name:"CityShouldChange"},
        {name:"CityVsCity"},
        {name:"DataTrends"},
        {name:"DeliveryTeams"},
        {name:"DigitalIdentity"},
        {name:"DigitalSpace"},
        {name:"ExperienceCollector"},
        {name:"Familiar"},
        {name:"FilterBubble"},
        {name:"FindingHousing"},
        {name:"FineDining"},
        {name:"Follow"},
        {name:"GeneralContribution"},
        {name:"GiveAway"},
        {name:"GoodLuck"},
        {name:"Hello"},
        {name:"Homeless"},
        {name:"InhabitableArt"},
        {name:"InteriorDesigners"},
        {name:"Investment"},
        {name:"JustData"},
        {name:"LivedEverywhere"},
        {name:"Market"},
        {name:"MatchMaking"},
        {name:"MicroResidential"},
        {name:"Nearby"},
        {name:"Nearby2"},
        {name:"Neighbourhood"},
        {name:"NewInvestments"},
        {name:"NewVersions"},
        {name:"Ownership"},
        {name:"PeopleDisappear"},
        {name:"Possibilities"},
        {name:"Pub"},
        {name:"PublicBaths"},
        {name:"Refurnishing"},
        {name:"Revoked"},
        {name:"Rotation"},
        {name:"School"},
        {name:"Sensors"},
        {name:"Seperation"},
        {name:"SharedAttitude"},
        {name:"SharedBedroom"},
        {name:"SharedRooms"},
        {name:"SharingHousemates"},
        {name:"StayInside"},
        {name:"TemporaryLocation"},
        {name:"TheAlgorithm"},
        {name:"UnfurnishedHomes"},
        {name:"UsingBlankSpace"},
        {name:"WeLiveInPublic"},
        {name:"WildParties"},
        {name:"YouAreData"}
      ]
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