const INERTIA_DECELERATION = 0.01;

@component
export class ScrollView extends BaseScriptComponent {
    @input
    private readonly contentTransform: ScreenTransform;

    @input
    private readonly limitContentHeight: boolean = false;

    @input
    @showIf("limitContentHeight")
    @label("Content Height")
    @hint("Height relative to view height (1 = same as view)")
    @widget(new SliderWidget(0.1, 10.0, 0.1))
    private readonly contentHeight: number = 2.0;

    private screenTransform: ScreenTransform;

    private activeTouchId: number | null = null;
    private lastTouchPosition: vec2 | null = null;

    protected onAwake() {
        this.screenTransform = this.getSceneObject().getComponent("ScreenTransform");

        this.createEvent("UpdateEvent").bind(ev => this.onUpdate(ev.getDeltaTime()));
        this.observeTouchEvents();
    }

    private onUpdate(deltaTime: number) {

    }

    private onTouchDelta(delta: vec2) {
        const scrollAmount = this.getScreenScrollAxis().dot(delta);
        const center = this.contentTransform.anchors.getCenter();
        center.y += scrollAmount;
        if (this.limitContentHeight) {
            center.y = Math.min(center.y, Math.max(this.contentHeight - 1, 0));
        }
        center.y = Math.max(center.y, 0);

        this.contentTransform.anchors.setCenter(center);
    }

    private observeTouchEvents() {
        this.createEvent("TouchStartEvent").bind(data => {
            if (this.activeTouchId === null) {
                if (this.screenTransform.containsScreenPoint(data.getTouchPosition())) {
                    this.activeTouchId = data.getTouchId();
                    this.lastTouchPosition = data.getTouchPosition();
                }
            }
        });

        this.createEvent("TouchMoveEvent").bind(data => {
            if (this.activeTouchId === data.getTouchId() && this.lastTouchPosition) {
                const delta = data.getTouchPosition().sub(this.lastTouchPosition);
                this.lastTouchPosition = data.getTouchPosition();
                this.onTouchDelta(delta);
            }
        });

        this.createEvent("TouchEndEvent").bind(data => {
            if (this.activeTouchId === data.getTouchId()) {
                this.activeTouchId = null;
                this.lastTouchPosition = null;
            }
        });
    }

    private getScreenScrollAxis(): vec2 {
        const localToScreen = this.screenTransform.localPointToScreenPoint(vec2.up())
            .sub(this.screenTransform.localPointToScreenPoint(vec2.zero()));
        return localToScreen.normalize().uniformScale(1 / localToScreen.length);
    }
}
