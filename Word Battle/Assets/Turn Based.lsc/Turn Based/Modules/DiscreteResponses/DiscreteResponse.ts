import { ComponentApiResponseConfig, DiscreteComponentApiResponse } from "./ComponentApiResponse";
import { BehaviorResponse, BehaviorResponseConfig } from "./BehaviorResponse";
import { ComponentContext } from "../ComponentContext";
import { assertNever } from "../Helpers/Helpers";

export interface DiscreteResponse {
    trigger(data?: any): void;
}

export namespace DiscreteResponse {
    export function createFromConfig(config: DiscreteResponseConfig, context: ComponentContext): DiscreteResponse | null {
        switch (config.responseType) {
            case DiscreteResponseType.ComponentApi:
                return DiscreteComponentApiResponse.createFromConfig(config.componentApiResponseConfig, context);
            case DiscreteResponseType.Behavior:
                return BehaviorResponse.createFromConfig(config.behaviorResponseConfig, context);
            default:
                assertNever(config.responseType);
        }
    }
}

@typedef
export class DiscreteResponseConfig {
    @input("int")
    @widget(new ComboBoxWidget(["Component API Call", "Behavior"]
        .map((v, i) => new ComboBoxItem(v, i))))
    readonly responseType!: DiscreteResponseType;

    @input
    @showIf("responseType", 0)
    readonly componentApiResponseConfig!: ComponentApiResponseConfig;

    @input
    @showIf("responseType", 1)
    @label("Behavior Custom Component integration.")
    readonly behaviorResponseConfig!: BehaviorResponseConfig;
}

enum DiscreteResponseType {
    ComponentApi,
    Behavior,
}
