import { UserDefinedGameVariablesMap } from "../../Turn Based";
import { Logger } from "../Helpers/Logger";
import { PromptAssociatedData, SerializedPromptData } from "./DataInterfaces";

export class AssociatedDataHelper {

    static deserialize(logger: Logger, associatedData: string): PromptAssociatedData | null {
        try {
            return JSON.parse(associatedData);
        } catch (error) {
            logger.logError("Error while deserializing associated data : " + error.message);
            return null;
        }
    }

    static serialize(logger: Logger, associatedData: PromptAssociatedData, formatted?: boolean): string {
        try {
            if (formatted) {
                return JSON.stringify(associatedData, null, "\t");
            } else {
                return JSON.stringify(associatedData);
            }
        } catch (error) {
            logger.logError("Error while serializing associated data : " + error.message);
            return JSON.stringify(null);
        }
    }

    static createEmpty(turnCount: number, defaultValues?: UserDefinedGameVariablesMap): PromptAssociatedData {
        return {
            turnCount,
            userDefinedGameVariables: defaultValues
                ? defaultValues
                : {},
            user0Storage: {},
            user1Storage: {},
            globalStorage: {},
            isTurnComplete: false,
            turnHistory: [],
        };
    }

    static isFirstTurnInEditor(promptData: SerializedPromptData): boolean {
        return isNull(promptData) || isNull(promptData.associatedData)
            || promptData.associatedData.length === 0;
    }
}
