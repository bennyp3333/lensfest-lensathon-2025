import { disable, enable } from "../Helpers/Helpers";

export class SceneObjectsController {

    private areUser1FlowObjectsEnabled: boolean = false;

    private areUser2FlowObjectsEnabled: boolean = false;

    private areGameOverObjectsEnabled: boolean = false;

    constructor(private _user1FlowObjectsSO: SceneObject[],
        private _user2FlowObjectsSO: SceneObject[],
        private _gameOverObjectsSO: SceneObject[]) {
        this.onStateUpdated();
    }

    initialize(index: number): void {
        this.areUser1FlowObjectsEnabled = index === 0;
        this.areUser2FlowObjectsEnabled = !this.areUser1FlowObjectsEnabled;
        this.areGameOverObjectsEnabled = false;
        this.onStateUpdated();
    }

    onGameOver(): void {
        this.areGameOverObjectsEnabled = true;
        this.onStateUpdated();
    }

    get user1FlowObjects(): SceneObject[] {
        return this._user1FlowObjectsSO;
    }

    set user1FlowObjects(objects: SceneObject[]) {
        this._user1FlowObjectsSO = objects;
        this.onStateUpdated();
    }

    get user2FlowObjects(): SceneObject[] {
        return this._user2FlowObjectsSO;
    }

    set user2FlowObjects(objects: SceneObject[]) {
        this._user2FlowObjectsSO = objects;
        this.onStateUpdated();
    }

    get gameOverObjects(): SceneObject[] {
        return this._gameOverObjectsSO;
    }

    set gameOverObjects(objects: SceneObject[]) {
        this._gameOverObjectsSO = objects;
        this.onStateUpdated();
    }

    private onStateUpdated(): void {
        this._user1FlowObjectsSO.forEach(this.areUser1FlowObjectsEnabled ? enable : disable);
        this._user2FlowObjectsSO.forEach(this.areUser2FlowObjectsEnabled ? enable : disable);
        this._gameOverObjectsSO.forEach(this.areGameOverObjectsEnabled ? enable : disable);
    }
}
