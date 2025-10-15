export class CurrentUserController {

    constructor() {}

    getDisplayName(): Promise<string> {
        return new Promise((resolve) => global.userContextSystem.requestDisplayName(resolve));
    }

    getCurrentUser(): Promise<SnapchatUser> {
        return Promise.resolve(null);
    }
}
