//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Chat Helper" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

//To Use
/*

global.ChatHelper.fight("challenger1", "challlenger2", function(winner, comment){
    debugPrint("Challenger " + winner + " wins!");
    debugPrint(comment);
});

or

global.events.trigger("fight", ["challenger1", "challlenger2", function(winner, comment){
    debugPrint("Challenger " + winner + " wins!");
    debugPrint(comment);
}]);

*/

global.ChatHelper = script;

function init() {
    global.events.add("fight", ([challenger1, challenger2, callback]) => {
        script.fight(challenger1, challenger2, callback);
    });
    /*
    script.fight("cheese", "alligator", function(winner, comment){
        debugPrint("Challenger " + winner + " wins!");
        debugPrint(comment);
    });
    */
}

script.fight = function (challenger1, challenger2, callback) {
    var question =
        "Who would win between a " +
        challenger1 +
        " and a " +
        challenger2 +
        "?";
    question +=
        " Be sure to not succume to power scaling, where users may submit the most powerful thing they can think of, be creative in who would win.";
    question +=
        " Return a JSON with 2 parameters, winner (int:  which challenger won, 1 or 2) and reason (string: why that challenger won)";

    if (Math.random() < 0.2) {
        question +=
            " Your answer should be somewhat absurd and surprising and funny.";
    }

    return new GPTRequest(question).send(function (request) {
        debugPrint("Raw answer: " + request.mainAnswer);
        var jsonAnswer = JSON.parse(request.mainAnswer);
        debugPrint("Parsed answer: " + jsonAnswer);

        var winner = parseInt(jsonAnswer["winner"]);
        var comment = jsonAnswer["reason"];
        if (callback) {
            callback(winner, comment);
        }
    });
};

function GPTRequest(content) {
    this.requestId = global.utils.randomId(5);
    this.content = content;
    this.context = null;
    this.sent = false;
    this.canceled = false;
    this.completed = false;
    this.response = null;
    this.mainAnswer = null;
    this.callback = null;

    this.request = {
        temperature: 0,
        messages: [{ role: "system", content: this.content }],
    };

    this.setContext = function (context) {
        this.context = context;
        return this;
    };

    this.onComplete = (errorStatus, response) => {
        this.completed = true;
        this.response = response;
        if (!this.canceled) {
            this.print("completed");
            if (!errorStatus && typeof response === "object") {
                this.mainAnswer = response.choices[0].message.content;
            } else {
                errorPrint("GPT returned: " + JSON.stringify(response));
                //this.mainAnswer = JSON.stringify(response);
                this.mainAnswer =
                    "I'm sorry, there seems to have been an error.";
            }
            if (this.callback) {
                this.callback(this);
            }
        } else {
            this.print("completed, but request was canceled");
        }
    };

    this.send = function (callback) {
        if (!this.canceled) {
            this.callback = callback;
            global.chatGpt.completions(this.request, this.onComplete);
            this.print("sent");
            this.sent = true;
            return this;
        }
    };

    this.cancel = function () {
        this.canceled = true;
        this.print("canceled");
    };

    this.print = function (text) {
        debugPrint("GPT Request - " + this.requestId + " - " + text);
    };
    this.print("created");
}

// Debug
function debugPrint(text) {
    if (script.debug) {
        var newLog = script.debugName + ": " + text;
        if (global.textLogger) {
            global.logToScreen(newLog);
        }
        if (script.debugText) {
            script.debugText.text = newLog;
        }
        print(newLog);
    }
}

function errorPrint(text) {
    var errorLog = "!!ERROR!! " + script.debugName + ": " + text;
    if (global.textLogger) {
        global.logError(errorLog);
    }
    if (script.debugText) {
        script.debugText.text = errorLog;
    }
    print(errorLog);
}

script.createEvent("OnStartEvent").bind(init);
