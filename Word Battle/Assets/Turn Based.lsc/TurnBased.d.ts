/**
 * Variable which can be saved to turn data and sent with snap.
 */
type UserDefinedGameVariable = string | number | boolean | { [key: string]: UserDefinedGameVariable } | string[] | number[] | boolean[] | { [key: string]: UserDefinedGameVariable }[];

/**
 * Dictionary of UserDefinedGameVariables
 */
interface UserDefinedGameVariablesMap {
    [key: string]: UserDefinedGameVariable;
}

/**
 * Data needed to setup tappable area.
 * User can tap one of these areas after opening snap.
 */
interface TappableAreaInput {
    /**
     * Key of tappable area
     */
    key: string;
    /**
     * Screen transform of tappable area.
     */
    screenTransform: ScreenTransform;
}

/**
 * Event is triggered when prompt data has been loaded and turn started.
 */
interface TurnStartEvent {
    /**
     * Index of the current user
     */
    currentUserIndex: number;
    /**
     * Key of tappable area which was tapped by current user before lens opened
     */
    tappedKey: string;
    /**
     * Current turn count
     */
    turnCount: number;
    /**
     * Prompt data variables
     */
    promptDataVariables: UserDefinedGameVariablesMap;
}

/**
 * Event is triggered when endTurn has been called and it is not the last turn, if requireTurnSubmission is enabled.
 */
interface TurnEndEvent {}

/**
 * Event is triggered if an error has occurred.
 */
interface ErrorEvent {
    /**
     * Code of error, possible values: INCOMPLETE_TURN_DATA_SENT, INCOMPLETE_TURN_DATA_RECEIVED
     */
    code: "INCOMPLETE_TURN_DATA_SENT" | "INCOMPLETE_TURN_DATA_RECEIVED";
    /**
     * Error description
     */
    description: string;
}

/**
 * Data of a certain turn in turn history
 */
interface TurnHistoryEntry {
    /**
     * Turn count of this turn
     */
    readonly turnCount: number;
    /**
     * Variables sent in this turn
     */
    readonly userDefinedGameVariables: UserDefinedGameVariablesMap;
    /**
     * Is true when requireTurnSubmission is enabled and endTurn() has been called this turn
     */
    readonly isTurnComplete: boolean;
}

/**
 * Event that user can subscribe to
 */
interface Event<T> {
    /**
     * Adds a listener function to the list of listeners for this event.
     * @param listener The listener function that processes the event.
     */
    add(listener: (data: T) => void): void;

    /**
     * Adds a listener function that will be removed after its first invocation.
     * @param listener The listener function to invoke only once.
     */
    addOnce(listener: (data: T) => void): void;

    /**
     * Removes a specific listener from the list of listeners for this event.
     * @param listener The listener function to remove.
     */
    remove(listener: (data: T) => void): void;

    /**
     * Removes all listeners and once listeners for this event.
     */
    clear(): void;

    /**
     * Triggers the event, calling all registered listeners in the order they were added.
     * Errors in listeners do not prevent subsequent listeners from being called.
     * @param data The data to pass to each listener function.
     */
    trigger(data?: T): void;

    /**
     * Disables triggering of the event.
     */
    disable(): void;

    /**
     * Enables triggering of the event.
     */
    enable(): void;

    /**
     * Returns the number of attached listeners.
     */
    listenerCount(): number;
}

/**
 * Turn Based is a custom component that wraps Snapchat's turn-based
 * Dynamic Response API into a creator-friendly interface. It allows Lens
 * creators to easily build asynchronous, turn-based games using poster and
 * responder flows and serialized game state.
 */
interface TurnBased {
    /**
     * Event is triggered when prompt data has been loaded and turn started.
     */
    readonly onTurnStart: Event<TurnStartEvent>;
    /**
     * Event is triggered when endTurn has been called and it is not the last turn, if requireTurnSubmission is enabled.
     */
    readonly onTurnEnd: Event<TurnEndEvent>;
    /**
     * Event is triggered when endTurn has been called and it is last turn, if requireTurnSubmission is enabled.
     */
    readonly onGameOver: Event<TurnEndEvent>;
    /**
     * Event is triggered if an error has occurred.
     */
    readonly onError: Event<ErrorEvent>;

    /**
     * Returns promise of index of current user
     */
    getCurrentUserIndex(): Promise<number>;

    /**
     * Returns promise of all variables for a given user.
     * @param userIndex - index of the user
     */
    getUserVariables(userIndex: number): Promise<UserDefinedGameVariablesMap>;

    /**
     * Returns promise of a variable for a given user.
     * @param userIndex - index of the user
     * @param key - key of the variable
     */
    getUserVariable(userIndex: number, key: string): Promise<UserDefinedGameVariable | undefined>;

    /**
     * Sets a variable for a given user.
     * @param userIndex - index of the user
     * @param key - key of the variable
     * @param value - value of the variable
     */
    setUserVariable(userIndex: number, key: string, value: UserDefinedGameVariable): Promise<void>;

    /**
     * Returns promise of all global variables.
     */
    getGlobalVariables(): Promise<UserDefinedGameVariablesMap>;

    /**
     * Returns promise of a global variable.
     * @param key - key of the variable
     */
    getGlobalVariable(key: string): Promise<UserDefinedGameVariable | undefined>;

    /**
     * Sets a global variable.
     * @param key - key of the variable
     * @param value - value of the variable
     */
    setGlobalVariable(key: string, value: UserDefinedGameVariable): Promise<void>;

    /**
     * Returns promise of all variables for the current user.
     */
    getCurrentUserVariables(): Promise<UserDefinedGameVariablesMap>;

    /**
     * Returns promise of a variable for the current user.
     * @param key - key of the variable
     */
    getCurrentUserVariable(key: string): Promise<UserDefinedGameVariable | undefined>;

    /**
     * Sets a variable for the current user.
     * @param key - key of the variable
     * @param value - value of the variable
     */
    setCurrentUserVariable(key: string, value: UserDefinedGameVariable): Promise<void>;

    /**
     * Returns promise of all variables for the other user.
     */
    getOtherUserVariables(): Promise<UserDefinedGameVariablesMap>;

    /**
     * Returns promise of a variable for the other user.
     * @param key - key of the variable
     */
    getOtherUserVariable(key: string): Promise<UserDefinedGameVariable | undefined>;

    /**
     * Sets a variable for the other user.
     * @param key - key of the variable
     * @param value - value of the variable
     */
    setOtherUserVariable(key: string, value: UserDefinedGameVariable): Promise<void>;

    /**
     * Returns key of tappable area which was tapped by current user before lens opened.
     * Empty string if no tappable area was tapped
     */
    getTappedKey(): string;

    /**
     * Add tappable area described by screenTransform with key
     * @param key - tappable area key
     * @param screenTransform - screen transform of tappable area
     */
    addTappableArea(key: string, screenTransform: ScreenTransform): void;

    /**
     * Remove tappable area by key
     * @param key - tappable area key
     */
    removeTappableArea(key: string): void;

    /**
     * Clear tappable areas array
     */
    clearTappableAreas(): void;

    /**
     * Returns promise of current turn count, with first turn starting at 0
     */
    getTurnCount(): Promise<number>;

    /**
     * @deprecated Use {@link getPreviousTurnVariable} instead
     * Returns promise of prompt data variable by key.
     * @param key
     */
    getPromptVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): Promise<T | undefined>;

    /**
     * @deprecated Use {@link getPreviousTurnVariables} instead
     * Returns promise of prompt data (data received with snap) variables
     * (dictionary with strings as key and UserDefinedGameVariable as value).
     * Will be empty {} if it is the first turn.
     */
    getPromptVariables<T extends UserDefinedGameVariablesMap = UserDefinedGameVariablesMap>(): Promise<T>;

    /**
     * Returns promise of prompt data variable by key.
     * @param key
     */
    getPreviousTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): Promise<T | undefined>;

    /**
     * Returns promise of prompt data (data received with snap) variables
     * (dictionary with strings as key and UserDefinedGameVariable as value).
     * Will be empty {} if it is the first turn.
     */
    getPreviousTurnVariables<T extends UserDefinedGameVariablesMap = UserDefinedGameVariablesMap>(): Promise<T>;

    /**
     * @deprecated Use {@link getCurrentTurnVariable} instead
     * Returns turn variable (data which will be sent with snap to next user).
     * If value is an object or array, please call setTurnVariable after updating it to ensure that changes are properly handled.
     * @param key - key of turn variable
     */
    getTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): T | undefined;

    /**
     * @deprecated Use {@link setCurrentTurnVariable} instead
     * Set turn variable
     * @param key - key of variable
     * @param value - value of variable
     */
    setTurnVariable(key: string, value: UserDefinedGameVariable): void;

    /**
     * @deprecated Use {@link setCurrentTurnVariable} with undefined value
     * Remove turn variable by key
     * @param key - key of variable
     */
    removeTurnVariable(key: string): void;

    /**
     * @deprecated Use {@link setCurrentTurnVariable} with undefined values
     * Clear all turn variables
     */
    clearTurnVariables(): void;

    /**
     * Returns turn variable (data which will be sent with snap to next user).
     * If value is an object or array, please call setTurnVariable after updating it to ensure that changes are properly handled.
     * @param key - key of turn variable
     */
    getCurrentTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): T | undefined;

    /**
     * Set turn variable
     * @param key - key of variable
     * @param value - value of variable
     */
    setCurrentTurnVariable(key: string, value: UserDefinedGameVariable): void;

    /**
     * Returns promise of display name of current user
     */
    getCurrentUserDisplayName(): Promise<string>;

    /**
     * Returns promise of display name of other user
     */
    getOtherUserDisplayName(): Promise<string>;

    /**
     * Returns promise of boolean: true if turn is final turn because turn limit has been reached
     * or user set is final turn to true.
     */
    isFinalTurn(): Promise<boolean>;

    /**
     * Returns promise of array of turn history entries for several last turns ordered by turn count.
     * Turn history is empty if it is the first turn.
     * If it is not empty, the last turn will always have the same data as in the prompt.
     */
    getTurnHistory(): Promise<TurnHistoryEntry[]>;

    /**
     * Returns promise of turn history entry for turn with provided turn count.
     * May be null if this turn does not exist in turn history.
     * @param turnCount - turn count of the turn that should be returned
     */
    getTurn(turnCount: number): Promise<TurnHistoryEntry>;

    /**
     * Returns promise of turn history entry of previous turn.
     * May be null if this turn does not exist in turn history.
     * Has the same data as in the prompt.
     */
    getPreviousTurn(): Promise<TurnHistoryEntry>;

    /**
     * If true is set, this turn will be the last in game session.
     * @param isFinalTurn
     */
    setIsFinalTurn(isFinalTurn: boolean): void;

    /**
     * Marks turn as complete if requireTurnSubmission is enabled.
     * Changing turn variables is not possible after it.
     */
    endTurn(): void;

    /**
     * Returns promise of Snapchat user for user with provided index, returns null if it is the current user.
     * Can be used to load bitmoji of this user.
     * Promise is rejected if there was an error while loading the user.
     * @param index - index of user that should be returned
     */
    getUser(index: number): Promise<SnapchatUser | null>;

    /**
     * Returns promise of Snapchat user for current user.
     * Can be used to load bitmoji of this user.
     */
    getCurrentUser(): Promise<SnapchatUser>;

    /**
     * Returns promise of Snapchat user for other user.
     * Can be used to load bitmoji of this user.
     */
    getOtherUser(): Promise<SnapchatUser>;

    /**
     * Scene objects which will be enabled for User1 (index 0).
     * If new objects are set to this property they will be immediately enabled/disabled depending on current user index.
     */
    user1SceneObjects: readonly SceneObject[];
    /**
     * Scene objects which will be enabled for User2 (index 1).
     * If new objects are set to this property they will be immediately enabled/disabled depending on current user index.
     */
    user2SceneObjects: readonly SceneObject[];
    /**
     * Scene objects which will be enabled after ending turn if it is the last turn in case requireTurnSubmission is enabled.
     * If new objects are set to this property they will be immediately enabled/disabled
     * depending on whether it is the last turn with requireTurnSubmission enabled.
     */
    gameOverSceneObjects: readonly SceneObject[];
    /**
     * Max number of turns.
     * If number of turns passed at the moment exceeds limit, game will be ended.
     */
    turnLimit: number;
    /**
     * Array of tappable areas, each tappable area consists of key and screen transform.
     * If screen transform or its scene object is disabled area will be skipped
     */
    tappableAreas: readonly TappableAreaInput[];
    /**
     * If true component will print logs
     */
    printLogs: boolean;
    /**
     * Max number of entries in turn history.
     * All excess older records will be deleted.
     */
    turnsSavedLimit: number;
}
