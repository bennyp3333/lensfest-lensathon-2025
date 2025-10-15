import { Logger } from "../Helpers/Logger";

export class OtherUserController {

    private readonly otherUserPromise: Promise<SnapchatUser | null>;

    private resolveOtherUser: (user: SnapchatUser | null) => void = () => {};

    constructor(private readonly logger: Logger) {
        this.otherUserPromise = new Promise((resolve) => this.resolveOtherUser = resolve);
    }

    setOtherUser(uriResource: DynamicResource): void {
        if (uriResource) {
            this.loadUserFromUriResource(uriResource, (user) => {
                this.logger.logInfo("Other user loaded successfully");
                this.resolveOtherUser(user);
            }, (error) => {
                this.logger.logError("Error while loading other user: " + error);
                this.resolveOtherUser(null);
            });
        } else {
            this.logger.logInfo("No other user resource provided.");
            this.resolveOtherUser(null);
        }
    }

    getOtherUser(): Promise<SnapchatUser> {
        return new Promise((resolve, reject) =>
            this.otherUserPromise.then((user) => !!user
                ? resolve(user)
                : reject(new Error("Could not get other user."))));
    }

    async getDisplayName(): Promise<string> {
        const user = await this.otherUserPromise;
        return user && user.displayName ? user.displayName : "";
    }

    private loadUserFromUriResource(uriResource: DynamicResource,
        onSuccess: (user: SnapchatUser) => void,
        onError: (error: string) => void): void {
        global.userContextSystem.loadResourceAsSnapchatUser(uriResource,
            (user: SnapchatUser) => onSuccess(user),
            (error: string) => onError(error));
    }
}
