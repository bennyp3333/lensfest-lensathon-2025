# **Turn Based Custom Component**

[**Web Documentation Page**](https://developers.snap.com/lens-studio/features/games/turn-based)

## **Overview**

The Turn Based custom component provides a framework for creating turn-based games and experiences within Snapchat
Lenses. It is designed for two-player games where each player takes a turn and sends the game state to the other player.
The component manages game state, player data, and user interactions over multiple turns, simplifying the development
process by handling the complexities of Snapchat's Dynamic Response API.

## Usage

Add the component to a Scene, configure its inputs in the Inspector, pass the component into your script input, and call
its API.

## **Inputs**

This section details the inputs available in the Inspector panel when you add the Turn Based component to a Scene
Object.

### **General Settings**

| Input                                                                                               | Type    | Description                                                                                                                                                 |
|:----------------------------------------------------------------------------------------------------|:--------|:------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Require Turn Submission (requireTurnSubmission)                                                     | boolean | If enabled, you must call endTurn() to mark a turn as complete before sending to the next player. Enables error events if incomplete data is sent/received. |
| Allow Changing Turn Variables After Turn Submission (allowChangingTurnVariablesAfterTurnSubmission) | boolean | If enabled, you can keep modifying current turn variables after calling endTurn(). Visible if Require Turn Submission is enabled.                           |

### **Turn Limit**

| Input          | Type    | Description                                                                                                   |
|:---------------|:--------|:--------------------------------------------------------------------------------------------------------------|
| Use Turn Limit | boolean | Enables a maximum number of turns in the game.                                                                |
| Turn Limit     | int     | The maximum number of turns. Game ends when turnCount + 1 >= turnLimit. Visible if Use Turn Limit is enabled. |

### **Turn History**

| Input             | Type    | Description                                                                                           |
|:------------------|:--------|:------------------------------------------------------------------------------------------------------|
| Save Turn History | boolean | Enables storing data from previous turns.                                                             |
| Turns Saved Limit | int     | Max number of past turns to keep; older turns are discarded. Visible if Save Turn History is enabled. |

### **Tappable Areas**

| Input          | Type           | Description                                                                  |
|:---------------|:---------------|:-----------------------------------------------------------------------------|
| Tappable Areas | TappableArea[] | Only tappable areas with enabled ScreenTransforms and SceneObjects are used. |

TappableArea item fields:

- Key (string): Unique identifier returned by getTappedKey() when tapped to open the Lens.
- Screen Transform (ScreenTransform): Defines the on-screen region.

### **Scene Management**

| Input                   | Type          | Description                                                                                                             |
|:------------------------|:--------------|:------------------------------------------------------------------------------------------------------------------------|
| User1 Scene Objects     | SceneObject[] | Enabled when it is User 1's turn (currentUserIndex = 0). Disabled otherwise.                                            |
| User2 Scene Objects     | SceneObject[] | Enabled when it is User 2's turn (currentUserIndex = 1). Disabled otherwise.                                            |
| Game Over Scene Objects | SceneObject[] | Enabled when the game ends (turn limit reached or setIsFinalTurn(true)). Visible if Require Turn Submission is enabled. |

### **Events (Responses)**

| Input                   | Type                     | Description                                 |
|:------------------------|:-------------------------|:--------------------------------------------|
| On Turn Start Responses | DiscreteResponseConfig[] | Responses triggered when onTurnStart fires. |
| On Turn End Responses   | DiscreteResponseConfig[] | Responses triggered when onTurnEnd fires.   |
| On Game Over Responses  | DiscreteResponseConfig[] | Responses triggered when onGameOver fires.  |

### **Debugging**

| Input           | Type                                       | Description                                                                               |
|:----------------|:-------------------------------------------|:------------------------------------------------------------------------------------------|
| Debug Mode      | enum { None, Single Turn, Simulate Turns } | Select a testing mode for Lens Studio.                                                    |
| Print Logs      | boolean                                    | Enables detailed logging to the console.                                                  |
| Logger Settings | LoggerConfig                               | Configure on-screen/console logger (font size, levels). Visible if Print Logs is enabled. |
| Show Debug View | boolean                                    | Displays a real-time overlay with current game state.                                     |

Simulate Turns options (Debug Mode = Simulate Turns):

| Input                             | Type    | Description                                                                                                                                                                                                                         |
|:----------------------------------|:--------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Swap Players After Simulated Turn | boolean | After each simulated turn, swaps user0 and user1 so you can test both player perspectives. When enabled, the component's current user index alternates and may not match the actual Snapchat user. Useful for multi-turn debugging. |
| Tapped Key                        | string  | The key to simulate as tapped when opening the Lens.                                                                                                                                                                                |

Single Turn options (Debug Mode = Single Turn):

| Input                 | Type                                | Description                                                                                  |
|:----------------------|:------------------------------------|:---------------------------------------------------------------------------------------------|
| Turn Count            | int                                 | Even numbers for User 1 (starting at 0), odd for User 2 (starting at 1).                     |
| Tapped Key            | string                              | The key to simulate as tapped when opening the Lens.                                         |
| Test Data Type        | enum { Studio Inputs, JSON String } | Choose how to provide mock previous-turn data.                                               |
| Test Is Turn Complete | boolean                             | Whether the previous turn is marked complete.                                                |
| Test Data             | UserDefinedGameVariableInput[]      | Key/value list for mock previous-turn variables. Visible if Test Data Type is Studio Inputs. |
| Test Turn History     | DebugTurnHistoryStudioInputs[]      | Array of turn history entries (studio inputs). Visible if Test Data Type is Studio Inputs.   |
| Test Data             | string (JSON)                       | JSON string for mock previous-turn variables. Visible if Test Data Type is JSON String.      |
| Test Turn History     | DebugTurnHistoryJsonStrings[]       | Array of turn history entries (JSON strings). Visible if Test Data Type is JSON String.      |

Note: To reset simulated turns, open Additional Options in the preview and select "Clear Turn Based State".

### **Advanced Options**

| Input          | Type                           | Description                                                                                                                       |
|:---------------|:-------------------------------|:----------------------------------------------------------------------------------------------------------------------------------|
| Turn Variables | UserDefinedGameVariableInput[] | Default values for current-turn variables. Temporary only and not persisted across turns. Visible if Advanced Options is enabled. |

## **API Reference**

The TurnBased component provides a rich API to control the flow of your game.

### **Events**

Clear triggers and payloads for lifecycle and error events.

| Event       | When it fires                                                                                                               | Payload                                                         |
|:------------|:----------------------------------------------------------------------------------------------------------------------------|:----------------------------------------------------------------|
| onTurnStart | After prompt data loads and the turn starts (each Lens open or simulated turn).                                             | { currentUserIndex, tappedKey, turnCount, promptDataVariables } |
| onTurnEnd   | After endTurn() is called and it's not the final turn. Requires Require Turn Submission.                                    | none                                                            |
| onGameOver  | After endTurn() is called on the final turn (turn limit reached or setIsFinalTurn(true)). Requires Require Turn Submission. | none                                                            |
| onError     | When incomplete turn data is sent or received is detected by the component.                                                 | { code, description }                                           |

Payload details:

- currentUserIndex: number (0 or 1)
- tappedKey: string; empty if no tappable area was tapped
- turnCount: number (starts at 0)
- promptDataVariables: object map of variables received from the previous turn
- code: string; one of INCOMPLETE_TURN_DATA_SENT (user tried to send without completing) or
  INCOMPLETE_TURN_DATA_RECEIVED (previous turn wasn’t complete)
- description: human-readable error context

Typical flow: onTurnStart → endTurn() → onTurnEnd or onGameOver.

**Example:**

```typescript
script.api.onTurnStart.add((eventData) => {
    print("Turn started for user: " + eventData.currentUserIndex);
    print("Tapped key was: " + eventData.tappedKey);
});
```

### **Methods**

Here are some of the key methods available on the component's api object:

| Method                                                        | Description                                                                         |
|:--------------------------------------------------------------|:------------------------------------------------------------------------------------|
| getCurrentUserIndex(): Promise<number>                        | Returns the index of the current user (starting from 0).                            |
| getTurnCount(): Promise<number>                               | Returns the current turn count (first turn is 0).                                   |
| getTappedKey(): string                                        | Key of the tappable area tapped before the Lens opened. Empty if none.              |
| addTappableArea(key, screenTransform)                         | Add a tappable area defined by screenTransform with the given key.                  |
| removeTappableArea(key)                                       | Remove a tappable area by key.                                                      |
| clearTappableAreas()                                          | Clear all tappable areas.                                                           |
| getCurrentTurnVariable(key)                                   | Get the current-turn variable by key.                                               |
| setCurrentTurnVariable(key, value)                            | Set a current-turn variable that will be sent with the Snap to the next user.       |
| getPreviousTurnVariable(key)                                  | Get a variable that was received from the previous user's turn.                     |
| endTurn()                                                     | Mark the current turn as complete (required if Require Turn Submission is enabled). |
| setIsFinalTurn(isFinal: boolean)                              | Mark the current turn as the final turn of the game.                                |
| getCurrentUserDisplayName(): Promise<string>                  | Get the current user’s display name.                                                |
| getOtherUserDisplayName(): Promise<string>                    | Get the other user’s display name.                                                  |
| isFinalTurn(): Promise<boolean>                               | True if the game is on its final turn (limit reached or manually set).              |
| getTurnHistory(): Promise<TurnHistoryEntry[]>                 | Array of recent turn entries ordered by turnCount.                                  |
| getTurn(turnCount: number): Promise<TurnHistoryEntry \| null> | Turn history entry for the specified turn, or null if not found.                    |
| getPreviousTurn(): Promise<TurnHistoryEntry \| null>          | Turn history entry of the previous turn, or null if none.                           |
| getUser(index: number): Promise<SnapchatUser \| null>         | Snapchat user for the given index, or null if it’s the current user.                |
| getUserVariable(userIndex, key)                               | Get a persistent variable for a specific user.                                      |
| setUserVariable(userIndex, key, value)                        | Set a persistent variable for a specific user.                                      |
| getGlobalVariable(key)                                        | Get a persistent variable for the entire game session.                              |
| setGlobalVariable(key, value)                                 | Set a persistent variable for the entire game session.                              |

#### Deprecated methods

The following methods are kept for backward compatibility. Prefer the alternatives noted.

| Method                      | Replacement/Notes                                                                  |
|:----------------------------|:-----------------------------------------------------------------------------------|
| getPromptVariable(key)      | Use getPreviousTurnVariable(key) instead.                                          |
| getPromptVariables()        | Use getPreviousTurnVariables() instead.                                            |
| getTurnVariable(key)        | Use getCurrentTurnVariable(key) instead.                                           |
| setTurnVariable(key, value) | Use setCurrentTurnVariable(key, value) instead.                                    |
| removeTurnVariable(key)     | Use setCurrentTurnVariable(key, undefined) instead.                                |
| clearTurnVariables()        | Use setCurrentTurnVariable for each key or reset default Turn Variables as needed. |

### **Properties**

You can also get and set properties directly on the component.

| Property             | Description                                                   |
|:---------------------|:--------------------------------------------------------------|
| user1SceneObjects    | An array of SceneObjects to be enabled only for User 1.       |
| user2SceneObjects    | An array of SceneObjects to be enabled only for User 2.       |
| gameOverSceneObjects | An array of SceneObjects to be enabled when the game is over. |
| turnLimit            | The maximum number of turns in the game.                      |
| tappableAreas        | The array of tappable areas.                                  |
