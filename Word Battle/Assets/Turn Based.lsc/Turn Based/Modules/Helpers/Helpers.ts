import { UserDefinedGameVariableInput, UserDefinedGameVariablesMap } from "../../Turn Based";

export function enable(so: SceneObject): void {
    if (!isNull(so)) {
        so.enabled = true;
    }
}

export function disable(so: SceneObject): void {
    if (!isNull(so)) {
        so.enabled = false;
    }
}

export function getUserDefinedGameVariablesMapFromInputs(inputs: UserDefinedGameVariableInput[]): UserDefinedGameVariablesMap {
    const getValue = (input: UserDefinedGameVariableInput) => {
        switch (input.type) {
            case "string":
                return input.valueString;
            case "float":
                return input.valueFloat;
            case "boolean":
                return input.valueBoolean;
        }
    };
    const map: UserDefinedGameVariablesMap = {};
    inputs.forEach((input) => map[input.key] = getValue(input));
    return map;
}

export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${value}`);
}
