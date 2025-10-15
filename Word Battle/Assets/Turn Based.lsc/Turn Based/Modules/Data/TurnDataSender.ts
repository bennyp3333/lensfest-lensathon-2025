import { TappablesController } from "../Tappables/TappablesController";
import { IDataHandler } from "./IDataHandler";
import { TurnDataController } from "./TurnDataController";
import { AssociatedDataHelper } from "./AssociatedDataHelper";
import { Logger } from "../Helpers/Logger";
import { PromptAssociatedData } from "./DataInterfaces";
import { TappableAreaConfig } from "../RemoteAPI/ApiController";

export class TurnDataSender {
    constructor(private readonly logger: Logger,
        private readonly dataHandler: IDataHandler,
        private readonly tappablesController: TappablesController,
        private readonly turnDataController: TurnDataController) {}

    update(): void {
        const isGameOverModified = this.turnDataController.wasIsGameOverModified();
        const isComplete = this.turnDataController.isCompleteWatcher.getData();
        this.tappablesController.setIsGameOver(isComplete);
        const tappablesModified = this.tappablesController.wasModified();
        const storageDataModified = this.turnDataController.wasStorageDataModified();
        const turnDataModified = this.turnDataController.wasTurnDataModified();
        const shouldSetPromptData = tappablesModified || storageDataModified || turnDataModified || isGameOverModified;
        if (shouldSetPromptData) {
            const tappables = this.tappablesController.getTappableAreaConfig();
            let associatedData = this.turnDataController.getAssociatedData();
            const score = this.turnDataController.getScore();
            if (associatedData && associatedData.turnHistory) {
                associatedData.turnHistory = associatedData.turnHistory.slice();
                associatedData = this.applyTurnHistoryLimits(associatedData, tappables, score, isComplete);
            }

            const serializedAssociatedData = isNull(associatedData)
                ? undefined : AssociatedDataHelper.serialize(this.logger, associatedData);
            if (!isNull(serializedAssociatedData)) {
                this.logger.logInfo("Sending associated data : " + serializedAssociatedData);
            }
            if (!isNull(tappables)) {
                this.logger.logInfo("Sending tappables : " + JSON.stringify(tappables));
            }
            if (!isNull(isComplete)) {
                this.logger.logInfo("Sending isComplete : " + isComplete);
            }
            const isTurnDataCompleteSent = !!(associatedData && associatedData.isTurnComplete);
            this.dataHandler.setPromptData(serializedAssociatedData, tappables, score, isComplete, () => {
                this.turnDataController.onIsTurnDataCompleteSend(isTurnDataCompleteSent);
            }, () => {});
        }
        this.turnDataController.resetModified();
    }

    private applyTurnHistoryLimits(associatedData: PromptAssociatedData, tappables: TappableAreaConfig[], score: number, isComplete: boolean): PromptAssociatedData {
        let numTurnHistoryEntriesRemoved = 0;
        let serializedAssociatedData = AssociatedDataHelper.serialize(this.logger, associatedData);
        while (associatedData.turnHistory.length > 0
        && !this.dataHandler.requestCompliesWithSizeLimits(serializedAssociatedData, tappables, score, isComplete)) {
            associatedData.turnHistory.shift();
            serializedAssociatedData = AssociatedDataHelper.serialize(this.logger, associatedData);
            numTurnHistoryEntriesRemoved++;
        }
        if (numTurnHistoryEntriesRemoved > 0) {
            this.logger.logWarning("Removed " + numTurnHistoryEntriesRemoved + " turn history entries, because request size exceeded limits");
        }
        return associatedData;
    }
}
