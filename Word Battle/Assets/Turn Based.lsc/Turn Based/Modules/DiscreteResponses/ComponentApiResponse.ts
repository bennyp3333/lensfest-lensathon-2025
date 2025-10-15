import { ComponentContext } from "../ComponentContext";
import { DiscreteResponse } from "./DiscreteResponse";

export class DiscreteComponentApiResponse implements DiscreteResponse {
    constructor(private config: ComponentApiResponseConfig, private context: ComponentContext) {}

    trigger(data?: any): void {
        const method = (this.config.component as any)[this.config.methodName];
        if (typeof method === "function") {
            method.call(this.config.component, data);
        } else {
            this.context.logger.logWarning(`ComponentApiResponse: Method '${this.config.methodName}' not found on component.`);
        }
    }

    static createFromConfig(config: ComponentApiResponseConfig, context: ComponentContext): DiscreteComponentApiResponse | null {
        if (!ComponentApiResponseConfig.validate(config, context)) {
            return null;
        }
        return new DiscreteComponentApiResponse(config, context);
    }
}

@typedef
export class ComponentApiResponseConfig {
    @ui.label("This response calls a specified method on a script component.")
    @input("Component.ScriptComponent")
    readonly component: BaseScriptComponent;

    @input("string")
    @label("Method Name")
    readonly methodName: string = "";
}

export namespace ComponentApiResponseConfig {
    export function validate(config: ComponentApiResponseConfig, context: ComponentContext): boolean {
        if (!config.component) {
            context.logger.logWarning("ComponentApiResponse: No component provided in config.");
            return false;
        }
        if (!config.methodName) {
            context.logger.logWarning("ComponentApiResponse: No method name provided in config.");
            return false;
        }
        return true;
    }
}
