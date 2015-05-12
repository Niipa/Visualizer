// Note that this will definitely break for older browsers.
// Also, you can do this without p5.js libraries, see 
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
var XYObj = {
  x:0,
  y:0,
  // Pass a frequency spectrum array with amplitude values per slice/index
  mutateXY: function(spectrum){
    // Set the x pos to the amp value of a random freq slice.
    this.x = spectrum[Math.floor(Math.random()*(1024))];
    // Same as above for y.
    this.y = spectrum[Math.floor(Math.random()*(1024))];
  }
};
// To be adjusted.
var diameter = 25;

function preload(){
  song = loadSound('resources/All_You_Need_Is_Hate.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  song.play();

  // We use a Fast Fourier Transform to transform the sound into numbers.
  fft = new p5.FFT();
}

function draw() {


  // Draw over previous shapes.
  background(0)
  //
  XYObj.mutateXY(fft.analyze());
  noStroke();

  // Adjust XY's to fit the canvas size.
  var adjustedX = map(XYObj.x, 0, 255, 0, width);
  var adjustedY = map(XYObj.y, 0, 255, 0, height);

  ellipse(adjustedX, adjustedY, diameter, diameter);  
}

function mouseClicked(){
  if(song.ended || song.paused){
    song.play();
  }
  else{
    song.pause()
  }
}