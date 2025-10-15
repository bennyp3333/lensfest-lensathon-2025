import { ComponentContext } from "../ComponentContext";
import { DiscreteResponse } from "./DiscreteResponse";
import { assertNever } from "../Helpers/Helpers";

export class BehaviorResponse implements DiscreteResponse {
    constructor(readonly trigger: () => void, _context: ComponentContext) {}

    static createFromConfig(
        config: BehaviorResponseConfig,
        context: ComponentContext,
    ): BehaviorResponse | null {
        const triggerFunction = function fetchTriggerFunction() {

            switch (config.behaviorResponseType) {
                case BehaviorResponseType.GlobalCustomTrigger:
                    // If the behavior system is not available, then there are no behavior scripts listening for this trigger.
                    // Therefore, we don't need to print warning statements. Doing nothing is an expected behavior.
                    return () => global["behaviorSystem"]?.sendCustomTrigger(config.customTriggerName);

                case BehaviorResponseType.ManualTrigger:
                    if (!config.behaviorScript) {
                        context.logger.logWarning("Behavior script is not provided for manual trigger.");
                        return null;
                    }
                    return () => {
                        const triggerMethod = config.behaviorScript.trigger;
                        if (typeof triggerMethod === "function") {
                            triggerMethod();
                        } else {
                            context.logger.logWarning("Behavior script does not have a trigger method. Skipping execution.");
                        }
                    };

                default:
                    assertNever(config.behaviorResponseType);
            }
        }();

        if (!triggerFunction) {
            return null;
        }

        return new BehaviorResponse(triggerFunction, context);
    }
}

@typedef
export class BehaviorResponseConfig {
    @ui.label("For more information, see <a href='https://developers.snap.com/lens-studio/lens-studio-workflow/adding-interactivity/behavior'>Behavior&nbsp;Documentation.</a>")

    @input("int")
    @label("Behavior trigger type")
    @widget(new ComboBoxWidget(["Global CustomTrigger", "Manual Trigger"].map((v, i) => new ComboBoxItem(v, i))))
    readonly behaviorResponseType: BehaviorResponseType = 0;

    @input
    @showIf("behaviorResponseType", 0)
    readonly customTriggerName: string = "";

    @input("Component.ScriptComponent")
    @showIf("behaviorResponseType", 1)
    readonly behaviorScript: BaseScriptComponent & { trigger: () => void };
}

enum BehaviorResponseType {
    GlobalCustomTrigger,
    ManualTrigger,
}
