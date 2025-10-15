import { Logger } from "../Helpers/Logger";
import { IDataHandler } from "../Data/IDataHandler";
import { RemoteAPIWrapper } from "./RemoteAPIWrapper";
import { makeNetworkErrorMessage } from "./RemoteAPIError";
import { SerializedPromptData } from "../Data/DataInterfaces";

const ENDPOINT_SET_PROMPT_DATA = "set_prompt_data";
const ENDPOINT_GET_PROMPT_DATA = "get_prompt_data";

const PAYLOAD_TOTAL_SIZE_LIMIT_BYTES = 4 * 1024 * 1024;

export interface TappableAreaConfig {
    key: string;
    normalizedX?: number;
    normalizedY?: number;
    normalizedWidth?: number;
    normalizedHeight?: number;
    rotationDegrees?: number;
}

interface GetPromptDataResponseBody {
    associatedData: string;
    currentUserDisplayName: string;
    otherUserDisplayName: string;
}

interface SetPromptDataRequestBody {
    associatedData: string;
    tappables: TappableAreaConfig[];
    score?: number;
    isComplete: boolean;
}

export class ApiController implements IDataHandler {
    private readonly apiWrapper: RemoteAPIWrapper;
    private readonly promptDataPromise: Promise<SerializedPromptData>;

    constructor(private readonly remoteServiceModule: RemoteServiceModule, private readonly logger: Logger) {
        this.apiWrapper = new RemoteAPIWrapper(this.remoteServiceModule);
    }

    requestCompliesWithSizeLimits(associatedData: string, tappables: TappableAreaConfig[], score: number, isComplete: boolean): boolean {
        return this.createSetPromptDataRequestBody(associatedData, tappables, score, isComplete).length < PAYLOAD_TOTAL_SIZE_LIMIT_BYTES;
    }

    setPromptData(
        associatedData: string,
        tappables: TappableAreaConfig[],
        score: number,
        isComplete: boolean,
        onSuccess: () => void, onFailure: () => void,
    ): void {
        const onSuccessRunOnce = () => {
            onSuccess && onSuccess();
            onSuccess = null;
        };
        if (!this.remoteServiceModule) {
            onFailure();
            return;
        }
        const request = RemoteApiRequest.create();
        request.endpoint = ENDPOINT_SET_PROMPT_DATA;
        request.body = this.createSetPromptDataRequestBody(associatedData, tappables, score, isComplete);
        if (request.body.length > PAYLOAD_TOTAL_SIZE_LIMIT_BYTES) {
            this.logger.logError("Total payload size exceeds limits");
            onFailure();
            return;
        }
        try {
            this.apiWrapper.doAPIRequest(request, () => {
                this.logger.logInfo("Prompt data successfully sent.");
                onSuccessRunOnce();
            }, (error) => {
                this.logger.logError("Failed to set prompt data: " + makeNetworkErrorMessage(error.bodyText, error.statusCode));
                onFailure();
            });
            if (global.deviceInfoSystem.isEditor()) {
                // in editor response is never received, skip waiting for doAPIRequest response
                onSuccessRunOnce();
            }
        } catch (error) {
            this.logger.logError("Error while sending set prompt data request: " + error.message);
            onFailure();
        }
    }

    getPromptData(): Promise<SerializedPromptData> {
        if (!this.remoteServiceModule) {
            return Promise.resolve(null);
        }
        return new Promise((resolve) => {
            const request = RemoteApiRequest.create();
            request.endpoint = ENDPOINT_GET_PROMPT_DATA;
            try {
                this.apiWrapper.doAPIRequest(request, (responseBody, response) => {
                    let body: GetPromptDataResponseBody = null;
                    try {
                        body = JSON.parse(responseBody);
                    } catch (error) {
                        this.logger.logError("Error while parsing get prompt data response body: " + error.message);
                    }
                    const associatedData = body?.associatedData;
                    const otherUser = response.uriResources?.[0];
                    this.logger.logInfo("Prompt data responseBody : " + responseBody);
                    resolve({ associatedData, otherUser });
                }, (error) => {
                    this.logger.logError("Failed to get prompt data : " + makeNetworkErrorMessage(error.bodyText, error.statusCode));
                    resolve({ associatedData: null, otherUser: null });
                });
            } catch (e) {
                this.logger.logError("Error : " + e.message);
            }
        });
    }

    private createSetPromptDataRequestBody(associatedData: string, tappables: TappableAreaConfig[], score: number | null, isComplete: boolean): string {
        try {
            const bodyData: SetPromptDataRequestBody = {
                ...(score != null ? { score: score } : {}),
                associatedData,
                tappables,
                isComplete,
            };
            return JSON.stringify(bodyData);
        } catch (error) {
            this.logger.logError("Error while serializing prompt data request body : " + error.message);
            return JSON.stringify({});
        }
    }
}
