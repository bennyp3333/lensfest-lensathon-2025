import { Logger } from "./Helpers/Logger";

export class ComponentContext {
    constructor(
        readonly hostingObject: SceneObject,
        readonly hostingScript: BaseScriptComponent,
        readonly logger: Logger,
    ) {}

}
