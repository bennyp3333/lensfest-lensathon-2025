import { makeNetworkErrorMessage, RemoteServiceError } from "./RemoteAPIError";

export class RemoteAPIWrapper {
    constructor(private readonly remoteServiceModule: RemoteServiceModule) {
    }

    doAPIRequest(request: RemoteApiRequest,
        onComplete: (responseBody: string, response: RemoteApiResponse) => void,
        onError: (error: RemoteServiceError) => void): void {
        this.remoteServiceModule.performApiRequest(request,
            (resp) => {
                if (resp.statusCode == 1) {
                    if (onComplete) {
                        onComplete(resp.body, resp);
                    }
                } else {
                    const error = RemoteServiceError.createFromResponse(resp, "Error calling " + request.endpoint + ":");
                    if (onError) {
                        onError(error);
                    } else {
                        print(makeNetworkErrorMessage(error.bodyText, error.statusCode));
                    }
                }
            });
    }
}
