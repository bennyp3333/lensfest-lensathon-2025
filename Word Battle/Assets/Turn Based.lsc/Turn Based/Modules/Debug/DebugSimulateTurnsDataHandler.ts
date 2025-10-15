import { IDataHandler } from "../Data/IDataHandler";
import { ApiController, TappableAreaConfig } from "../RemoteAPI/ApiController";
import { SerializedPromptData } from "../Data/DataInterfaces";
import { AssociatedDataHelper } from "../Data/AssociatedDataHelper";

export class DebugSimulateTurnsDataHandler implements IDataHandler {

    private associatedData: string;

    private tappables: TappableAreaConfig[];

    private isComplete: boolean = false;

    constructor(
        private readonly script: BaseScriptComponent,
        private readonly debugApiController: ApiController,
    ) {
        if (global.deviceInfoSystem.isEditor()) {
            this.script.createEvent("SnapImageCaptureEvent")
                .bind(this.sendData);
            this.script.createEvent("SnapRecordStopEvent")
                .bind(this.sendData);
        }
    }

    async getPromptData(): Promise<SerializedPromptData> {
        const promptData = await this.debugApiController.getPromptData();
        if (AssociatedDataHelper.isFirstTurnInEditor(promptData)) {
            return Promise.resolve(null);
        } else {
            return promptData;
        }
    }

    setPromptData(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean,
        onSuccess: () => void, onFailure: () => void): void {
        if (!isNull(associatedData)) {
            this.associatedData = associatedData;
        }
        if (!isNull(tappables)) {
            this.tappables = tappables;
        }
        if (!isNull(isComplete)) {
            this.isComplete = isComplete;
        }
        onSuccess();
    }

    requestCompliesWithSizeLimits(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean): boolean {
        return this.debugApiController.requestCompliesWithSizeLimits(associatedData, tappables, score, isComplete);
    }

    private sendData = () => {
        if (this.isComplete) {
            this.debugApiController.setPromptData("", [], null, this.isComplete, () => {}, () => {});
        } else {
            this.debugApiController.setPromptData(this.associatedData, this.tappables, 0, this.isComplete, () => {}, () => {});
        }
    };
}
