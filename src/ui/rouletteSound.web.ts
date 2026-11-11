let sound:HTMLAudioElement|undefined;

export function playRouletteTick(){
 try{
  sound??=new Audio(new URL('roulette-tick.wav',document.baseURI).href);
  sound.currentTime=0;
  void sound.play();
 }catch{}
}
