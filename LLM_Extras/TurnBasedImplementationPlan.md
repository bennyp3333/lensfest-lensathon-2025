# Turn-Based Implementation Plan for Word Battle

## Overview

This document outlines the implementation plan for the basic turn flow of the Word Battle lens game using Snap's built-in Turn Based system. The focus is on leveraging the Turn Based component for state management while implementing core game mechanics including warrior selection, score tracking, and battle resolution with placeholders for ChatGPT integration.

## Game Architecture

### Core Components

1. **MainController.js** - Main game flow controller using Turn Based component
2. **WarriorManager.js** - Handles warrior selection and validation
3. **BattleManager.js** - Manages battle logic and score tracking
4. **ChatGPTIntegration.js** - Placeholder for future AI integration
5. **Turn Based Component** - Snap's built-in turn management system
6. **Turn Based Player Info Component** - Player display management

## Implementation Phases

### Phase 1: Turn Based Component Setup

#### Turn Based Component Configuration

-   **Purpose**: Leverage Snap's built-in turn management system
-   **Key Features**:
    -   Turn limit: 6 (3 rounds × 2 players)
    -   Global variables for game state
    -   User variables for player data
    -   Turn variables for warrior selection

#### Data Storage Strategy

```javascript
// Global Variables (shared between players)
const KEY_GAME_PHASE = "gamePhase"; // "setup", "battle", "results", "gameOver"
const KEY_CURRENT_ROUND = "currentRound"; // 1, 2, 3
const KEY_MATCHUP_RESULT = "matchupResult"; // battle result data
const KEY_GAME_WINNER = "gameWinner"; // -1, 0, 1

// User Variables (per player)
const KEY_PLAYER_WARRIOR = "warrior"; // current warrior selection
const KEY_PLAYER_SCORE = "score"; // player's total score
const KEY_PLAYER_WARRIOR_HISTORY = "warriorHistory"; // array of previous warriors

// Turn Variables (passed between turns)
const KEY_SELECTED_WARRIOR = "selectedWarrior"; // warrior chosen this turn
const KEY_BATTLE_REQUEST = "battleRequest"; // request for battle processing
```

### Phase 2: MainController.js Implementation

#### MainController.js Structure

-   **Purpose**: Main game controller using Turn Based component events
-   **Key Features**:
    -   Turn start/end event handling
    -   Game phase management
    -   Warrior selection coordination
    -   Battle processing coordination

#### Turn Flow Implementation

```javascript
// MainController.js structure
var self = script.getSceneObject();

//@input Component.ScriptComponent turnBased
//@input Component.ScriptComponent warriorManager
//@input Component.ScriptComponent battleManager

function onStart() {
    // Bind to Turn Based events
    script.turnBased.onTurnStart.add(onTurnStart);
    script.turnBased.onGameOver.add(onGameOver);
    script.turnBased.onError.add(onError);
}

async function onTurnStart(event) {
    var currentUserIndex = event.currentUserIndex;
    var turnCount = event.turnCount;
    var previousTurnVariables = event.previousTurnVariables;

    // Initialize game state on first turn
    if (turnCount === 0) {
        await initializeGame();
    }

    // Handle different game phases
    var gamePhase = await script.turnBased.getGlobalVariable(KEY_GAME_PHASE);
    await handleGamePhase(gamePhase, currentUserIndex, previousTurnVariables);
}

async function onGameOver() {
    await showFinalResults();
}
```

#### Game Phase Flow

1. **Setup Phase**: Initialize game state, show first player's warrior selection
2. **Warrior Selection Phase**: Player selects warrior, stores in user variables
3. **Battle Phase**: Process matchup when both warriors are selected
4. **Results Phase**: Display battle results, update scores
5. **End Game Phase**: Show final winner and scores

### Phase 3: Battle Management

#### BattleManager.js

-   **Purpose**: Manages battle logic and score tracking using Turn Based variables
-   **Key Features**:
    -   Battle processing coordination
    -   Score calculation and updates
    -   Match result storage
    -   Win/loss condition checking

#### Dummy Battle System (For Testing)

```javascript
// BattleManager.js - Dummy battle system for testing
function simulateBattle(player0Warrior, player1Warrior) {
    // Random winner selection for testing
    var randomWinner = Math.random() > 0.5 ? 0 : 1;

    return {
        winner: randomWinner,
        player0Warrior: player0Warrior,
        player1Warrior: player1Warrior,
        battleDescription: `${player0Warrior} vs ${player1Warrior} - Player ${randomWinner + 1} wins!`,
        round: await script.turnBased.getGlobalVariable(KEY_CURRENT_ROUND)
    };
}

async function processBattle() {
    // Get both players' warriors
    var player0Warrior = await script.turnBased.getUserVariable(0, KEY_PLAYER_WARRIOR);
    var player1Warrior = await script.turnBased.getUserVariable(1, KEY_PLAYER_WARRIOR);

    // Process battle (placeholder for ChatGPT)
    var battleResult = simulateBattle(player0Warrior, player1Warrior);

    // Update scores
    var player0Score = await script.turnBased.getUserVariable(0, KEY_PLAYER_SCORE) || 0;
    var player1Score = await script.turnBased.getUserVariable(1, KEY_PLAYER_SCORE) || 0;

    if (battleResult.winner === 0) {
        player0Score++;
        script.turnBased.setUserVariable(0, KEY_PLAYER_SCORE, player0Score);
    } else {
        player1Score++;
        script.turnBased.setUserVariable(1, KEY_PLAYER_SCORE, player1Score);
    }

    // Store battle result
    script.turnBased.setGlobalVariable(KEY_MATCHUP_RESULT, battleResult);

    return battleResult;
}
```

### Phase 4: Warrior Management

#### WarriorManager.js

-   **Purpose**: Handles warrior selection and validation using Turn Based variables
-   **Key Features**:
    -   Warrior selection interface
    -   Warrior validation (no duplicates, appropriate content)
    -   Warrior persistence in user variables
    -   Warrior history tracking

#### Warrior Selection Flow

```javascript
// WarriorManager.js - Warrior selection using Turn Based system
async function selectWarrior(warrior) {
    var currentUserIndex = await script.turnBased.getCurrentUserIndex();

    // Validate warrior selection
    if (!validateWarrior(warrior)) {
        return false;
    }

    // Store warrior in user variables
    script.turnBased.setUserVariable(
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
    script.turnBased.setUserVariable(
        currentUserIndex,
        KEY_PLAYER_WARRIOR_HISTORY,
        history
    );

    // Set turn variable for next player
    script.turnBased.setCurrentTurnVariable(KEY_SELECTED_WARRIOR, warrior);

    return true;
}

function validateWarrior(warrior) {
    // Basic validation - can be expanded
    return warrior && warrior.length > 0 && warrior.length <= 50;
}
```

#### Warrior Selection Process

1. Player selects warrior (text input, object detection, etc.)
2. Validate warrior selection
3. Store warrior in user variables
4. Set turn variable for next player
5. End turn to pass to next player

### Phase 5: Integration Points

#### ChatGPTIntegration.js (Placeholder)

```javascript
// Placeholder for future ChatGPT integration
async function processBattleWithChatGPT(player0Warrior, player1Warrior) {
    // TODO: Implement ChatGPT integration
    // This will use the built-in remote service module
    // Return format: { winner: 0|1, description: string, reasoning: string }

    print("ChatGPT integration not yet implemented - using dummy function");
    return simulateBattle(player0Warrior, player1Warrior);
}
```

## MainController.js Implementation Structure

### Core Functions

```javascript
// Main game flow functions using Turn Based system
async function initializeGame()
async function handleGamePhase(gamePhase, currentUserIndex, previousTurnVariables)
async function processWarriorSelection(currentUserIndex, previousTurnVariables)
async function processBattlePhase()
async function showBattleResults()
async function checkGameEndConditions()
async function showFinalResults()

// Event handlers
function onTurnStart(event)
function onGameOver()
function onError(error)
```

### Turn Based Component Integration

-   **Turn Management**: Use `onTurnStart`, `onGameOver`, `onError` events
-   **Data Storage**: Use `getGlobalVariable`/`setGlobalVariable` for shared state
-   **User Data**: Use `getUserVariable`/`setUserVariable` for player-specific data
-   **Turn Data**: Use `setCurrentTurnVariable`/`getPreviousTurnVariable` for turn-to-turn communication
-   **Turn Control**: Use `endTurn()` and `setIsFinalTurn()` for turn management

## Testing Strategy

### Turn Based Component Testing

-   Use "Simulate Turns" debug mode in Lens Studio
-   Test turn progression and data persistence
-   Validate global and user variable storage
-   Test turn variable passing between turns

### Integration Testing

-   Test complete turn flow with dummy battle functions
-   Verify score tracking using user variables
-   Test game end conditions and final turn detection
-   Validate turn transitions and phase changes

### Dummy Data for Testing

```javascript
// Test warriors for development
var testWarriors = [
    "Cheese",
    "T-Rex",
    "Time",
    "Lightning",
    "Mountain",
    "Ocean",
];

// Test battle scenarios
var testBattleResults = [
    { winner: 0, description: "Cheese melts T-Rex's heart!" },
    { winner: 1, description: "T-Rex crushes Cheese!" },
    { winner: 0, description: "Time waits for no one!" },
];
```

## Configuration Options

### Turn Based Component Settings

-   Turn limit: 6 (3 rounds × 2 players)
-   Require turn submission: true
-   Save turn history: true
-   Debug mode: "Simulate Turns" for development

### Game Settings

-   Number of rounds (stored in global variables)
-   Warrior selection constraints
-   Score calculation rules
-   Battle timeout duration

### Debug Options

-   Enable/disable debug logging
-   Show game state in Turn Based debug view
-   Force specific battle outcomes for testing
-   Use test warrior data

## Future Enhancements (Post-MVP)

### ChatGPT Integration

-   Implement actual ChatGPT API calls using remote service module
-   Add battle animation system
-   Create result visualization with animations

### UI/UX Improvements

-   Warrior selection interface with text input
-   Battle result animations and effects
-   Score display using Turn Based Player Info
-   Turn indicator system

### Advanced Features

-   Tournament mode with multiple rounds
-   Custom warrior categories
-   Battle history tracking using turn history
-   Social sharing features

## File Structure

```
Assets/Scripts/
├── MainController.js (main game controller using Turn Based)
├── WarriorManager.js (warrior selection and validation)
├── BattleManager.js (battle logic and score tracking)
├── ChatGPTIntegration.js (AI integration placeholder)
└── Core.lspkg/ (existing utilities)
    ├── Managers/
    ├── Components/
    └── Utilities/

Scene Objects:
├── Turn Based Component (Snap's turn management)
├── Turn Based Player Info Component (player display)
└── UI Elements (warrior selection, results, etc.)
```

## Success Criteria

### MVP Completion

-   [ ] Turn Based component properly configured
-   [ ] Players can select warriors using user variables
-   [ ] Turn flow works correctly with 6 turns (3 rounds)
-   [ ] Scores are tracked accurately using user variables
-   [ ] Game ends after 3 rounds using final turn detection
-   [ ] Winner is determined correctly using global variables
-   [ ] Basic UI feedback for all actions

### Testing Completion

-   [ ] All dummy functions work correctly
-   [ ] Turn transitions are smooth using Turn Based events
-   [ ] Score persistence works using user variables
-   [ ] Game state is maintained across turns using global variables
-   [ ] Error handling is robust with Turn Based error events
-   [ ] Debug mode testing works in Lens Studio

This implementation plan leverages Snap's Turn Based system for robust state management while maintaining modularity and allowing for future enhancements.
