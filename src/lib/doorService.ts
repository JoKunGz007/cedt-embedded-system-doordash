// lib/doorService.ts
import { DoorStatus, DoorLogEntry, LogLevel, DoorMode } from "./doorTypes";

let currentPassword = "1234";

let doorState: DoorStatus = {
  doorOpen: false,
  locked: true,
  mode: "password",
  temperature: 27.5,
  ventOn: false,
  ventAuto: true,
  tempThreshold: 28,
  lastUpdated: new Date().toISOString(),
};

let logs: DoorLogEntry[] = [];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addLog(message: string, level: LogLevel = "INFO", details?: string) {
  const entry: DoorLogEntry = {
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  logs = [entry, ...logs].slice(0, 50); // keep last 50
}

function updateTimestamp() {
  doorState = {
    ...doorState,
    lastUpdated: new Date().toISOString(),
  };
}

function maybeAutoVent() {
  if (doorState.ventAuto) {
    const shouldVent = doorState.temperature >= doorState.tempThreshold;
    doorState = { ...doorState, ventOn: shouldVent };
  }
}

// -------- Public API (called from React components) --------

export async function fetchDoorStatus(): Promise<DoorStatus> {
  await delay(250);
  return { ...doorState };
}

export async function fetchLogs(): Promise<DoorLogEntry[]> {
  await delay(200);
  return [...logs];
}

export async function refreshStatusFromHardware(): Promise<DoorStatus> {
  await delay(300);

  // Simulate some temperature drift
  const drift = (Math.random() - 0.5) * 0.4;
  doorState = {
    ...doorState,
    temperature: Math.round((doorState.temperature + drift) * 10) / 10,
  };
  maybeAutoVent();
  updateTimestamp();
  addLog("Polled door status from hardware.");
  return { ...doorState };
}

export async function lockDoor(): Promise<DoorStatus> {
  await delay(400);
  doorState = { ...doorState, locked: true };
  updateTimestamp();
  addLog("Door locked by DoorDash.");
  return { ...doorState };
}

export async function unlockDoor(): Promise<DoorStatus> {
  await delay(400);
  doorState = { ...doorState, locked: false };
  updateTimestamp();
  addLog("Door unlocked by DoorDash.");
  return { ...doorState };
}

export async function unlockDoorWithPassword(password: string): Promise<DoorStatus> {
  await delay(500);
  if (doorState.mode === "password" && password !== currentPassword) {
    addLog("Failed unlock attempt (wrong password).", "WARN");
    throw new Error("Incorrect password");
  }
  doorState = { ...doorState, locked: false };
  updateTimestamp();
  addLog("Door unlocked (password).");
  return { ...doorState };
}

export async function setMode(mode: DoorMode): Promise<DoorStatus> {
  await delay(300);
  doorState = { ...doorState, mode };
  updateTimestamp();
  addLog(`Door mode set to ${mode}.`);
  return { ...doorState };
}

export async function setVentAuto(auto: boolean): Promise<DoorStatus> {
  await delay(300);
  doorState = { ...doorState, ventAuto: auto };
  maybeAutoVent();
  updateTimestamp();
  addLog(`Vent mode set to ${auto ? "auto" : "manual"}.`);
  return { ...doorState };
}

export async function setVentOn(on: boolean): Promise<DoorStatus> {
  await delay(300);
  doorState = { ...doorState, ventOn: on };
  updateTimestamp();
  addLog(`Vent turned ${on ? "ON" : "OFF"} (manual).`);
  return { ...doorState };
}

export async function setTempThreshold(temp: number): Promise<DoorStatus> {
  await delay(300);
  doorState = { ...doorState, tempThreshold: temp };
  maybeAutoVent();
  updateTimestamp();
  addLog(`Temperature threshold set to ${temp}°C.`);
  return { ...doorState };
}

export async function ringBell(): Promise<void> {
  await delay(200);
  addLog("Doorbell pressed (simulated).");
}

export async function updatePassword(current: string, next: string): Promise<void> {
  await delay(400);
  if (current !== currentPassword) {
    addLog("Password change failed (wrong current password).", "WARN");
    throw new Error("Current password is incorrect");
  }
  currentPassword = next;
  addLog("Password changed successfully.");
}
