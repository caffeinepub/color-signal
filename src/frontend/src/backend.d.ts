import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface HistoryItem {
    result: string;
    timestamp: bigint;
}
export interface BigSmallPrediction {
    prediction: string;
    explanation: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    analyzeBias(history: Array<HistoryItem>): Promise<[bigint, bigint]>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHistory(): Promise<Array<HistoryItem>>;
    getPrediction(history: Array<HistoryItem>): Promise<BigSmallPrediction>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    historicalPatternAnalysis(history: Array<HistoryItem>): Promise<Array<Array<string>>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveHistoryEntry(newEntry: HistoryItem): Promise<void>;
    switchTrendAnalysis(history: Array<HistoryItem>): Promise<[boolean, bigint]>;
    updatePredictionFeedback(feedback: Array<boolean>): Promise<void>;
    updateTimeWindow(timeWindow: bigint): Promise<void>;
    uploadHistoricalPatterns(patterns: Array<Array<string>>): Promise<void>;
}
