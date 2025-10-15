import { MAX_NUMBER_USERS, TurnHistoryEntry, UserDefinedGameVariable, UserDefinedGameVariableInput } from "../../Turn Based";
import { Logger } from "../Helpers/Logger";
import { getUserDefinedGameVariablesMapFromInputs } from "../Helpers/Helpers";
import { PromptAssociatedData } from "./DataInterfaces";
import { Watcher } from "../Helpers/Watcher";
import { StorageAccessor } from "./StorageAccessor";

export class TurnDataController {

    readonly initializedPromise: Promise<PromptAssociatedData>;
    private onInitialized: (turnData: PromptAssociatedData) => void;

    readonly isCompleteWatcher: Watcher<boolean>;

    private readonly turnData: PromptAssociatedData;

    private isGameOverValue: boolean = false;

    private isTurnDataCompleteSentValue: boolean = false;

    private wasTurnDataChanged: boolean = false;

    private score: number | null = null;

    private globalStorage: StorageAccessor;
    private user0Storage: StorageAccessor;
    private user1Storage: StorageAccessor;

    constructor(private turnLimit: number,
        private readonly logger: Logger,
        private turnsSavedLimit: number,
        private requireTurnSubmission: boolean,
        private allowChangingTurnVariablesAfterTurnSubmission: boolean,
        defaultTurnGameVariables: UserDefinedGameVariableInput[]) {
        this.isCompleteWatcher = new Watcher(() => this.wasInitialised() ? this.isFinalTurnForTurnCount(this.turnData.turnCount) : undefined);
        this.initializedPromise = new Promise((resolve) => this.onInitialized = resolve);
        this.turnData = {
            turnCount: undefined,
            userDefinedGameVariables: getUserDefinedGameVariablesMapFromInputs(defaultTurnGameVariables),
            user0Storage: undefined,
            user1Storage: undefined,
            globalStorage: undefined,
            turnHistory: undefined,
            isTurnComplete: this.requireTurnSubmission ? false : undefined,
        };

        this.globalStorage = new StorageAccessor(this.initializedPromise.then(data => data.globalStorage));
        this.user0Storage = new StorageAccessor(this.initializedPromise.then(data => data.user0Storage));
        this.user1Storage = new StorageAccessor(this.initializedPromise.then(data => data.user1Storage));
    }

    setScore(score: number | null): void {
        this.score = score;
    }

    getScore(): number | null {
        return this.score;
    }

    wasTurnDataModified(): boolean {
        if (!this.wasInitialised()) {
            return false;
        }
        return this.wasTurnDataChanged;
    }

    wasStorageDataModified(): boolean {
        if (!this.wasInitialised()) {
            return false;
        }
        return this.globalStorage.wasDataChanged
            || this.user0Storage.wasDataChanged
            || this.user1Storage.wasDataChanged;
    }

    wasIsGameOverModified(): boolean {
        if (!this.wasInitialised()) {
            return false;
        }
        return this.isCompleteWatcher.update();
    }

    resetModified(): void {
        this.wasTurnDataChanged = false;
        this.globalStorage.wasDataChanged = false;
        this.user0Storage.wasDataChanged = false;
        this.user1Storage.wasDataChanged = false;
    }

    getAssociatedData(): PromptAssociatedData {
        return this.turnData;
    }

    getIsComplete(): boolean {
        if (!this.wasInitialised()) {
            return false;
        }
        return this.isFinalTurnForTurnCount(this.turnData.turnCount);
    }

    async getCurrentUserIndex(): Promise<number> {
        await this.initializedPromise;
        return this.turnData.turnCount % MAX_NUMBER_USERS;
    }

    async initialize(promptData: PromptAssociatedData): Promise<void> {
        const currentTurnCount = promptData.turnCount + 1;
        const turnHistory = currentTurnCount === 0
            ? []
            : [...promptData.turnHistory, {
                turnCount: promptData.turnCount,
                isTurnComplete: promptData.isTurnComplete,
                userDefinedGameVariables: promptData.userDefinedGameVariables,
            }];
        this.removeOldTurnHistoryEntries(turnHistory, false);
        this.turnData.turnHistory = turnHistory;
        this.turnData.turnCount = currentTurnCount;
        this.wasTurnDataChanged = true;

        this.turnData.user0Storage = promptData.user0Storage;
        this.turnData.user1Storage = promptData.user1Storage;
        this.turnData.globalStorage = promptData.globalStorage;

        this.onInitialized(this.turnData);
    }

    setIsGameOver(isGameOver: boolean): void {
        this.isGameOverValue = isGameOver;
    }

    endTurn(): void {
        if (this.requireTurnSubmission) {
            this.turnData.isTurnComplete = true;
            this.wasTurnDataChanged = true;
        }
    }

    getTurnLimit(): number {
        return this.turnLimit;
    }

    setTurnLimit(turnLimit: number): void {
        this.turnLimit = turnLimit;
    }

    getVariable(key: string): UserDefinedGameVariable | undefined {
        return this.turnData.userDefinedGameVariables[key];
    }

    setVariable(key: string, value: UserDefinedGameVariable): void {
        if (!this.canChangeVariables()) {
            this.logger.logWarning("Turn ended. Can not update turn variables");
            return;
        }
        if (typeof value === "object") {
            this.wasTurnDataChanged = true;
        }
        if (this.turnData.userDefinedGameVariables[key] !== value) {
            this.wasTurnDataChanged = true;
        }
        this.turnData.userDefinedGameVariables[key] = value;
    }

    clearVariables(): void {
        if (!this.canChangeVariables()) {
            this.logger.logWarning("Turn ended. Can not clear turn variables");
            return;
        }
        if (Object.keys(this.turnData.userDefinedGameVariables).length > 0) {
            this.wasTurnDataChanged = true;
        }
        this.turnData.userDefinedGameVariables = {};
    }

    async getTurnCount(): Promise<number> {
        await this.initializedPromise;
        return this.turnData.turnCount;
    }

    async getTurnHistory(): Promise<TurnHistoryEntry[]> {
        await this.initializedPromise;
        return this.turnData.turnHistory;
    }

    async setTurnsSavedLimit(turnsSavedLimit: number): Promise<void> {
        await this.initializedPromise;
        this.turnsSavedLimit = turnsSavedLimit;
        this.removeOldTurnHistoryEntries(this.turnData.turnHistory, false);
    }

    getTurnsSavedLimit(): number {
        return this.turnsSavedLimit;
    }

    async getTurn(turnCount: number): Promise<TurnHistoryEntry | null> {
        await this.initializedPromise;
        const turnHistory = this.turnData.turnHistory;
        const turnHistoryEntry = turnHistory.find((entry) => entry.turnCount === turnCount);
        return turnHistoryEntry || null;
    }

    async getPreviousTurn(): Promise<TurnHistoryEntry | null> {
        await this.initializedPromise;
        const turnCount = this.turnData.turnCount;
        return this.getTurn(turnCount - 1);
    }

    async isFinalTurn(): Promise<boolean> {
        await this.initializedPromise;
        const turnCount = this.turnData.turnCount;
        return this.isFinalTurnForTurnCount(turnCount);
    }

    onIsTurnDataCompleteSend(isTurnDataComplete: boolean): void {
        if (isTurnDataComplete) {
            this.isTurnDataCompleteSentValue = isTurnDataComplete;
        }
    }

    wasIncompleteDataSent(): boolean {
        return !this.isTurnDataCompleteSentValue;
    }

    async getUserDataStorage(userIndex: number): Promise<StorageAccessor> {
        if (isNull(userIndex) || isNaN(userIndex) || userIndex < 0 || userIndex >= MAX_NUMBER_USERS) {
            return Promise.reject("User " + userIndex + " does not exist");
        }
        return userIndex === 0 ? this.user0Storage : this.user1Storage;
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
        return await this.globalStorage.getAllVariables();
    }

    async getGlobalVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        return await this.globalStorage.getVariable(key);
    }

    async setGlobalVariable(key: string, value: UserDefinedGameVariable): Promise<void> {
        return this.globalStorage.setVariable(key, value);
    }

    private removeOldTurnHistoryEntries(turnHistory: TurnHistoryEntry[], shouldCountPromptData: boolean): void {
        if (isNull(this.turnsSavedLimit)) {
            return;
        }
        const limit = Math.max(0, shouldCountPromptData ? this.turnsSavedLimit - 1 : this.turnsSavedLimit);
        while (turnHistory.length > limit) {
            turnHistory.shift();
        }
    }

    private isFinalTurnForTurnCount(turnCount: number): boolean {
        const isLastTurn = this.turnLimit !== null && this.turnLimit !== undefined
            && this.turnLimit > 0 && turnCount + 1 >= this.turnLimit;
        return isLastTurn || this.isGameOverValue;
    }

    private wasInitialised(): boolean {
        return this.turnData.turnCount !== undefined;
    }

    private canChangeVariables(): boolean {
        return this.allowChangingTurnVariablesAfterTurnSubmission || !this.turnData.isTurnComplete || !this.requireTurnSubmission;
    }
}
