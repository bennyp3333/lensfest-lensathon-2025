import { IDataHandler } from "../Data/IDataHandler";
import { TappableAreaConfig } from "../RemoteAPI/ApiController";
import { SerializedPromptData } from "../Data/DataInterfaces";

export class DebugTypeNoneDataHandler implements IDataHandler {

    getPromptData(): Promise<SerializedPromptData> {
        return Promise.resolve(null);
    }

    setPromptData(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean,
        onSuccess: () => void, onFailure: () => void): void {
        onSuccess();
    }

    requestCompliesWithSizeLimits(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean): boolean {
        return true;
    }
}
