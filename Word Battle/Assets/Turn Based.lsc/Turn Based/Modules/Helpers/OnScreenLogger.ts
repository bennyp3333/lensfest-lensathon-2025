export class OnScreenLogger {
    private readonly camera: Camera;
    private readonly text: Text;

    protected constructor() {
        const layerSet = LayerSet.makeUnique();
        const cameraObject = global.scene.createSceneObject("OnScreenLoggerCamera");
        cameraObject.layer = layerSet;
        this.camera = cameraObject.createComponent("Camera");
        this.camera.type = Camera.Type.Orthographic;
        this.camera.renderLayer = layerSet;
        this.updateRenderTarget();

        const textObject = global.scene.createSceneObject("OnScreenLoggerText");
        textObject.setParent(cameraObject);
        textObject.layer = layerSet;
        this.text = textObject.createComponent("Text");
        this.text.horizontalAlignment = HorizontalAlignment.Left;
        this.text.verticalAlignment = VerticalAlignment.Bottom;
        this.text.horizontalOverflow = HorizontalOverflow.Wrap;
        this.fontSize = 12;
        this.text.lineSpacing = 1.2;

        textObject.createComponent("ScreenTransform");
        const region = textObject.createComponent("ScreenRegionComponent");
        region.region = ScreenRegionType.SafeRender;
    }

    set fontSize(fontSize: number) {
        this.text.size = fontSize;
    }

    updateRenderTarget() {
        this.camera.renderTarget = global.scene.liveTarget;
        this.camera.renderOrder = 1337;
    }

    log(message: string): void {
        const maxSymbols = 1000;
        this.text.text = (this.text.text + "\n" + message).substring(-maxSymbols);
    }

    private static _instance: OnScreenLogger | null = null;

    static getInstance(): OnScreenLogger {
        return OnScreenLogger._instance ??= new OnScreenLogger();
    }
}
