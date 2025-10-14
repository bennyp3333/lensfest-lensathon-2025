//@ui {"widget":"separator"}
//@input bool debug
//@input string debugName = "Main Controller" {"showIf":"debug"}
//@input Component.Text debugText {"showIf":"debug"}

//@ui {"widget":"separator"}
//@input Component.ScriptComponent turnBased
//@input Component.ScriptComponent warriorManager
//@input Component.ScriptComponent battleManager

//@ui {"widget":"separator"}
//@input SceneObject groupGameUI
//@input SceneObject groupWarriorSelection
//@input SceneObject groupBattleResults
//@input SceneObject groupGameOver
//@input Component.Text statusText
//@input Component.Text scoreText

var self = script.getSceneObject();
var selfTransform = self.getTransform();

// Storage Keys (internal constants)
const KEY_GAME_PHASE = "gamePhase";
const KEY_CURRENT_ROUND = "currentRound";
const KEY_MATCHUP_RESULT = "matchupResult";
const KEY_GAME_WINNER = "gameWinner";
const KEY_PLAYER_WARRIOR = "warrior";
const KEY_PLAYER_SCORE = "score";
const KEY_PLAYER_WARRIOR_HISTORY = "warriorHistory";
const KEY_SELECTED_WARRIOR = "selectedWarrior";
const KEY_BATTLE_REQUEST = "battleRequest";

// Game phases
const PHASE_SETUP = "setup";
const PHASE_WARRIOR_SELECTION = "warriorSelection";
const PHASE_BATTLE = "battle";
const PHASE_RESULTS = "results";
const PHASE_GAME_OVER = "gameOver";

// Game configuration
const MAX_ROUNDS = 3;
const TURNS_PER_ROUND = 2; // 2 players per round

function init() {
    debugPrint("MainController initialized!");

    // Bind to Turn Based events
    if (script.turnBased) {
        script.turnBased.onTurnStart.add(onTurnStart);
        script.turnBased.onGameOver.add(onGameOver);
        script.turnBased.onError.add(onError);
        debugPrint("Turn Based events bound successfully");
    } else {
        errorPrint("Turn Based component not found!");
    }

    // Initialize UI
    showUI(false);

    // Clean up any existing delays from previous sessions
    global.stopDelays("test");
    global.stopDelays("battle-results");
    global.stopDelays("game-flow");
}

function onUpdate() {
    // Update logic can be added here if needed
}

// Turn Based Event Handlers
async function onTurnStart(event) {
    var currentUserIndex = event.currentUserIndex;
    var turnCount = event.turnCount;
    var previousTurnVariables = event.previousTurnVariables;

    debugPrint(
        "Turn started - User: " + currentUserIndex + ", Turn: " + turnCount
    );

    // Clean up any existing delays from previous turns
    global.stopDelays("test");
    global.stopDelays("battle-results");
    global.stopDelays("game-flow");

    // Initialize game state on first turn
    if (turnCount === 0) {
        await initializeGame();
    }

    // Handle different game phases
    var gamePhase = await script.turnBased.getGlobalVariable(KEY_GAME_PHASE);
    if (!gamePhase) {
        // If no game phase is set, initialize the game first
        await initializeGame();
        gamePhase = await script.turnBased.getGlobalVariable(KEY_GAME_PHASE);
    }

    await handleGamePhase(gamePhase, currentUserIndex, previousTurnVariables);
}

async function onGameOver() {
    debugPrint("Game Over!");

    // Clean up all delays when game ends
    global.stopDelays();

    await showFinalResults();
}

function onError(error) {
    errorPrint("Turn Based Error: " + error.code + " - " + error.description);
}

// Game Initialization
async function initializeGame() {
    debugPrint("Initializing game...");

    // Set initial game state
    await script.turnBased.setGlobalVariable(
        KEY_GAME_PHASE,
        PHASE_WARRIOR_SELECTION
    );
    await script.turnBased.setGlobalVariable(KEY_CURRENT_ROUND, 1);
    await script.turnBased.setGlobalVariable(KEY_GAME_WINNER, -1);

    // Initialize player scores
    await script.turnBased.setUserVariable(0, KEY_PLAYER_SCORE, 0);
    await script.turnBased.setUserVariable(1, KEY_PLAYER_SCORE, 0);

    debugPrint("Game initialized successfully");
}

// Game Phase Management
async function handleGamePhase(
    gamePhase,
    currentUserIndex,
    previousTurnVariables
) {
    debugPrint("Handling game phase: " + gamePhase);

    switch (gamePhase) {
        case PHASE_SETUP:
            debugPrint("Game setup phase - transitioning to warrior selection");
            await script.turnBased.setGlobalVariable(
                KEY_GAME_PHASE,
                PHASE_WARRIOR_SELECTION
            );
            await processWarriorSelection(
                currentUserIndex,
                previousTurnVariables
            );
            break;
        case PHASE_WARRIOR_SELECTION:
            await processWarriorSelection(
                currentUserIndex,
                previousTurnVariables
            );
            break;
        case PHASE_BATTLE:
            await processBattlePhase();
            break;
        case PHASE_RESULTS:
            await showBattleResults();
            break;
        case PHASE_GAME_OVER:
            await showFinalResults();
            break;
        default:
            debugPrint("Unknown game phase: " + gamePhase);
    }
}

// Warrior Selection Phase
async function processWarriorSelection(
    currentUserIndex,
    previousTurnVariables
) {
    debugPrint("Processing warrior selection for user: " + currentUserIndex);

    // Check if we have a warrior from the previous turn
    var selectedWarrior =
        script.turnBased.getCurrentTurnVariable(KEY_SELECTED_WARRIOR);
    if (previousTurnVariables && previousTurnVariables[KEY_SELECTED_WARRIOR]) {
        selectedWarrior = previousTurnVariables[KEY_SELECTED_WARRIOR];
        debugPrint("Received warrior from previous turn: " + selectedWarrior);
    }

    // Show warrior selection UI
    showWarriorSelectionUI(true);
    updateStatusText(
        "Player " + (currentUserIndex + 1) + " - Select your warrior!"
    );

    // For testing - auto-select a random warrior after 2 seconds
    if (script.debug) {
        var testDelay = new global.Delay({
            onComplete: function () {
                var testWarriors = [
                    "Cheese",
                    "T-Rex",
                    "Time",
                    "Lightning",
                    "Mountain",
                    "Ocean",
                ];
                var randomWarrior =
                    testWarriors[
                        Math.floor(Math.random() * testWarriors.length)
                    ];
                selectWarrior(randomWarrior);
            },
            time: 1,
            tags: ["test", "warrior-selection"],
        });
        testDelay.start();
    }
}

// Battle Phase
async function processBattlePhase() {
    debugPrint("Processing battle phase...");

    // Get both players' warriors
    var player0Warrior = await script.turnBased.getUserVariable(
        0,
        KEY_PLAYER_WARRIOR
    );
    var player1Warrior = await script.turnBased.getUserVariable(
        1,
        KEY_PLAYER_WARRIOR
    );

    if (!player0Warrior || !player1Warrior) {
        errorPrint("Missing warriors for battle!");
        return;
    }

    debugPrint("Battle: " + player0Warrior + " vs " + player1Warrior);

    // Process battle (using dummy function for now)
    var battleResult = await simulateBattle(player0Warrior, player1Warrior);

    // Update scores
    var player0Score =
        (await script.turnBased.getUserVariable(0, KEY_PLAYER_SCORE)) || 0;
    var player1Score =
        (await script.turnBased.getUserVariable(1, KEY_PLAYER_SCORE)) || 0;

    if (battleResult.winner === 0) {
        player0Score++;
        await script.turnBased.setUserVariable(
            0,
            KEY_PLAYER_SCORE,
            player0Score
        );
    } else {
        player1Score++;
        await script.turnBased.setUserVariable(
            1,
            KEY_PLAYER_SCORE,
            player1Score
        );
    }

    // Store battle result
    await script.turnBased.setGlobalVariable(KEY_MATCHUP_RESULT, battleResult);

    // Move to results phase
    await script.turnBased.setGlobalVariable(KEY_GAME_PHASE, PHASE_RESULTS);

    debugPrint("Battle complete - Winner: Player " + (battleResult.winner + 1));
}

// Results Phase
async function showBattleResults() {
    debugPrint("Showing battle results...");

    var battleResult = await script.turnBased.getGlobalVariable(
        KEY_MATCHUP_RESULT
    );
    var currentRound = await script.turnBased.getGlobalVariable(
        KEY_CURRENT_ROUND
    );

    if (battleResult) {
        showBattleResultsUI(true);
        updateStatusText(
            "Round " +
                currentRound +
                " Results: " +
                battleResult.battleDescription
        );

        // Show results for 3 seconds, then continue
        var resultsDelay = new global.Delay({
            onComplete: function () {
                continueToNextRound();
            },
            time: 3,
            tags: ["battle-results", "game-flow"],
        });
        resultsDelay.start();
    }
}

// Continue to next round or end game
async function continueToNextRound() {
    var currentRound = await script.turnBased.getGlobalVariable(
        KEY_CURRENT_ROUND
    );
    var turnCount = await script.turnBased.getTurnCount();

    if (currentRound >= MAX_ROUNDS) {
        // Game over
        await script.turnBased.setGlobalVariable(
            KEY_GAME_PHASE,
            PHASE_GAME_OVER
        );
        await determineWinner();
        await script.turnBased.setIsFinalTurn(true);
    } else {
        // Next round
        await script.turnBased.setGlobalVariable(
            KEY_CURRENT_ROUND,
            currentRound + 1
        );
        await script.turnBased.setGlobalVariable(
            KEY_GAME_PHASE,
            PHASE_WARRIOR_SELECTION
        );
        showWarriorSelectionUI(true);
        updateStatusText(
            "Round " + (currentRound + 1) + " - Select your warrior!"
        );
    }
}

// Determine game winner
async function determineWinner() {
    var player0Score =
        (await script.turnBased.getUserVariable(0, KEY_PLAYER_SCORE)) || 0;
    var player1Score =
        (await script.turnBased.getUserVariable(1, KEY_PLAYER_SCORE)) || 0;

    var winner = -1; // Tie
    if (player0Score > player1Score) {
        winner = 0;
    } else if (player1Score > player0Score) {
        winner = 1;
    }

    await script.turnBased.setGlobalVariable(KEY_GAME_WINNER, winner);
    debugPrint(
        "Game winner determined: " +
            (winner === -1 ? "Tie" : "Player " + (winner + 1))
    );
}

// Final Results
async function showFinalResults() {
    debugPrint("Showing final results...");

    var winner = await script.turnBased.getGlobalVariable(KEY_GAME_WINNER);
    var player0Score =
        (await script.turnBased.getUserVariable(0, KEY_PLAYER_SCORE)) || 0;
    var player1Score =
        (await script.turnBased.getUserVariable(1, KEY_PLAYER_SCORE)) || 0;

    showGameOverUI(true);

    var resultText = "";
    if (winner === -1) {
        resultText =
            "It's a tie! Final Score: " + player0Score + " - " + player1Score;
    } else {
        resultText =
            "Player " +
            (winner + 1) +
            " wins! Final Score: " +
            player0Score +
            " - " +
            player1Score;
    }

    updateStatusText(resultText);
    debugPrint("Final results: " + resultText);
}

// Dummy Battle System (for testing)
async function simulateBattle(player0Warrior, player1Warrior) {
    // Random winner selection for testing
    var randomWinner = Math.random() > 0.5 ? 0 : 1;

    var battleDescriptions = [
        player0Warrior +
            " defeats " +
            player1Warrior +
            " with superior strategy!",
        player1Warrior +
            " overpowers " +
            player0Warrior +
            " with raw strength!",
        player0Warrior + " outsmarts " + player1Warrior + " in an epic battle!",
        player1Warrior +
            " crushes " +
            player0Warrior +
            " with overwhelming force!",
    ];

    var randomDescription =
        battleDescriptions[
            Math.floor(Math.random() * battleDescriptions.length)
        ];

    return {
        winner: randomWinner,
        player0Warrior: player0Warrior,
        player1Warrior: player1Warrior,
        battleDescription: randomDescription,
        round: await script.turnBased.getGlobalVariable(KEY_CURRENT_ROUND),
    };
}

// Warrior Selection (called by UI or testing)
async function selectWarrior(warrior) {
    var currentUserIndex = await script.turnBased.getCurrentUserIndex();

    debugPrint(
        "Player " + (currentUserIndex + 1) + " selected warrior: " + warrior
    );

    // Validate warrior selection
    if (!validateWarrior(warrior)) {
        errorPrint("Invalid warrior selection: " + warrior);
        return false;
    }

    // Store warrior in user variables
    await script.turnBased.setUserVariable(
        currentUserIndex,
        KEY_PLAYER_WARRIOR,
        warrior
    );

    // Add to warrior history
    var history =
        (await script.turnBased.getUserVariable(
            currentUserIndex,
            KEY_PLAYER_WARRIOR_HISTORY
        )) || [];
    history.push(warrior);
    await script.turnBased.setUserVariable(
        currentUserIndex,
        KEY_PLAYER_WARRIOR_HISTORY,
        history
    );

    // Set turn variable for next player
    script.turnBased.setCurrentTurnVariable(KEY_SELECTED_WARRIOR, warrior);

    // Check if both players have selected warriors
    var player0Warrior = await script.turnBased.getUserVariable(
        0,
        KEY_PLAYER_WARRIOR
    );
    var player1Warrior = await script.turnBased.getUserVariable(
        1,
        KEY_PLAYER_WARRIOR
    );

    if (player0Warrior && player1Warrior) {
        // Both warriors selected, move to battle phase
        await script.turnBased.setGlobalVariable(KEY_GAME_PHASE, PHASE_BATTLE);
        await processBattlePhase();
    }

    // End turn
    script.turnBased.endTurn();
    showWarriorSelectionUI(false);

    return true;
}

// Warrior validation
function validateWarrior(warrior) {
    return warrior && warrior.length > 0 && warrior.length <= 50;
}

// UI Management
function showUI(show) {
    if (script.groupGameUI) script.groupGameUI.enabled = show;
}

function showWarriorSelectionUI(show) {
    if (script.groupWarriorSelection)
        script.groupWarriorSelection.enabled = show;
}

function showBattleResultsUI(show) {
    if (script.groupBattleResults) script.groupBattleResults.enabled = show;
}

function showGameOverUI(show) {
    if (script.groupGameOver) script.groupGameOver.enabled = show;
}

function updateStatusText(text) {
    if (script.statusText) {
        script.statusText.text = text;
    }
    debugPrint("Status: " + text);
}

function updateScoreText() {
    // This will be called to update score display
    // Implementation depends on UI setup
}

// Debug functions
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

// Event binding
script.createEvent("OnStartEvent").bind(init);
script.createEvent("UpdateEvent").bind(onUpdate);
