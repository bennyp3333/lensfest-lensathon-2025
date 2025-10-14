//@input SceneObject typePrompt
//@input Component.Text inputText

//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Game Controller" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

var self = script.getSceneObject();
var selfTransform = self.getTransform();

var localDelayManager = new global.DelayManager(script);

function init(){

    //set up keyboard options
    var keyboardOptions = new TextInputSystem.KeyboardOptions();
    keyboardOptions.enablePreview = true;
    keyboardOptions.keyboardType = TextInputSystem.KeyboardType.Text;
    keyboardOptions.returnKeyType = TextInputSystem.ReturnKeyType.Go;

    //hook up keyboard events
    keyboardOptions.onTextChanged = onKeyboardTextChanged;
    keyboardOptions.onReturnKeyPressed = onKeyboardReturnKey;

    //show keyboard
    localDelayManager.Delay({
        time: 2,
        onComplete: function(){
            global.textInputSystem.requestKeyboard(keyboardOptions);
        }
    });

    debugPrint("Initilized!");
}

function onKeyboardTextChanged(text, range){
    script.inputText.text = text;
}

function onKeyboardReturnKey(){
    //submit to challenge
}

function onUpdate(){

    //debugPrint("Updated!");
}

script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);

// Debug
function debugPrint(text){
    if(script.debug){
        var newLog = script.debugName + ": " + text;
        if(global.textLogger){ global.logToScreen(newLog); }
        if(script.debugText){ script.debugText.text = newLog; }
        print(newLog);
    }
}

function errorPrint(text){
    var errorLog = "!!ERROR!! " + script.debugName + ": " + text;
    if(global.textLogger){ global.logError(errorLog); }
    if(script.debugText){ script.debugText.text = errorLog; }
    print(errorLog);
}