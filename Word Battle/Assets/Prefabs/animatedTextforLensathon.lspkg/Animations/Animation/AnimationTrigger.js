//@input Component.AnimationPlayer theAnimPlayer
//@input float[] triggerTimes
//@input Asset.Material[] animationMats
//@input Component.Text3D[] theText
//@input Asset.Material lastMat


var triggerIndex = 0;
var previousTime = 0;

script.lastMat.mainPass.baseColor = new vec4(1.0,1.0,1.0,0.0);

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(function (eventData)
{
    var currentTime = script.theAnimPlayer.getClipCurrentTime("Layer0");
    
    if (currentTime < previousTime) {
        triggerIndex = 0;
         script.lastMat.mainPass.baseColor = new vec4(1.0,1.0,1.0,0.0);
          script.theText[0].enabled = true;
            script.theText[1].enabled = true;
          
    }
    
    if (previousTime < script.triggerTimes[triggerIndex] && currentTime >= script.triggerTimes[triggerIndex]) {
        playAnimsOnMats();
        if (triggerIndex == (script.triggerTimes.length-1)){
            script.theText[0].enabled = false;
            script.theText[1].enabled = false;
            script.lastMat.mainPass.baseColor = new vec4(1.0,1.0,1.0,1.0);
            script.lastMat.mainPass.baseTex.control.play(1, 0);
            
        }
       
        triggerIndex++;
        
    }
    previousTime = currentTime;
});



function playAnimsOnMats(){

    for (i = 0; i < script.animationMats.length; i++){

                script.animationMats[i].mainPass.baseTex.control.play(1, 0);


    }


}