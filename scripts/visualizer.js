/**
 * Created by Menard Soliven, MIT license
 **/

// Main
$(document).ready(function(){

  // Audio
  var audioCurrentTrack = $("#audioCurrentTrack")[0];
  var objAudioAnalysis = new AudAnalysis(audioCurrentTrack, 2048);
  objAudioAnalysis.gainNode.gain.value = .5;
  var seekSlider = $("#seekSlider")[0];
  var canvas = $("#visualizer")[0];
  var canvasCtx = canvas.getContext("2d");
  var canvasAnimationRequestID;
  var titleHolder = $("#fileName")[0];
  var tooltip = $("#idTooltip")[0];

  audioCurrentTrack.onended = stopDrawing;

  $("#mp3FileSelector").change(function(event){

    // If there's already a source there is an animation associated with it.
    // We need to cancel that animation, then stop the old source.
    if(!audioCurrentTrack.paused){
      window.cancelAnimationFrame(canvasAnimationRequestID);
      audioCurrentTrack.pause();
    }

    var usrFile = event.target.files[0];
    var strFileExt = usrFile.name.substring(usrFile.name.length-3);
    // Naive validation.
    if(strFileExt !== "mp3"){
     alert("The file added is not an mp3.");
     return;
    }

    tooltip.style.visibility = "hidden";

    var fileURL = URL.createObjectURL(usrFile);

    ID3.loadTags(fileURL, function(){
      var tags = ID3.getAllTags(fileURL);
      titleHolder.innerHTML =  tags.title + " - " + tags.artist;
    },{
      tags: ["title","artist"],
      dataReader: FileAPIReader(usrFile),
      onError: function(e){
        console.log(e);
        alert("Could not get title for the mp3.");
        titleHolder.innerHTML = usrFile.name;
      }
    });

    seekSlider.value = 0;
    audioCurrentTrack.src = fileURL;
    
    audioCurrentTrack.onloadedmetadata = function(){
      seekSlider.max = Math.ceil(audioCurrentTrack.duration);
    };
    audioCurrentTrack.load();  
    audioCurrentTrack.play();
    startDrawing();
  });

  $("#btnStop").click(function(){
    audioCurrentTrack.pause();
    audioCurrentTrack.currentTime = 0;
    stopDrawing();
  });

  $("#btnPlay").click(function(){
    audioCurrentTrack.play();
    startDrawing();
  });

  $("#btnPause").click(function(){
    audioCurrentTrack.pause();
    stopDrawing();
  });

  $("#audioCurrentTrack").on("timeupdate",function(){
    //seekSlider.value = Math.floor(this.currentTime/this.duration);
    seekSlider.value = this.currentTime;
  });

  $("#seekSlider").on("change",function(){
    // int > double
    if(this.value > audioCurrentTrack.duration){
      audioCurrentTrack.currentTime = audioCurrentTrack.duration;
    }else{
      audioCurrentTrack.currentTime = this.value;
    }

    if(audioCurrentTrack.paused){
      audioCurrentTrack.play();
      startDrawing();
    }
  });

  $("#volSlider").on("change",function(){
    if(objAudioAnalysis.gainNode){
      objAudioAnalysis.gainNode.gain.value = this.value/100;
    }
  });

  // Drawing
  var startDrawing = function(){

    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;

    canvasCtx.clearRect(0,0, canvasWidth, canvasHeight);

    canvasCtx.fillStyle = '#FCFCFC';
    canvasCtx.fillRect(0,0, canvasWidth, canvasHeight);

    function draw(){

      canvasAnimationRequestID = requestAnimationFrame(draw);

      //var randomAlpha = ((Math.random() * .5) + .333);
      canvasCtx.fillStyle = "rgba(252,252,252,.5)";
      canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      canvasCtx.strokeStyle = "#88CAEB";

      var refAnalysisArray = objAudioAnalysis.analysisArray;
      objAudioAnalysis.analyserNode.getByteTimeDomainData(refAnalysisArray);
      
      canvasCtx.beginPath();
      var sliceWidth = canvasWidth * 1.0 / refAnalysisArray.length;
      var x = 0;
      for(var i = 0; i < refAnalysisArray.length; ++i){
        var v = refAnalysisArray[i] / 128.0;
        var y = v * canvasHeight/2;

        if(i === 0){
          // Wrap around the width.
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      canvasCtx.lineTo(canvasWidth, canvasHeight/2);
      canvasCtx.stroke();
    };
    draw();
  }

  function stopDrawing(){
    // Cancel the old drawing.
    window.cancelAnimationFrame(canvasAnimationRequestID);

    var widthFilled = 0;
    var sliceWidth = canvas.width * 1.0 / objAudioAnalysis.analysisArray.length;    

    // Animation to stop drawing.
    (function animationEnd(){

      if(widthFilled == canvas.width){
        canvasCtx.clearRect(0,0, canvas.width, canvas.height);
        canvasCtx.fillStyle = '#FCFCFC';
        canvasCtx.fillRect(0,0, canvas.width, canvas.height);        
      }
      if(widthFilled < canvas.width){
        canvasAnimationRequest = requestAnimationFrame(animationEnd);
      }

      canvasCtx.fillStyle = "rgba(252,252,252,1)";
      widthFilled += sliceWidth;
      canvasCtx.fillRect(widthFilled,0, sliceWidth, canvas.height);

    })();
  }

  /**
   * Pre: audioElement.src is set.
   **/
  function AudAnalysis(audioElement, desiredFFTSize){
    try{
      // Test that Web Audio API is available.
      windowAudioContext = window.AudioContext || window.webkitAudioContext;

      this.audioElement = audioElement;
      var audioCtx = new AudioContext();
      
      // The reason we have this class, can add extra nodes here.
      this.analyserNode =  audioCtx.createAnalyser();
      this.analyserNode.fftSize = desiredFFTSize;  
      this.analysisArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.gainNode = audioCtx.createGain();
      
      // Hook all the nodes together.
      var source = audioCtx.createMediaElementSource(audioElement);
      source.connect(this.analyserNode);
      source.connect(this.gainNode);
      this.gainNode.connect(audioCtx.destination);
    }catch(e){
      console.log(e);
      alert("Sorry, we can't run on this browser.");
    }
  };
});