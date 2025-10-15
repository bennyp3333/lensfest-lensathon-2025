import { Logger } from "../Helpers/Logger";
import { TappableAreaConfig } from "../RemoteAPI/ApiController";
import { TappableAreaInput } from "../../Turn Based";

/**
 * Since any custom 2D design is allowed as a Q&A text prompt, there is a limit to the tappable region
 * on the screen to ensure the prompt does not cover the entire screen.
 */
export class TappablesValidator {

    static readonly KEY_LENGTH_LIMIT: number = 24;
    private static readonly MAX_NUM_TAPPABLES: number = 16;
    private static readonly MAX_TOTAL_TAPPABLE_AREA: number = 0.4;

    private static readonly CENTER_BOUNDS: { min: number, max: number } = { min: 0.05, max: 0.95 };
    private static readonly MAX_AREA: number = 0.4;
    private static readonly MIN_ASPECT_RATIO: number = 0.125;

    constructor(private readonly logger: Logger) {}

    validateTappablesCount(tappableAreas: TappableAreaInput[]): TappableAreaInput[] {
        if (tappableAreas.length > TappablesValidator.MAX_NUM_TAPPABLES) {
            this.logger.logWarning("Too many tappable areas. Max number : " + TappablesValidator.MAX_NUM_TAPPABLES + ". Skipping excess areas");
            return tappableAreas.slice(0, TappablesValidator.MAX_NUM_TAPPABLES);
        } else {
            return tappableAreas;
        }
    }

    validateTappableConfig(tappableArea: TappableAreaConfig): boolean {
        const screenX = tappableArea.normalizedX;
        const screenY = tappableArea.normalizedY;
        const errorMessagePrefix = "Tappable area with key \"" + tappableArea.key
            + "\" does not comply with the tappable area restrictions : ";
        if (screenX < TappablesValidator.CENTER_BOUNDS.min || screenX > TappablesValidator.CENTER_BOUNDS.max) {
            this.logger.logWarning(errorMessagePrefix + "x position on screen should be in range : "
                + TappablesValidator.CENTER_BOUNDS.min + " <= x <= " + TappablesValidator.CENTER_BOUNDS.max + ". Current value : " + screenX);
            return false;
        }
        if (screenY < TappablesValidator.CENTER_BOUNDS.min || screenY > TappablesValidator.CENTER_BOUNDS.max) {
            this.logger.logWarning(errorMessagePrefix + "y position on screen should be in range : "
                + TappablesValidator.CENTER_BOUNDS.min + " <= y <= " + TappablesValidator.CENTER_BOUNDS.max + ". Current value : " + screenY);
            return false;
        }
        const width = tappableArea.normalizedWidth;
        const height = tappableArea.normalizedHeight;
        const EPS = 1e-9;
        if (width < EPS || height < EPS) {
            this.logger.logWarning("Skipping area which has 0 width or height : " + tappableArea.key);
            return false;
        }
        const aspect = Math.min(width, height) / Math.max(width, height);
        if (aspect < TappablesValidator.MIN_ASPECT_RATIO) {
            this.logger.logWarning(errorMessagePrefix + "aspect ratio is lower then limit : " + TappablesValidator.MIN_ASPECT_RATIO
                + ". Current value : " + aspect);
            return false;
        }
        if (tappableArea.key.length > TappablesValidator.KEY_LENGTH_LIMIT) {
            this.logger.logWarning("Tappable area with key \"" + tappableArea.key
                + "\" does not comply with the tappable area restrictions : "
                + "key length exceeds limit : " + TappablesValidator.KEY_LENGTH_LIMIT
                + ". Current length : " + tappableArea.key.length);
            return false;
        }
        const area = width * height;
        if (area > TappablesValidator.MAX_AREA) {
            this.logger.logWarning("Tappable area with key \"" + tappableArea.key
                + "\" does not comply with the tappable area restrictions : "
                + "area exceeds limit : " + TappablesValidator.MAX_AREA
                + ". Current area : " + area);
            return false;
        }
        return true;
    }

    validateTotalCoverage(configs: TappableAreaConfig[]): TappableAreaConfig[] {
        let areaSize: number = 0.0;
        let validConfigsCount = 0;
        while (validConfigsCount < configs.length) {
            const config = configs[validConfigsCount];
            const configAreaSize = config.normalizedHeight * config.normalizedWidth;
            if ((areaSize + configAreaSize) > TappablesValidator.MAX_TOTAL_TAPPABLE_AREA) {
                this.logger.logWarning("Total screen coverage of tappables exceed limit - max " + TappablesValidator.MAX_TOTAL_TAPPABLE_AREA
                    + ". Skipping excess areas : "
                    + configs.slice(validConfigsCount)
                        .map((config) => config.key));
                break;
            }
            areaSize += configAreaSize;
            validConfigsCount++;
        }
        return configs.slice(0, validConfigsCount);
    }
}
