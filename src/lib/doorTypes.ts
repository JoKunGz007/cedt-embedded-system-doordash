// lib/doorTypes.ts

export type DoorMode = "password" | "free";

export interface DoorStatus {
  doorOpen: boolean;
  locked: boolean;
  mode: DoorMode;
  temperature: number;
  ventOn: boolean;
  ventAuto: boolean;
  tempThreshold: number;
  lastUpdated: string; // ISO string
}

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface DoorLogEntry {
  id: string;
  timestamp: string; // ISO string
  level: LogLevel;
  message: string;
  details?: string;
}
