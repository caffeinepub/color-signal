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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getHistory(): Promise<Array<HistoryItem>>;
    getPredictionBias(history: Array<HistoryItem>): Promise<bigint>;
    getTimeWindowStats(history: Array<HistoryItem>, window: bigint, target: string): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    predictNext(history: Array<HistoryItem>): Promise<BigSmallPrediction>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveHistoryEntry(newEntry: HistoryItem): Promise<void>;
}
