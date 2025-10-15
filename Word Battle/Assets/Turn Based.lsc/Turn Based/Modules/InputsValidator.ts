import { DebugTurnHistoryJsonStrings, DebugTurnHistoryStudioInputs, TappableAreaInput, UserDefinedGameVariableInput } from "../Turn Based";
import { Logger } from "./Helpers/Logger";
import { TappablesValidator } from "./Tappables/TappablesValidator";

export class InputsValidator {

    constructor(private readonly logger: Logger) {}

    validateTurnLimit(useTurnLimit: boolean, turnLimit: number): number {
        if (useTurnLimit) {
            const minTurnLimitValue = 2;
            if (!isNull(turnLimit) && turnLimit < minTurnLimitValue) {
                this.logger.logWarning("Turn Limit should not be less than " + minTurnLimitValue
                    + ". Skipping turn limit.");
                return null;
            }
            if (isNaN(turnLimit)) {
                this.logger.logWarning("Turn limit is not a number. Skipping turn limit.");
                return null;
            }
            return Math.floor(turnLimit);
        }
        return turnLimit;
    }

    validateTappableAreas(tappableAreas: TappableAreaInput[]): TappableAreaInput[] {
        if (isNull(tappableAreas)) {
            this.logger.logWarning("Tappable areas can not be null or undefined. Skipping tappable areas");
            return [];
        }
        const usedKeys: string[] = [];
        const validTappableAreas = tappableAreas.filter((area) => {
            if (isNull(area)) {
                this.logger.logWarning("Skipping null or undefined tappable area.");
                return false;
            }
            if (usedKeys.some((key) => key === area.key)) {
                this.logger.logWarning("Key \"" + area.key + "\" is already used. All keys must be unique.");
                return false;
            }
            const isValid = this.isTappableAreaValid(area.key, area.screenTransform);
            if (!isValid) {
                return false;
            }
            usedKeys.push(area.key);
            return true;
        });
        return validTappableAreas;
    }

    isTappableAreaValid(key: string, st: ScreenTransform): boolean {
        if (isNull(key) || key.length === 0) {
            this.logger.logWarning("Skipping tappable area with null, undefined or empty string key");
            return false;
        }
        if (typeof key !== "string") {
            this.logger.logWarning("Skipping tappable area with not a string key");
            return false;
        }
        if (key.length > TappablesValidator.KEY_LENGTH_LIMIT) {
            this.logger.logWarning("Warning: \"" + key + "\" key for tappable area must be " + TappablesValidator.KEY_LENGTH_LIMIT + " characters or fewer.");
            return false;
        }
        if (isNull(st)) {
            this.logger.logWarning("Skipping tappable area with null or undefined screen transform");
            return false;
        }
        if (!st.isOfType || !st.isOfType("Component.ScreenTransform")) {
            this.logger.logWarning("Skipping tappable area with incorrect screen transform type (not a ScreenTransform)");
            return false;
        }
        return true;
    }

    validateFlowSceneObjects(name: string, flowSceneObjectsSO: SceneObject[]): SceneObject[] {
        if (isNull(flowSceneObjectsSO)) {
            this.logger.logWarning(name + " can not be null or undefined. Skipping " + name);
            return [];
        }
        const validFlowSceneObjects = flowSceneObjectsSO.filter((sceneObject) => {
            if (isNull(sceneObject)) {
                this.logger.logWarning("Skipping null or undefined scene object in array : " + name);
                return false;
            }
            if (!sceneObject.isOfType || !sceneObject.isOfType("SceneObject")) {
                this.logger.logWarning("Skipping element which is not a SceneObject in array : " + name);
                return false;
            }
            return true;
        });
        return validFlowSceneObjects;
    }

    isTurnVariableKeyValid(key: string): boolean {
        return !isNull(key);
    }

    validateUserDefinedGameVariableInputs(name: string, inputs: UserDefinedGameVariableInput[]): UserDefinedGameVariableInput[] {
        if (isNull(inputs)) {
            this.logger.logWarning(name + " can not be null or undefined. Skipping " + name);
            return [];
        }
        const validInputs = inputs.filter((input) => {
            if (isNull(input)) {
                this.logger.logWarning("Skipping null or undefined scene object in array : " + name);
                return false;
            }
            if (!input.key) {
                this.logger.logWarning("Skipping null, undefined or empty string key in array : " + name);
                return false;
            }
            switch (input.type) {
                case "string":
                case "float":
                case "boolean":
                    break;
                default:
                    this.logger.logWarning("Skipping unsupported input type : " + input.type + " in array : " + name);
                    return false;
            }
            return true;
        });
        return validInputs;
    }

    validateDebugTurnCount(turnCount: number): number {
        if (isNull(turnCount) || isNaN(turnCount)) {
            this.logger.logWarning("Turn count can not be null, undefined or not a number");
            return 0;
        }
        return Math.floor(turnCount);
    }

    validateArray<T>(name: string, array: T[]): T[] {
        if (isNull(array)) {
            this.logger.logWarning("Array : " + name + " can not be null or undefined");
            return [];
        }
        return array;
    }

    validateDebugAssociatedDataString(json: string): string {
        json = json.split("\\{")
            .join("{")
            .split("\\}")
            .join("}");
        try {
            JSON.parse(json);
        } catch (error) {
            this.logger.logWarning("Test data is not a valid json : " + error);
            return "{}";
        }
        return json;
    }

    validateDebugTurnHistoryStrings(debugTurnHistory: DebugTurnHistoryJsonStrings[]): DebugTurnHistoryJsonStrings[] {
        if (isNull(debugTurnHistory)) {
            this.logger.logWarning("Debug Turn History can not be null or undefined");
            return [];
        }
        return debugTurnHistory.map((turnHistory) => {
            turnHistory.variables = turnHistory.variables.split("\\{")
                .join("{")
                .split("\\}")
                .join("}");
            try {
                JSON.parse(turnHistory.variables);
            } catch (error) {
                this.logger.logWarning("Test Debug turn history entry is not a valid json : " + error);
                turnHistory.variables = "{}";
            }
            return turnHistory;
        });
    }

    validateDebugTurnHistoryStudioInputs(inputs: DebugTurnHistoryStudioInputs[]): DebugTurnHistoryStudioInputs[] {
        if (isNull(inputs)) {
            this.logger.logWarning("Debug turns history can not be null or undefined");
            return [];
        }
        return inputs.map((input, index) => {
            return {
                isTurnComplete: !!input.isTurnComplete,
                variables: this.validateUserDefinedGameVariableInputs("Debug Turns History " + index, input.variables),
            };
        });
    }

    validateTurnsSavedLimit(useTurnHistory: boolean, turnsSavedLimit: number): number {
        if (useTurnHistory) {
            if (isNull(turnsSavedLimit)) {
                this.logger.logWarning("Turns saved limit can not be null or undefined");
                return 0;
            }
            if (turnsSavedLimit < 0) {
                this.logger.logWarning("Turns saved limit can not be less than 0");
                return 0;
            }
            return Math.floor(turnsSavedLimit);
        }
        return turnsSavedLimit;
    }
}
