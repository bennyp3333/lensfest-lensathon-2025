const LAUNCH_DATA_LENS_STATE_KEY = "prompt_lens_state";
const LAUNCH_DATA_TAPPED_KEY = "tapped_key";

export enum LaunchStates {
    PromptReply = "PROMPT_REPLY",
    Default = "DEFAULT",
}

export class LaunchParamsController {

    getLaunchState(): LaunchStates {
        const launchState = global.launchParams.getString(LAUNCH_DATA_LENS_STATE_KEY) as LaunchStates;
        return launchState || LaunchStates.Default;
    }

    getTappedKey(): string {
        const tappedKey = global.launchParams.getString(LAUNCH_DATA_TAPPED_KEY);
        return tappedKey || "";
    }
}
