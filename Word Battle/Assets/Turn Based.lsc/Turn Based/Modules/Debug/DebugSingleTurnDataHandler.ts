import { DebugTurnHistoryJsonStrings, DebugTurnHistoryStudioInputs, TurnHistoryEntry, UserDefinedGameVariableInput, UserDefinedGameVariablesMap } from "../../Turn Based";
import { IDataHandler } from "../Data/IDataHandler";
import { AssociatedDataHelper } from "../Data/AssociatedDataHelper";
import { SerializedPromptData } from "../Data/DataInterfaces";
import { getUserDefinedGameVariablesMapFromInputs } from "../Helpers/Helpers";
import { Logger } from "../Helpers/Logger";
import { TappableAreaConfig } from "../RemoteAPI/ApiController";

export class DebugSingleTurnDataHandler implements IDataHandler {

    static getUserDefinedGameVariablesMap(logger: Logger, testDataType: string, studioInputs: UserDefinedGameVariableInput[],
        inputString: string): UserDefinedGameVariablesMap {
        switch (testDataType) {
            case "Studio Inputs":
                return getUserDefinedGameVariablesMapFromInputs(studioInputs);
            case "JSON String":
                try {
                    return JSON.parse(inputString);
                } catch (error) {
                    logger.logWarning("Error while parsing debug json string : " + error.message);
                    return {};
                }
        }
        return {};
    }

    static getTurnHistory(currentTurnCount: number, useTurnHistory: boolean, turnsSavedLimitInput: number,
        logger: Logger, testDataType: string, studioInputs: DebugTurnHistoryStudioInputs[],
        inputStrings: DebugTurnHistoryJsonStrings[]): TurnHistoryEntry[] {
        const maxNumEntries = useTurnHistory ? turnsSavedLimitInput : 0;
        switch (testDataType) {
            case "Studio Inputs":
                return studioInputs.slice(0, maxNumEntries)
                    .map((entry, index) => {
                        return {
                            turnCount: currentTurnCount - 1 - studioInputs.length + index,
                            userDefinedGameVariables: getUserDefinedGameVariablesMapFromInputs(entry.variables),
                            isTurnComplete: entry.isTurnComplete,
                        };
                    })
                    .filter((entry) => {
                        const isValid = entry.turnCount >= 0;
                        if (!isValid) {
                            logger.logWarning("Skipping turn history entry with invalid turn count : " + entry.turnCount);
                        }
                        return isValid;
                    });
            case "JSON String":
                return inputStrings.slice(0, maxNumEntries)
                    .map((entry, index) => {
                        let userDefinedGameVariables = {};
                        try {
                            userDefinedGameVariables = JSON.parse(entry.variables);
                        } catch (error) {
                            logger.logWarning("Error while parsing debug json string : " + error.message);
                        }
                        return {
                            turnCount: currentTurnCount - 1 - studioInputs.length + index,
                            userDefinedGameVariables,
                            isTurnComplete: entry.isTurnComplete,
                        };
                    });
        }
        return [];
    }

    constructor(private readonly logger: Logger,
        private readonly debugTurnCount: number,
        private readonly isTurnComplete: boolean,
        private readonly debugUserDefinedGameVariables: UserDefinedGameVariablesMap,
        private readonly turnHistory: TurnHistoryEntry[]) {}

    getPromptData(): Promise<SerializedPromptData> {
        return Promise.resolve({
            associatedData: AssociatedDataHelper.serialize(this.logger, {
                turnCount: this.debugTurnCount - 1,
                userDefinedGameVariables: this.debugUserDefinedGameVariables,
                user0Storage: {},
                user1Storage: {},
                globalStorage: {},
                turnHistory: this.turnHistory,
                isTurnComplete: this.isTurnComplete,
            }),
            otherUser: null,
        });
    }

    setPromptData(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean, onSuccess: () => void, onFailure: () => void): void {
        // Skip setting prompt data
        onSuccess();
    }

    requestCompliesWithSizeLimits(): boolean {
        return true;
    }
}
