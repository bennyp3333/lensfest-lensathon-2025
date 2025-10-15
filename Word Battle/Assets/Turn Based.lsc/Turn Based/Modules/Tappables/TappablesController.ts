import { TappableAreaInput } from "../../Turn Based";
import { Logger } from "../Helpers/Logger";
import { TappableAreaConfig } from "../RemoteAPI/ApiController";
import { TappablesWatcher } from "./TappablesWatcher";
import { TappablesValidator } from "./TappablesValidator";

export class TappablesController {

    private readonly tappablesValidator: TappablesValidator;

    private isGameOver: boolean = false;

    private readonly watcher: TappablesWatcher;

    constructor(private readonly logger: Logger, private tappableAreas: TappableAreaInput[]) {
        this.tappablesValidator = new TappablesValidator(this.logger);
        this.watcher = new TappablesWatcher(this.logger, () => this.getTappableAreasInputToSubmit());
    }

    wasModified(): boolean {
        return this.watcher.update();
    }

    setIsGameOver(isGameOver: boolean): void {
        this.isGameOver = isGameOver;
    }

    getTappableAreasInput(): TappableAreaInput[] {
        return this.tappableAreas;
    }

    setTappableAreasInput(tappableAreas: TappableAreaInput[]): void {
        this.tappableAreas = tappableAreas;
    }

    addTappableArea(key: string, st: ScreenTransform): void {
        const index = this.tappableAreas.findIndex((tappableArea) => !!tappableArea && tappableArea.key === key);
        if (index >= 0) {
            this.logger.logWarning("Warning: tappable area with key \"" + key + "\" already exists! Overriding tappable area");
            this.tappableAreas[index].screenTransform = st;
        } else {
            const tappableArea = new TappableAreaInput();
            tappableArea.key = key;
            tappableArea.screenTransform = st;
            this.tappableAreas.push(tappableArea);
        }
    }

    removeTappableArea(key: string): void {
        const index = this.tappableAreas.findIndex((tappableArea) => !!tappableArea && tappableArea.key === key);
        if (index >= 0) {
            this.tappableAreas.splice(index, 1);
        }
    }

    clearTappableAreas(): void {
        this.tappableAreas.splice(0, this.tappableAreas.length);
    }

    getTappableAreaConfig(): TappableAreaConfig[] {
        const tappableAreas = this.tappablesValidator.validateTappablesCount(this.getTappableAreasInputToSubmit());
        return this.tappablesValidator.validateTotalCoverage(tappableAreas
            .map((area) => this.getTappableConfigForScreenTransform(area.screenTransform, area.key))
            .filter((val) => !!val)
            .filter((area) => this.tappablesValidator.validateTappableConfig(area)));
    }

    private getTappableAreasInputToSubmit(): TappableAreaInput[] {
        if (this.isGameOver) {
            return [];
        } else {
            return this.tappableAreas.filter((area) => !isNull(area.screenTransform)
                && area.screenTransform.enabled
                && area.screenTransform.getSceneObject().enabled
                && area.screenTransform.getSceneObject().isEnabledInHierarchy);
        }
    }

    private getTappableConfigForScreenTransform(st: ScreenTransform, key: string = ""): TappableAreaConfig {
        if (!st) {
            return { key };
        }
        // Get screen pos
        let screenPos: vec2;
        try {
            screenPos = st.localPointToScreenPoint(vec2.zero());
        } catch (e) {
            this.logger.logError("Error while calling localPointToScreenPoint of tappable screen transform : " + e.message);
            return null;
        }

        // Get rotation angle
        const tr = st.getTransform();
        const up = tr.right;
        const angle = -Math.atan2(up.y, up.x);
        const angleInDegrees = Math.round(MathUtils.RadToDeg * angle);

        // Get relative width and height
        const originalRotation = tr.getWorldRotation();
        tr.setWorldRotation(quat.quatIdentity());

        let p1: vec2, p2: vec2;
        try {
            p1 = st.localPointToScreenPoint(new vec2(-1, 1));
            p2 = st.localPointToScreenPoint(new vec2(1, -1));
        } catch (e) {
            this.logger.logError("Error while calling localPointToScreenPoint of tappable screen transform : " + e.message);
            return null;
        }

        const size = p2.sub(p1);

        tr.setWorldRotation(originalRotation);

        return {
            key: key,
            rotationDegrees: angleInDegrees,
            normalizedX: screenPos.x,
            normalizedY: screenPos.y,
            normalizedWidth: size.x,
            normalizedHeight: size.y,
        };
    }
}
