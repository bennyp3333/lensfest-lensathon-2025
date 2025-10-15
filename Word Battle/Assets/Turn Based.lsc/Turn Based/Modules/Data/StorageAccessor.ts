export class StorageAccessor {
    wasDataChanged: boolean = false;

    constructor(
        private readonly variablesPromise: Promise<UserDefinedGameVariablesMap>,
    ) {}

    async getVariable(key: string): Promise<UserDefinedGameVariable | undefined> {
        return (await this.variablesPromise)[key];
    }

    async setVariable(key: string, value: UserDefinedGameVariable): Promise<void> {
        const variables = await this.variablesPromise;

        if (typeof value === "object") {
            this.wasDataChanged = true;
        } else if (value !== (await this.variablesPromise)[key]) {
            this.wasDataChanged = true;
        }

        variables[key] = value;
    }

    async getAllVariables(): Promise<UserDefinedGameVariablesMap> {
        return await this.variablesPromise;
    }

    async clearAllVariables(): Promise<void> {
        const variables = await this.variablesPromise;
        
        if (Object.keys(variables).length > 0) {
            this.wasDataChanged = true;
        }

        for (const key in variables) {
            delete variables[key];
        }
    }
}
