import { TurnHistoryEntry, UserDefinedGameVariablesMap } from "../../Turn Based";

export interface PromptAssociatedData {
    turnCount: number;
    userDefinedGameVariables: UserDefinedGameVariablesMap;
    user0Storage: UserDefinedGameVariablesMap;
    user1Storage: UserDefinedGameVariablesMap;
    globalStorage: UserDefinedGameVariablesMap;
    turnHistory: TurnHistoryEntry[];
    isTurnComplete: boolean;
}

export interface PromptData {
    associatedData: PromptAssociatedData;
    otherUser: DynamicResource | null;
}

export interface SerializedPromptData {
    associatedData: string | null;
    otherUser: DynamicResource | null;
}
