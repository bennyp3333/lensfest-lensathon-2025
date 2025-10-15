import { TappableAreaConfig } from "../RemoteAPI/ApiController";
import { SerializedPromptData } from "./DataInterfaces";

export interface IDataHandler {
    requestCompliesWithSizeLimits(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean): boolean;

    setPromptData(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean, onSuccess: () => void, onFailure: () => void): void;

    getPromptData(): Promise<SerializedPromptData>;
}
