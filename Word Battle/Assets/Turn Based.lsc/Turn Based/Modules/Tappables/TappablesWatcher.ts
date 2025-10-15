import { Watcher } from "../Helpers/Watcher";
import { Logger } from "../Helpers/Logger";
import { TappableAreaInput } from "../../Turn Based";

const CHECK_POINTS: vec2[] = [new vec2(-1.0, -1.0), new vec2(1.0, 1.0)];

export class TappablesWatcher extends Watcher<string> {

    constructor(logger: Logger, getter: () => TappableAreaInput[]) {
        super(() => {
            return getter()
                .map((area) => {
                    try {
                        return [
                            area.key,
                            area.screenTransform.localPointToScreenPoint(CHECK_POINTS[0]),
                            area.screenTransform.localPointToScreenPoint(CHECK_POINTS[1]),
                        ].toString();
                    } catch (error) {
                        logger.logError("Error while calling localPointToScreenPoint of tappable screen transform : " + error.message);
                        return null;
                    }
                })
                .sort()
                .toString();
        });
    }
}
