import { DebugViewPrefab } from "./DebugViewPrefab";

@component
export class DebugView extends BaseScriptComponent {
    @input
    private readonly debugViewPrefab: ObjectPrefab;

    @input
    private readonly renderTarget: Texture;

    private viewInstance: DebugViewPrefab;

    setTrackedData(data: string) {
        this.viewInstance.liveDataText.text = data;
    }

    toggleVisibility() {
        const container = this.viewInstance.contentContainer;
        container.enabled = !container.enabled;
    }

    protected onAwake() {
        this.viewInstance = this.debugViewPrefab.instantiate(this.getSceneObject()).getComponent(DebugViewPrefab.getTypeName());

        for (const child of flatSubtree(this.viewInstance.getSceneObject())) {
            child.layer = this.getSceneObject().layer;
        }

        this.createEvent("TouchStartEvent").bind(ev => {
            const screenPos = ev.getTouchPosition();
            if (this.viewInstance.toggleButton.containsScreenPoint(screenPos)) {
                this.toggleVisibility();
            }
        });

        this.toggleVisibility();
    }

    private bindCamera(camera: Camera) {
        camera.renderTarget = this.renderTarget;
        const control = this.renderTarget.control as RenderTargetProvider;

        if (global.scene.liveOverlayTarget) {
            control.clearColorOption = ClearColorOption.CustomTexture;
            control.inputTexture = global.scene.liveOverlayTarget;
        } else {
            control.clearColorOption = ClearColorOption.Background;
        }
        global.scene.liveOverlayTarget = this.renderTarget;
    }

    private static _instance: DebugView | null = null;

    static getInstance(): DebugView {
        if (DebugView._instance) {
            return DebugView._instance;
        }
        const layerSet = LayerSet.makeUnique();
        const cameraObject = global.scene.createSceneObject("DebugViewCamera");
        cameraObject.layer = layerSet;
        const camera = cameraObject.createComponent("Camera");
        camera.type = Camera.Type.Orthographic;
        camera.renderLayer = layerSet;
        camera.renderOrder = 1337;
        camera.near = -1;
        camera.far = 200;

        DebugView._instance = cameraObject.createComponent(DebugView.getTypeName());
        DebugView._instance.bindCamera(camera);
        return DebugView._instance;
    }
}

function* flatSubtree(root: SceneObject) {
    yield root;
    for (const child of root.children) {
        yield* flatSubtree(child);
    }
}
