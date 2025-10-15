import { Event } from "./Modules/Helpers/Event";
import { Logger, LoggerConfig } from "./Modules/Helpers/Logger";
import { TappablesController } from "./Modules/Tappables/TappablesController";
import { LaunchParamsController } from "./Modules/Helpers/LaunchParamsController";
import { ApiController } from "./Modules/RemoteAPI/ApiController";
import { PromptDataController } from "./Modules/Data/PromptDataController";
import { TurnDataController } from "./Modules/Data/TurnDataController";
import { CurrentUserController } from "./Modules/Users/CurrentUserController";
import { OtherUserController } from "./Modules/Users/OtherUserController";
import { SceneObjectsController } from "./Modules/Scene/SceneObjectsController";
import { DebugSimulateTurnsDataHandler } from "./Modules/Debug/DebugSimulateTurnsDataHandler";
import { IDataHandler } from "./Modules/Data/IDataHandler";
import { DebugSingleTurnDataHandler } from "./Modules/Debug/DebugSingleTurnDataHandler";
import { InputsValidator } from "./Modules/InputsValidator";
import { TurnDataSender } from "./Modules/Data/TurnDataSender";
import { DebugTypeNoneDataHandler } from "./Modules/Debug/DebugTypeNoneDataHandler";
import { StorageAccessor } from "./Modules/Data/StorageAccessor";
import { DebugView } from "./Modules/DebugView/DebugView";
import { ComponentContext } from "./Modules/ComponentContext";
import { DiscreteResponse, DiscreteResponseConfig } from "./Modules/DiscreteResponses/DiscreteResponse";

export const MAX_NUMBER_USERS: number = 2;

// Interfaces and Types

export type UserDefinedGameVariable =
    string
    | number
    | boolean
    | { [key: string]: UserDefinedGameVariable }
    | string[]
    | number[]
    | boolean[]
    | { [key: string]: UserDefinedGameVariable }[]

export interface UserDefinedGameVariablesMap {
    [key: string]: UserDefinedGameVariable;
}

export interface TurnHistoryEntry {
    readonly turnCount: number;
    readonly userDefinedGameVariables: UserDefinedGameVariablesMap;
    readonly isTurnComplete: boolean;
}

// Events

export interface TurnStartEvent {
    currentUserIndex: number;
    tappedKey: string;
    turnCount: number;
    promptDataVariables: UserDefinedGameVariablesMap;
}

export interface TurnEndEvent {}

export interface GameOverEvent {}

export enum ComponentErrorCodes {
    INCOMPLETE_TURN_DATA_SENT = "INCOMPLETE_TURN_DATA_SENT",
    INCOMPLETE_TURN_DATA_RECEIVED = "INCOMPLETE_TURN_DATA_RECEIVED",
}

export interface ErrorEvent {
    code: ComponentErrorCodes;
    description: string;
}

// Typedefs

@typedef
export class UserFlowObjects {
    @input
    objects: SceneObject[];
}

@typedef
export class TappableAreaInput {
    @input
    key: string;

    @input
    screenTransform: ScreenTransform;
}

@typedef
export class UserDefinedGameVariableInput {
    @input
    key: string;

    @input
    @widget(new ComboBoxWidget([
        new ComboBoxItem("string", "string"),
        new ComboBoxItem("float", "float"),
        new ComboBoxItem("boolean", "boolean"),
    ]))
    type: string = "string";

    @input
    @showIf("type", "string")
    @label("Value")
    valueString: string = "";

    @input
    @showIf("type", "float")
    @label("Value")
    valueFloat: number = 0;

    @input
    @showIf("type", "boolean")
    @label("Value")
    valueBoolean: boolean = false;
}

@typedef
export class DebugTurnHistoryStudioInputs {

    @input
    variables: UserDefinedGameVariableInput[];

    @input
    isTurnComplete: boolean;
}

@typedef
export class DebugTurnHistoryJsonStrings {

    @input
    @widget(new TextAreaWidget())
    variables: string = "{\"key1\": \"value1\", \"key2\":0}";

    @input
    isTurnComplete: boolean;
}

@component
export class TurnBased extends BaseScriptComponent {

    // Events

    readonly onTurnStart: Event<TurnStartEvent> = new Event();

    readonly onTurnEnd: Event<TurnEndEvent> = new Event();

    readonly onGameOver: Event<GameOverEvent> = new Event();

    readonly onError: Event<ErrorEvent> = new Event();

    // Inputs
    @ui.label("<a href='https://developers.snap.com/lens-studio/features/games/turn-based'>Turn Based Documentation")

    @input
    @hint("If true component will emit onError events in case of submitting or loading incomplete turn data. Call endTurn() to mark turn data as complete")
    readonly requireTurnSubmission: boolean = false;

    @input
    @showIf("requireTurnSubmission", true)
    @hint("If true turn variables can be changed after turn submission.")
    readonly allowChangingTurnVariablesAfterTurnSubmission: boolean = false;

    @input
    @label("Use Turn Limit")
    private readonly useTurnLimit: boolean = false;

    @input("int")
    @label("Turn Limit")
    @showIf("useTurnLimit")
    @hint("Max count of turns")
    @widget(new SpinBoxWidget(2))
    private turnLimitInput: number = 2;

    @ui.separator

    @input
    @label("Save Turn History")
    private readonly useTurnHistory: boolean = false;

    @input("int")
    @showIf("useTurnHistory")
    @label("Turns Saved Limit")
    @hint("Max count of turns saved in turn history. Excess older turns are removed from turn history.")
    @widget(new SpinBoxWidget(0))
    private turnsSavedLimitInput: number = 0;

    @ui.separator
    @ui.group_start("Tappable Areas")
    @input
    @label("Tappable Areas")
    @hint("Only tappable areas with enabled ScreenTransforms and their SceneObjects will be used")
    private tappableAreasInput: TappableAreaInput[];

    @ui.group_end

    @ui.group_start("Scene")

    @input
    @label("User1 Scene Objects")
    @hint("SceneObjects which will be enabled for User 1")
    private user1FlowObjectsInputSO: SceneObject[];

    @input
    @label("User2 Scene Objects")
    @hint("SceneObjects which will be enabled for User 2")
    private user2FlowObjectsInputSO: SceneObject[];

    @input
    @label("Game Over Scene Objects")
    @showIf("requireTurnSubmission")
    @hint("SceneObjects which will be enabled when game ends")
    private gameOverObjectsInputSO: SceneObject[];

    @ui.group_end
    @ui.separator

    @ui.group_start("Debug")

    @input
    @widget(new ComboBoxWidget([
        new ComboBoxItem("None", "None"),
        new ComboBoxItem("Single Turn", "Single Turn"),
        new ComboBoxItem("Simulate Turns", "Simulate Turns"),
    ]))
    private debugMode: string = "None";

    @input
    @showIf("debugMode", "Simulate Turns")
    private swapPlayersAfterSimulatedTurn: boolean = true;

    @input
    @hint("Key of tappable area")
    @label("Tapped Key")
    @showIf("debugMode", "Simulate Turns")
    private debugTappedKeySimulateTurn: string = "";

    @ui.label("<font color='#7acccc'><i>To reset turns, open “Additional&nbsp;Options” in the preview and select “<b>Clear&nbsp;Turn&nbsp;Based&nbsp;State</b>”.")

    @ui.group_start("Single Turn")
    @showIf("debugMode", "Single Turn")

    @input("int")
    @widget(new SpinBoxWidget(0))
    @label("Turn Count")
    @hint("Turn count for debug. Even numbers for User 1, starting from 0. Odd numbers for User 2, starting from 1.")
    private debugTurnCount: number = 0;

    @input
    @hint("Key of tappable area")
    @label("Tapped Key")
    private debugTappedKeySingleTurn: string = "";

    @input
    @widget(new ComboBoxWidget([
        new ComboBoxItem("JSON String", "JSON String"),
        new ComboBoxItem("Studio Inputs", "Studio Inputs"),
    ]))
    private testDataType: string = "Studio Inputs";

    @input
    @label("Test Is Turn Complete")
    private debugIsTurnComplete: boolean;

    @input
    @label("Test Data")
    @showIf("testDataType", "Studio Inputs")
    private debugAssociatedDataStudioInputs: UserDefinedGameVariableInput[] = [];

    @input
    @label("Test Turn History")
    @showIf("testDataType", "Studio Inputs")
    private debugTurnHistoryStudioInputs: DebugTurnHistoryStudioInputs[] = [];

    @input
    @label("Test Data")
    @widget(new TextAreaWidget())
    @showIf("testDataType", "JSON String")
    private debugAssociatedDataString: string = "{\"key1\": \"value1\", \"key2\":0}";

    @input
    @label("Test Turn History")
    @showIf("testDataType", "JSON String")
    private debugTurnHistoryStrings: DebugTurnHistoryJsonStrings[] = [];

    @ui.group_end
    @ui.group_end
    @ui.separator
    @ui.group_start("Events")

    @input
    private _onTurnStartResponses: DiscreteResponseConfig[];

    @input
    private _onTurnEndResponses: DiscreteResponseConfig[];

    @input
    private _onGameOverResponses: DiscreteResponseConfig[];

    @ui.group_end
    @ui.separator

    @input
    @label("Print Logs")
    private printLogsInput: boolean = false;

    @input
    @label("Logger Settings")
    @showIf("printLogsInput", true)
    private loggerConfig: LoggerConfig;

    @input
    @hint("Show debug information overlay")
    @label("Show Debug View")
    private showDebugView: boolean = false;

    @input
    private readonly _advancedOptions: boolean = false;

    @ui.group_start("Advanced Options")
    @showIf("_advancedOptions", true)

    @ui.label("<font color='#7acccc'><i>Turn Variables are temporary and not persisted across turns.<br>Use Global or Player Variables to store data that should persist for the entire session.")

    @input
    @hint("Default values for turn variables")
    @label("Turn Variables")
    private defaultTurnVariables: UserDefinedGameVariableInput[] = [];

    @ui.group_end

    // Hidden

    @input
    private readonly remoteServiceModule: RemoteServiceModule;

    // Properties

    private inputsValidator: InputsValidator;

    private launchParamsController: LaunchParamsController;

    private tappablesHelper: TappablesController;

    private promptDataController: PromptDataController;

    private turnDataController: TurnDataController;

    private sceneObjectsController: SceneObjectsController;

    private currentUserController: CurrentUserController;

    private otherUserController: OtherUserController;

    private turnDataSender: TurnDataSender;

    private logger: Logger;

    private lateUpdateEvent: UpdateEvent;

    private componentContext: ComponentContext;

    onAwake(): void {
        this.logger = new Logger(this.loggerConfig, TurnBased.name);

        this.componentContext = new ComponentContext(this.getSceneObject(), this, this.logger);

        this.inputsValidator = new InputsValidator(this.logger);
        this.validateInputs();
        this.launchParamsController = new LaunchParamsController();
        this.tappablesHelper = new TappablesController(this.logger, this.tappableAreasInput);
        const dataHandler = this.createDataHandler();
        this.promptDataController = new PromptDataController(dataHandler, this.logger);
        this.turnDataController = new TurnDataController(this.useTurnLimit ? this.turnLimitInput : null,
            this.logger,
            this.useTurnHistory ? this.turnsSavedLimitInput : 0,
            this.requireTurnSubmission,
            !this.requireTurnSubmission || this.allowChangingTurnVariablesAfterTurnSubmission,
            this.defaultTurnVariables);
        this.turnDataSender = new TurnDataSender(this.logger, dataHandler, this.tappablesHelper, this.turnDataController);
        this.currentUserController = new CurrentUserController();
        this.otherUserController = new OtherUserController(this.logger);
        this.sceneObjectsController = new SceneObjectsController(this.user1FlowObjectsInputSO, this.user2FlowObjectsInputSO, this.requireTurnSubmission ? this.gameOverObjectsInputSO : []);
        this.lateUpdateEvent = this.createEvent("LateUpdateEvent");
        if (this.requireTurnSubmission) {
            const triggerErrorIfIncompleteDataWasSent = () => {
                if (this.turnDataController.wasIncompleteDataSent()) {
                    this.triggerOnErrorEvent(ComponentErrorCodes.INCOMPLETE_TURN_DATA_SENT, "Incomplete turn data was sent");
                }
            };
            this.createEvent("SnapImageCaptureEvent")
                .bind(triggerErrorIfIncompleteDataWasSent);
            this.createEvent("SnapRecordStopEvent")
                .bind(triggerErrorIfIncompleteDataWasSent);
        }

        this.setupEventsResponses();

        this.initialize();
    }

    // API

    setScore(score: number | null): void {
        this.turnDataController.setScore(score);
    }

    getScore(): number | null {
        return this.turnDataController.getScore();
    }

    async getCurrentUserIndex(): Promise<number> {
        return this.turnDataController.getCurrentUserIndex();
    }

    async getUserVariables(userIndex: number): Promise<UserDefinedGameVariablesMap> {
        const storage = await this.getUserDataStorage(userIndex);
        return storage.getAllVariables();
    }

    async getUserVariable(userIndex: number, key: string): Promise<UserDefinedGameVariable | undefined> {
        const storage = await this.getUserDataStorage(userIndex);
        return storage.getVariable(key);
    }

    async setUserVariable(userIndex: number, key: string, value: UserDefinedGameVariable): Promise<void> {
        const storage = await this.getUserDataStorage(userIndex);
        return storage.setVariable(key, value);
    }

    async getGlobalVariables(): Promise<UserDefinedGameVariablesMap> {
        return this.turnDataController.getGlobalVariables();
    }

    async getGlobalVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        return this.turnDataController.getGlobalVariable(key);
    }

    async setGlobalVariable(key: string, value: UserDefinedGameVariable): Promise<void> {
        return this.turnDataController.setGlobalVariable(key, value);
    }

    async getCurrentUserVariables(): Promise<UserDefinedGameVariablesMap> {
        return (await this.getCurrentUserDataStorage()).getAllVariables();
    }

    async getCurrentUserVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        return (await this.getCurrentUserDataStorage()).getVariable(key);
    }

    async setCurrentUserVariable(key: string, value: UserDefinedGameVariable): Promise<void> {
        return (await this.getCurrentUserDataStorage()).setVariable(key, value);
    }

    async getOtherUserVariables(): Promise<UserDefinedGameVariablesMap> {
        return (await this.getOtherUserDataStorage()).getAllVariables();
    }

    async getOtherUserVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        return (await this.getOtherUserDataStorage()).getVariable(key);
    }

    async setOtherUserVariable(key: string, value: UserDefinedGameVariable): Promise<void> {
        return (await this.getOtherUserDataStorage()).setVariable(key, value);
    }

    addTappableArea(key: string, screenTransform: ScreenTransform): void {
        if (this.inputsValidator.isTappableAreaValid(key, screenTransform)) {
            this.tappablesHelper.addTappableArea(key, screenTransform);
        }
    }

    removeTappableArea(key: string): void {
        this.tappablesHelper.removeTappableArea(key);
    }

    clearTappableAreas(): void {
        this.tappablesHelper.clearTappableAreas();
    }

    getTappedKey(): string | null {
        if (global.deviceInfoSystem.isEditor()) {
            switch (this.debugMode) {
                case "Single Turn":
                    return this.debugTappedKeySingleTurn;
                case "Simulate Turns":
                    return this.debugTappedKeySimulateTurn;
            }
        }
        return this.launchParamsController.getTappedKey();
    }

    getTurnCount(): Promise<number> {
        return this.turnDataController.getTurnCount();
    }

    /** @deprecated Use {@link getPreviousTurnVariable} instead*/
    getPromptVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): Promise<T | undefined> {
        return this.promptDataController.getVariable(key) as Promise<T | undefined>;
    }

    /** @deprecated Use {@link getPreviousTurnVariables} instead*/
    getPromptVariables<T extends UserDefinedGameVariablesMap = UserDefinedGameVariablesMap>(): Promise<T> {
        return this.promptDataController.getAllVariables() as Promise<T>;
    }

    getPreviousTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): Promise<T | undefined> {
        return this.promptDataController.getVariable(key) as Promise<T | undefined>;
    }

    getPreviousTurnVariables<T extends UserDefinedGameVariablesMap = UserDefinedGameVariablesMap>(): Promise<T> {
        return this.promptDataController.getAllVariables() as Promise<T>;
    }

    /** @deprecated Use {@link getCurrentTurnVariable} instead*/
    getTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): T | undefined {
        return this.turnDataController.getVariable(key) as (T | undefined);
    }

    /** @deprecated Use {@link setCurrentUserVariable} instead*/
    setTurnVariable(key: string, value: UserDefinedGameVariable): void {
        if (this.inputsValidator.isTurnVariableKeyValid(key)) {
            this.turnDataController.setVariable(key, value);
        }
    }

    /** @deprecated Use {@link setCurrentTurnVariable} with undefined value */
    removeTurnVariable(key: string): void {
        this.turnDataController.setVariable(key, undefined);
    }

    /** @deprecated Use {@link setCurrentTurnVariable} with undefined values */
    clearTurnVariables(): void {
        this.turnDataController.clearVariables();
    }

    getCurrentTurnVariable<T extends UserDefinedGameVariable = UserDefinedGameVariable>(key: string): T | undefined {
        return this.turnDataController.getVariable(key) as (T | undefined);
    }

    setCurrentTurnVariable(key: string, value: UserDefinedGameVariable): void {
        if (this.inputsValidator.isTurnVariableKeyValid(key)) {
            this.turnDataController.setVariable(key, value);
        }
    }

    getCurrentUserDisplayName(): Promise<string> {
        return this.currentUserController.getDisplayName();
    }

    getOtherUserDisplayName(): Promise<string> {
        return this.otherUserController.getDisplayName();
    }

    isFinalTurn(): Promise<boolean> {
        return this.turnDataController.isFinalTurn();
    }

    getTurnHistory(): Promise<TurnHistoryEntry[]> {
        return this.turnDataController.getTurnHistory();
    }

    getTurn(turnCount: number): Promise<TurnHistoryEntry | null> {
        return this.turnDataController.getTurn(turnCount);
    }

    getPreviousTurn(): Promise<TurnHistoryEntry | null> {
        return this.turnDataController.getPreviousTurn();
    }

    setIsFinalTurn(isFinalTurn: boolean): void {
        this.turnDataController.setIsGameOver(isFinalTurn);
    }

    async endTurn(): Promise<void> {
        if (this.requireTurnSubmission) {
            this.turnDataController.endTurn();
            const isFinalTurn = await this.turnDataController.isFinalTurn();
            if (isFinalTurn) {
                this.sceneObjectsController.onGameOver();
                this.onGameOver.trigger();
            } else {
                this.onTurnEnd.trigger();
            }
        }
    }

    async getUser(userIndex: number): Promise<SnapchatUser | null> {
        if (isNull(userIndex) || isNaN(userIndex) || userIndex < 0 || userIndex >= MAX_NUMBER_USERS) {
            return Promise.reject("User " + userIndex + " does not exist");
        }
        const turnCount = await this.turnDataController.getTurnCount();
        let isCurrentUser = turnCount % MAX_NUMBER_USERS === userIndex;

        if (global.deviceInfoSystem.isEditor() && this.debugMode === "Simulate Turns" && this.swapPlayersAfterSimulatedTurn) {
            isCurrentUser = userIndex === 0;
        }

        if (isCurrentUser) {
            return this.currentUserController.getCurrentUser();
        } else {
            return this.otherUserController.getOtherUser();
        }
    }

    async getCurrentUser(): Promise<SnapchatUser> {
        return this.getUser(await this.getCurrentUserIndex());
    }

    async getOtherUser(): Promise<SnapchatUser> {
        return this.getUser(MAX_NUMBER_USERS - 1 - (await this.getCurrentUserIndex()));
    }

    // Getters and setters

    get user1SceneObjects(): ReadonlyArray<SceneObject> {
        return this.sceneObjectsController.user1FlowObjects.slice();
    }

    set user1SceneObjects(so: SceneObject[]) {
        this.sceneObjectsController.user1FlowObjects =
            this.inputsValidator.validateFlowSceneObjects("User 1 Flow Objects", so);
    }

    get user2SceneObjects(): ReadonlyArray<SceneObject> {
        return this.sceneObjectsController.user2FlowObjects.slice();
    }

    set user2SceneObjects(so: SceneObject[]) {
        this.sceneObjectsController.user2FlowObjects =
            this.inputsValidator.validateFlowSceneObjects("User 2 Flow Objects", so);
    }

    get gameOverSceneObjects(): ReadonlyArray<SceneObject> {
        return this.sceneObjectsController.gameOverObjects.slice();
    }

    set gameOverSceneObjects(so: SceneObject[]) {
        this.sceneObjectsController.gameOverObjects =
            this.inputsValidator.validateFlowSceneObjects("Game Over Flow Objects", so);
    }

    get turnLimit(): number {
        return this.turnDataController.getTurnLimit();
    }

    set turnLimit(value: number) {
        this.turnDataController.setTurnLimit(this.inputsValidator.validateTurnLimit(true, value));
    }

    get tappableAreas(): ReadonlyArray<TappableAreaInput> {
        return this.tappablesHelper.getTappableAreasInput()
            .slice();
    }

    set tappableAreas(tappableAreaInput: TappableAreaInput[]) {
        this.tappablesHelper.setTappableAreasInput(this.inputsValidator.validateTappableAreas(tappableAreaInput));
    }

    get printLogs(): boolean {
        return this.logger.printInfoLogs;
    }

    set printLogs(value: boolean) {
        this.logger.printInfoLogs = value;
    }

    set turnsSavedLimit(turnsSavedLimit: number) {
        this.turnDataController.setTurnsSavedLimit(this.inputsValidator.validateTurnsSavedLimit(true, turnsSavedLimit));
    }

    get turnsSavedLimit(): number {
        return this.turnDataController.getTurnsSavedLimit();
    }

    private onLateUpdate = () => {
        this.turnDataSender.update();
    };

    private initialize(): void {
        this.allowSubscribingToStartEventAndChangingInputs(() => {
            this.getCurrentUserIndex()
                .then((currentUserIndex) => this.logger.logInfo("Current user index : " + currentUserIndex));
            this.logger.logInfo("Tapped key : " + this.getTappedKey());
            this.lateUpdateEvent.bind(this.onLateUpdate);
            this.checkIsPromptDataComplete();
            this.initializeTurnData();
            this.initializeOtherUserController();
            this.initializeSceneObjects();
            this.startTurn();

            if (this.showDebugView) {
                this.setupDebugViewUpdates();
            }
        });
    }

    private async checkIsPromptDataComplete(): Promise<void> {
        if (this.requireTurnSubmission) {
            const promptData = await this.promptDataController.getPromptData();
            const promptTurnExists = promptData.associatedData.turnCount >= 0;
            const isTurnComplete = promptData.associatedData.isTurnComplete;
            if (promptTurnExists && !isTurnComplete) {
                this.triggerOnErrorEvent(ComponentErrorCodes.INCOMPLETE_TURN_DATA_RECEIVED, "Previous turn was not complete");
            }
        }
    }

    private async initializeTurnData(): Promise<void> {
        const promptData = await this.promptDataController.getPromptData();
        this.turnDataController.initialize(promptData.associatedData);
    }

    private async initializeOtherUserController(): Promise<void> {
        const uriResource = await this.promptDataController.getOtherUserDynamicResource();
        this.otherUserController.setOtherUser(uriResource);
    }

    private async initializeSceneObjects(): Promise<void> {
        this.getCurrentUserIndex()
            .then((index) => this.sceneObjectsController.initialize(index));
    }

    private allowSubscribingToStartEventAndChangingInputs(onReady: () => void): void {
        this.createEvent("LateUpdateEvent")
            .bind((event) => {
                event.enabled = false;
                onReady();
            });
    }

    private async startTurn(): Promise<void> {
        const [promptDataVariables, turnCount, currentUserIndex] = await Promise.all([
            this.promptDataController.getAllVariables(),
            this.turnDataController.getTurnCount(),
            this.turnDataController.getCurrentUserIndex(),
        ]);
        this.logger.logInfo("Turn started");
        this.onTurnStart.trigger({
            turnCount,
            currentUserIndex,
            promptDataVariables,
            tappedKey: this.getTappedKey(),
        });
    }

    private createDataHandler(): IDataHandler {
        if (global.deviceInfoSystem.isEditor()) {
            switch (this.debugMode) {
                case "None":
                    return new DebugTypeNoneDataHandler();
                case "Simulate Turns":
                    return new DebugSimulateTurnsDataHandler(this, new ApiController(this.remoteServiceModule, this.logger));
                case "Single Turn":
                    const userDefinedGameVariables = DebugSingleTurnDataHandler.getUserDefinedGameVariablesMap(this.logger,
                        this.testDataType,
                        this.debugAssociatedDataStudioInputs,
                        this.debugAssociatedDataString);
                    const turnHistory = DebugSingleTurnDataHandler.getTurnHistory(this.debugTurnCount,
                        this.useTurnHistory,
                        this.turnsSavedLimitInput,
                        this.logger,
                        this.testDataType,
                        this.debugTurnHistoryStudioInputs.reverse(),
                        this.debugTurnHistoryStrings.reverse());
                    return new DebugSingleTurnDataHandler(this.logger, this.debugTurnCount, this.debugIsTurnComplete, userDefinedGameVariables, turnHistory);
            }
        }
        return new ApiController(this.remoteServiceModule, this.logger);
    }

    private validateInputs(): void {
        if (!this.remoteServiceModule) {
            this.logger.logError("Remote Service Module is missing. " + TurnBased.name + " is not available.");
        }
        this.turnLimitInput = this.inputsValidator.validateTurnLimit(this.useTurnLimit, this.turnLimitInput);
        this.tappableAreasInput = this.inputsValidator.validateTappableAreas(this.tappableAreasInput);
        this.user1FlowObjectsInputSO = this.inputsValidator.validateFlowSceneObjects("User 1 Flow Objects", this.user1FlowObjectsInputSO);
        this.user2FlowObjectsInputSO = this.inputsValidator.validateFlowSceneObjects("User 2 Flow Objects", this.user2FlowObjectsInputSO);
        this.gameOverObjectsInputSO = this.inputsValidator.validateFlowSceneObjects("Game Over Flow Objects", this.gameOverObjectsInputSO);
        this.debugAssociatedDataStudioInputs = this.inputsValidator.validateUserDefinedGameVariableInputs("Debug Associated Data", this.debugAssociatedDataStudioInputs);
        this.debugAssociatedDataString = this.inputsValidator.validateDebugAssociatedDataString(this.debugAssociatedDataString);
        this.debugTurnHistoryStudioInputs = this.inputsValidator.validateDebugTurnHistoryStudioInputs(this.debugTurnHistoryStudioInputs);
        this.debugTurnHistoryStrings = this.inputsValidator.validateDebugTurnHistoryStrings(this.debugTurnHistoryStrings);
        this.debugTurnCount = this.inputsValidator.validateDebugTurnCount(this.debugTurnCount);
        this.defaultTurnVariables = this.inputsValidator.validateUserDefinedGameVariableInputs("Default Turn Variables", this.defaultTurnVariables);
        this.turnsSavedLimitInput = this.inputsValidator.validateTurnsSavedLimit(this.useTurnHistory, this.turnsSavedLimitInput);
    }

    private triggerOnErrorEvent(code: ComponentErrorCodes, description: string): void {
        this.onError.trigger({ code, description });
        this.logger.logError("Error : " + code + " " + description);
    }

    private async getUserDataStorage(userIndex: number): Promise<StorageAccessor> {
        return this.turnDataController.getUserDataStorage(userIndex);
    }

    private async getCurrentUserDataStorage(): Promise<StorageAccessor> {
        return this.getUserDataStorage(await this.getCurrentUserIndex());
    }

    private async getOtherUserDataStorage(): Promise<StorageAccessor> {
        return this.getUserDataStorage(MAX_NUMBER_USERS - 1 - await this.getCurrentUserIndex());
    }

    private setupDebugViewUpdates(): void {
        let isUpdateQueued = false;
        this.createEvent("UpdateEvent").bind(() => {
            if (!isUpdateQueued) {
                isUpdateQueued = true;
                this.updateDebugView().then(() => {
                    isUpdateQueued = false;
                });
            }
        });
    }

    private async updateDebugView(): Promise<void> {
        const [globalVariables, currentUserVariables, otherUserVariables, promptDataVariables, turnCount, currentUserIndex] = await Promise.all([
            this.getGlobalVariables(),
            this.getCurrentUserVariables(),
            this.getOtherUserVariables(),
            this.promptDataController.getAllVariables(),
            this.turnDataController.getTurnCount(),
            this.turnDataController.getCurrentUserIndex(),
        ]);
        const turnDataVariables = this.turnDataController.getAssociatedData().userDefinedGameVariables;

        let message = `Turn Count: ${turnCount}\nCurrent User Index: ${currentUserIndex}\nTapped Key: ${this.getTappedKey()}\n`;

        const addJsonMessage = (title: string, data: any) => {
            const dataString = JSON.stringify(data, null, 2);
            message += `\n${title}:\n${dataString}\n`;
        };

        addJsonMessage("Global Variables", globalVariables);
        addJsonMessage("Current User Variables", currentUserVariables);
        addJsonMessage("Other User Variables", otherUserVariables);
        addJsonMessage("Prompt Data Variables", promptDataVariables);
        addJsonMessage("Turn Data Variables", turnDataVariables);

        DebugView.getInstance().setTrackedData(message);
    }

    private setupEventsResponses(): void {
        const createResponses = (configs: DiscreteResponseConfig[]) => configs
            .map(config => DiscreteResponse.createFromConfig(config, this.componentContext))
            .filter(response => !!response);

        const onTurnStartResponses = createResponses(this._onTurnStartResponses);
        const onTurnEndResponses = createResponses(this._onTurnEndResponses);
        const onGameOverResponses = createResponses(this._onGameOverResponses);

        const responsesTriggerFunctor = (responses: DiscreteResponse[]) => (data?: any) => {
            for (const response of responses) {
                response.trigger(data);
            }
        };

        this.onTurnStart.add(responsesTriggerFunctor(onTurnStartResponses));
        this.onTurnEnd.add(responsesTriggerFunctor(onTurnEndResponses));
        this.onGameOver.add(responsesTriggerFunctor(onGameOverResponses));
    }
}
