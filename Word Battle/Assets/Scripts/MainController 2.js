//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Local Main Controller" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

//@ui {"widget":"separator"}
//@input Component.ScriptComponent battleManager
//@input Component.ScriptComponent scoreController

//@ui {"widget":"separator"}
//@input SceneObject promptEnterChallenger
//@input SceneObject promptPassPhone
//@input SceneObject waitingOnOutcome
//@input SceneObject groupBattleResults
//@input SceneObject groupGameOver

//@ui {"widget":"separator"}
//@input Component.Text currentChampionText
//@input Component.Text warriorInputText
//@input Component.Text winnerText
//@input Component.Text explanationText
//@input Component.Text statusText
//@input Component.Text finalText

// Game configuration
const MAX_ROUNDS = 5;
const PASS_PHONE_DELAY = 3.0; // Time to show "pass phone" prompt
const RESULTS_DISPLAY_TIME = 10.0; // Time to show battle results

// Game state
var currentRound = 0;
var currentPlayer = 0; // 0 or 1
var player0Score = 0;
var player1Score = 0;
var currentChampion = "";
var championPlayer = -1; // Which player is the current champion
var isKeyboardActive = false;
var currentWarriorInput = "";
var exampleWarriors = [
    "Toaster",
    "Rock",
    "Ant",
    "Mouse"
];

var delayManager = new global.DelayManager(script);

function init() {
    debugPrint("Local Main Controller initialized!");

    // Check ChatHelper availability
    if (global.ChatHelper && global.ChatHelper.fight) {
        debugPrint("ChatHelper is available - AI battles enabled");
    } else {
        debugPrint(
            "ChatHelper not available - will use fallback battle system"
        );
    }

    // Initialize UI
    hideAllPrompts();

    // Hide score area initially
    if (script.scoreController) {
        script.scoreController.disableScoreArea();
    }

    // Clean up any existing delays
    global.stopDelays();

    // Start the game
    startGame();
}

function startGame() {
    debugPrint("Starting new game!");

    // Reset game state
    currentRound = 0;
    currentPlayer = 0;
    player0Score = 0;
    player1Score = 0;
    championPlayer = -1;

    // Pick a random starting champion
    currentChampion =
        exampleWarriors[Math.floor(Math.random() * exampleWarriors.length)];
    debugPrint("Starting champion: " + currentChampion);

    // Update score display
    updateScoreDisplay();

    // Start first turn
    startTurn();
}

function startTurn() {
    currentRound++;
    debugPrint(
        "Starting turn " + currentRound + " for Player " + (currentPlayer + 1)
    );

    // Check if game is over
    if (currentRound > MAX_ROUNDS) {
        endGame();
        return;
    }

    // Show score area after first round
    if (currentRound > 1 && script.scoreController) {
        script.scoreController.enableScoreArea();
    }

    // Hide all prompts first
    hideAllPrompts();

    // Update champion display
    if (script.currentChampionText) {
        var championDisplay = currentChampion;
        if (championPlayer >= 0) {
            championDisplay += " (Player " + (championPlayer + 1) + ")";
        }
        script.currentChampionText.text =
            "Current Champion: " + championDisplay;
    }

    // Update status
    updateStatusText(
        "Round " + currentRound + " - Player " + (currentPlayer + 1) + "'s turn"
    );

    // Show enter challenger prompt and keyboard
    showEnterChallengerPrompt();
}

function showEnterChallengerPrompt() {
    debugPrint("Showing enter challenger prompt");

    if (script.promptEnterChallenger) {
        script.promptEnterChallenger.enabled = true;
    }

    // Show keyboard after a brief delay
    delayManager.Delay({
        time: 0.5,
        onComplete: function () {
            showKeyboard();
        },
    });
}

function showKeyboard() {
    if (isKeyboardActive) {
        debugPrint("Keyboard already active");
        return;
    }

    debugPrint("Showing keyboard");

    // Use existing input if available; otherwise pick a random example warrior
    if (!currentWarriorInput || currentWarriorInput.length === 0) {
        var randomWarrior =
            exampleWarriors[Math.floor(Math.random() * exampleWarriors.length)];
        currentWarriorInput = randomWarrior;
    }

    // Hide text initially
    if (script.warriorInputText) {
        script.warriorInputText.enabled = false;
    }

    // Set up keyboard
    var keyboardOptions = new TextInputSystem.KeyboardOptions();
    keyboardOptions.enablePreview = true;
    keyboardOptions.keyboardType = TextInputSystem.KeyboardType.Text;
    keyboardOptions.returnKeyType = TextInputSystem.ReturnKeyType.Go;
    // Prefill the keyboard with the current warrior input (or example)
    try {
        keyboardOptions.initialText = currentWarriorInput;
        keyboardOptions.placeholderText = currentWarriorInput;
    } catch (e) {
        // ignore if not supported in environment
    }
    keyboardOptions.onTextChanged = onKeyboardTextChanged;
    keyboardOptions.onReturnKeyPressed = onKeyboardSubmit;
    keyboardOptions.onKeyboardDismissed = onKeyboardSubmit;

    global.textInputSystem.requestKeyboard(keyboardOptions);
    isKeyboardActive = true;

    // Show text component
    if (script.warriorInputText) {
        script.warriorInputText.enabled = true;
        script.warriorInputText.text = currentWarriorInput;
    }
}

function hideKeyboard() {
    if (isKeyboardActive) {
        global.textInputSystem.dismissKeyboard();
        isKeyboardActive = false;

        if (script.warriorInputText) {
            script.warriorInputText.enabled = false;
        }

        debugPrint("Keyboard hidden");
    }
}

function onKeyboardTextChanged(text, range) {
    currentWarriorInput = text;
    if (script.warriorInputText && script.warriorInputText.enabled) {
        script.warriorInputText.text = text;
    }
}

function onKeyboardSubmit() {
    if (!isKeyboardActive) {
        debugPrint("Keyboard already submitted, ignoring duplicate call");
        return;
    }

    debugPrint("Keyboard submitted with: " + currentWarriorInput);

    var challenger =
        currentWarriorInput && currentWarriorInput.trim().length > 0
            ? currentWarriorInput.trim()
            : exampleWarriors[
                  Math.floor(Math.random() * exampleWarriors.length)
              ];

    hideKeyboard();
    submitChallenger(challenger);
}

function submitChallenger(challenger) {
    debugPrint(
        "Player " + (currentPlayer + 1) + " challenges with: " + challenger
    );

    // Hide enter challenger prompt
    if (script.promptEnterChallenger) {
        script.promptEnterChallenger.enabled = false;
    }

    // Start battle
    startBattle(currentChampion, challenger);
}

function startBattle(champion, challenger) {
    debugPrint("Battle: " + champion + " vs " + challenger);

    // Ensure waiting UI is hidden at battle start; we'll only show it
    // if the animation finishes before ChatGPT responds
    if (script.waitingOnOutcome) {
        script.waitingOnOutcome.enabled = false;
    }

    updateStatusText("Battle in progress...");

    // Track battle completion
    var battleAnimComplete = false;
    var chatGptComplete = false;
    var battleResult = null;

    // Start battle animation
    var animCompleteCallback = function () {
        debugPrint("Battle animation completed");
        battleAnimComplete = true;

        if (chatGptComplete) {
            debugPrint("Both animation and ChatGPT complete, showing results");
            showBattleResults(battleResult);
        } else {
            debugPrint("Animation done, waiting for ChatGPT...");
            // Only now show waiting UI since animation finished first
            if (script.waitingOnOutcome) {
                script.waitingOnOutcome.enabled = true;
            }
            updateStatusText("Processing battle with AI...");
        }
    };

    if (script.battleManager && script.battleManager.doBattle) {
        debugPrint("Starting battle animation with callback");
        script.battleManager.doBattle(
            champion,
            challenger,
            animCompleteCallback
        );
    } else {
        debugPrint("No battle manager found, skipping animation");
        battleAnimComplete = true;
    }

    // Start ChatGPT processing
    processBattleWithAI(champion, challenger, function (result) {
        debugPrint("ChatGPT processing completed");
        chatGptComplete = true;
        battleResult = result;

        if (battleAnimComplete) {
            debugPrint("Both ChatGPT and animation complete, showing results");
            showBattleResults(battleResult);
        } else {
            debugPrint("ChatGPT done, waiting for animation...");
        }
    });
}

function processBattleWithAI(champion, challenger, callback) {
    // Try ChatHelper first, with retry logic
    var maxRetries = 3;
    var attempt = 0;
    var requestCompleted = false;

    function tryBattle() {
        attempt++;
        debugPrint("ChatGPT attempt " + attempt + "/" + maxRetries);

        if (!global.ChatHelper || !global.ChatHelper.fight) {
            debugPrint("ChatHelper not available, using fallback");
            callback(getFallbackBattleResult(champion, challenger));
            return;
        }

        // Set up timeout
        var timeoutDelay = delayManager.Delay({
            time: 15,
            onComplete: function () {
                if (requestCompleted) return; // Request already completed, ignore timeout

                debugPrint("Request timed out");
                if (attempt < maxRetries) {
                    debugPrint("Retrying...");
                    delayManager.Delay({
                        time: 2,
                        onComplete: tryBattle,
                    });
                } else {
                    debugPrint("All attempts failed, using fallback");
                    requestCompleted = true;
                    callback(getFallbackBattleResult(champion, challenger));
                }
            },
        });

        global.ChatHelper.fight(
            champion,
            challenger,
            function (winner, comment) {
                if (requestCompleted) {
                    debugPrint(
                        "Request already completed, ignoring duplicate response"
                    );
                    return;
                }

                requestCompleted = true;
                global.stopDelays(); // Clear the timeout delay

                debugPrint("ChatGPT result: Challenger " + winner + " wins");
                debugPrint("Reason: " + comment);

                // Update UI text
                if (script.winnerText) {
                    script.winnerText.text =
                        (winner === 1 ? champion : challenger) + " wins!";
                }
                if (script.explanationText) {
                    script.explanationText.text = comment;
                }

                var result = {
                    championWins: winner === 1,
                    description: comment,
                };

                callback(result);
            }
        );
    }

    tryBattle();
}

function getFallbackBattleResult(champion, challenger) {
    var championWins = Math.random() > 0.5;
    var descriptions = [
        champion + " defeats " + challenger + " with superior strategy!",
        challenger + " overpowers " + champion + " with raw strength!",
        champion + " outsmarts " + challenger + " in battle!",
        challenger + " crushes " + champion + " with overwhelming force!",
    ];

    return {
        championWins: championWins,
        description:
            descriptions[Math.floor(Math.random() * descriptions.length)],
    };
}

function showBattleResults(result) {
    // Hide waiting UI
    if (script.waitingOnOutcome) {
        script.waitingOnOutcome.enabled = false;
    }

    // Small delay before showing results
    delayManager.Delay({
        time: 0.5,
        onComplete: function () {
            displayBattleResults(result);
        },
    });
}

function displayBattleResults(result) {
    debugPrint("Displaying battle results");

    // Show results UI
    if (script.groupBattleResults) {
        script.groupBattleResults.enabled = true;
    }

    // Update scores
    if (result.championWins) {
        // Champion (previous player) wins
        if (championPlayer >= 0) {
            if (championPlayer === 0) {
                player0Score++;
            } else {
                player1Score++;
            }
        }
        debugPrint("Champion wins! Champion stays the same.");
    } else {
        // Challenger (current player) wins
        if (currentPlayer === 0) {
            player0Score++;
        } else {
            player1Score++;
        }
        // Update champion
        currentChampion = currentWarriorInput.trim() || exampleWarriors[0];
        championPlayer = currentPlayer;
        debugPrint("Challenger wins! New champion: " + currentChampion);
    }

    updateScoreDisplay();
    updateStatusText("Round " + currentRound + " complete");

    // Show results for a duration, then either end the game (final round)
    // or proceed to the next player's turn with pass-phone prompt
    delayManager.Delay({
        time: RESULTS_DISPLAY_TIME,
        onComplete: function () {
            if (currentRound >= MAX_ROUNDS) {
                // Final round reached: skip pass phone and go straight to game over
                endGame();
            } else {
                hideResultsAndPassPhone();
            }
        },
    });
}

function hideResultsAndPassPhone() {
    // Hide results
    if (script.groupBattleResults) {
        script.groupBattleResults.enabled = false;
    }

    // Switch to next player
    currentPlayer = currentPlayer === 0 ? 1 : 0;

    // Show pass phone prompt
    if (script.promptPassPhone) {
        script.promptPassPhone.enabled = true;
    }

    updateStatusText("Pass phone to Player " + (currentPlayer + 1));

    // Wait, then start next turn
    delayManager.Delay({
        time: PASS_PHONE_DELAY,
        onComplete: function () {
            if (script.promptPassPhone) {
                script.promptPassPhone.enabled = false;
            }
            startTurn();
        },
    });
}

function endGame() {
    debugPrint("Game Over!");

    hideAllPrompts();

    if (script.groupGameOver) {
        script.groupGameOver.enabled = true;
    }

    var winner =
        player0Score > player1Score ? 0 : player1Score > player0Score ? 1 : -1;

    const resultText = "Final Score: " + player0Score + " - " + player1Score;
    const finalText =
        winner === -1 ? "It's a tie!" : "Player " + (winner + 1) + " wins!";

    updateStatusText(resultText);
    if (script.finalText) {
        script.finalText.text = finalText;
    }
    debugPrint(resultText);
}

function hideAllPrompts() {
    if (script.promptEnterChallenger)
        script.promptEnterChallenger.enabled = false;
    if (script.promptPassPhone) script.promptPassPhone.enabled = false;
    if (script.waitingOnOutcome) script.waitingOnOutcome.enabled = false;
    if (script.groupBattleResults) script.groupBattleResults.enabled = false;
    if (script.groupGameOver) script.groupGameOver.enabled = false;
}

function updateScoreDisplay() {
    if (script.scoreController) {
        script.scoreController.updateScore(player0Score, player1Score);
    }
}

function updateStatusText(text) {
    if (script.statusText) {
        script.statusText.text = text;
    }
    debugPrint("Status: " + text);
}

function debugPrint(text) {
    if (script.debug) {
        var log = script.debugName + ": " + text;
        if (global.textLogger) {
            global.logToScreen(log);
        }
        if (script.debugText) {
            script.debugText.text = log;
        }
        print(log);
    }
}

function errorPrint(text) {
    var log = "!!ERROR!! " + script.debugName + ": " + text;
    if (global.textLogger) {
        global.logError(log);
    }
    if (script.debugText) {
        script.debugText.text = log;
    }
    print(log);
}

script.createEvent("OnStartEvent").bind(init);
