@component
export class DebugViewPrefab extends BaseScriptComponent {
    @input
    readonly liveDataText: Text;

    @input
    readonly toggleButton: ScreenTransform;

    @input
    readonly contentContainer: SceneObject;
}
