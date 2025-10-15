import { UserDefinedGameVariable, UserDefinedGameVariablesMap } from "../../Turn Based";
import { Logger } from "../Helpers/Logger";
import { IDataHandler } from "./IDataHandler";
import { AssociatedDataHelper } from "./AssociatedDataHelper";
import { PromptAssociatedData, PromptData, SerializedPromptData } from "./DataInterfaces";

export class PromptDataController {

    private readonly promptDataPromise: Promise<PromptData>;

    constructor(private readonly dataHandler: IDataHandler, private readonly logger: Logger) {
        this.promptDataPromise = this.loadPromptData();
    }

    async getIsTurnComplete(): Promise<boolean> {
        const promptData = await this.promptDataPromise;
        return promptData.associatedData.isTurnComplete;
    }

    getPromptData(): Promise<PromptData> {
        return this.promptDataPromise;
    }

    async getVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        const promptData = await this.promptDataPromise;
        return promptData.associatedData.userDefinedGameVariables[key];
    }

    async getOtherUserDynamicResource(): Promise<DynamicResource> {
        const promptData = await this.promptDataPromise;
        return promptData.otherUser;
    }

    async getAllVariables(): Promise<UserDefinedGameVariablesMap> {
        const promptData = await this.promptDataPromise;
        return promptData.associatedData.userDefinedGameVariables;
    }

    async getPreviousTurnCount(): Promise<number> {
        const promptData = await this.promptDataPromise;
        return promptData.associatedData.turnCount;
    }

    protected deserializePromptData(data: SerializedPromptData): PromptData {
        const newGameAssociatedData = AssociatedDataHelper.createEmpty(-1);
        if (!data) {
            return { associatedData: newGameAssociatedData, otherUser: null };
        }
        let associatedData: PromptAssociatedData = isNull(data.associatedData)
            ? newGameAssociatedData
            : AssociatedDataHelper.deserialize(this.logger, data.associatedData);
        if (isNull(associatedData)) {
            associatedData = newGameAssociatedData;
            this.logger.logError("Associated data is invalid. Starting new game.");
        } else {
            const isTurnCountValid = !isNull(associatedData.turnCount) && !isNaN(associatedData.turnCount)
                && associatedData.turnCount >= 0;
            if (!isTurnCountValid) {
                this.logger.logError("Turn count is invalid : " + associatedData.turnCount
                    + ". Starting new game.");
                associatedData = newGameAssociatedData;
            }
            const areUserDefinedGameVariablesValid = !isNull(associatedData.userDefinedGameVariables);
            if (!areUserDefinedGameVariablesValid) {
                this.logger.logError("User defined variables are invalid : " + associatedData.userDefinedGameVariables
                    + ". Starting new game.");
                associatedData = newGameAssociatedData;
            }
        }
        return { associatedData, otherUser: data.otherUser };
    }

    protected async loadPromptData(): Promise<PromptData> {
        const serializedPromptData = await this.dataHandler.getPromptData();
        return this.deserializePromptData(serializedPromptData);
    }
}
