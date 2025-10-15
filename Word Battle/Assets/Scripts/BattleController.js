//@input Component.Text3D warrior1Text
//@input Component.Text3D warrior2Text
//@input SceneObject battleObjects
//@input Asset.AnimationAsset animAsset
//@input Component.AnimationPlayer animPlayer

const endEventName = "animEnded";
const endTimestamp = script.animAsset.duration;
script.animAsset.createEvent(endEventName, endTimestamp);

// Store the callback function for when battle completes
var battleCompleteCallback = null;

script.animPlayer.onEvent.add(function (event) {
    if (event.eventName === endEventName) {
        onBattleComplete();
    }
});

function doBattle(warrior1, warrior2, callback) {
    script.warrior1Text.text = warrior1;
    script.warrior2Text.text = warrior2;

    // Store the callback function
    battleCompleteCallback = callback;

    script.battleObjects.enabled = true;
}

function onBattleComplete() {
    script.battleObjects.enabled = false;
    print("Inside Battle complete");
    // Call the callback if one was provided
    if (
        battleCompleteCallback &&
        typeof battleCompleteCallback === "function"
    ) {
        print("Battle complete callback called");
        battleCompleteCallback();
        battleCompleteCallback = null; // Clear the callback after use
    }
}

script.doBattle = doBattle;
