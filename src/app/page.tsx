 "use client";


import React, { useEffect, useState } from "react";

import { DoorStatus, DoorLogEntry, DoorMode } from "@/lib/doorTypes";

import DoorStatusCard from "@/components/DoorStatusCard";

import DoorControls from "@/components/DoorControls";

import VentControls from "@/components/VentControls";

import LogsPanel from "@/components/LogsPanel";


// *** เปลี่ยนมา Import subscribe functions แทน fetch functions ***

import {

  subscribeToDoorStatus, // สำหรับรับสถานะประตูแบบเรียลไทม์

  subscribeToLogs,       // สำหรับรับ logs แบบเรียลไทม์

  lockDoor,

  unlockDoor,

  setMode,

  refreshStatusFromHardware,

  setVentAuto,

  setVentOn,

  setTempThreshold,

} from "@/lib/doorService";


const appStyle: React.CSSProperties = {

  minHeight: "100vh",

  padding: 24,

  fontFamily:

    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  background: "#f3f4f6",

};


const layoutStyle: React.CSSProperties = {

  maxWidth: 960,

  margin: "0 auto",

};


const gridStyle: React.CSSProperties = {

  display: "grid",

  gridTemplateColumns: "2fr 1fr",

  gap: 16,

};


export default function Page() {

  const [status, setStatus] = useState<DoorStatus | null>(null);

  const [logs, setLogs] = useState<DoorLogEntry[]>([]);

  const [loadingStatus, setLoadingStatus] = useState(true);

  const [loadingLogs, setLoadingLogs] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);


  useEffect(() => {

    let unsubscribeStatus: (() => void) | undefined;

    let unsubscribeLogs: (() => void) | undefined;


    // --- Subscriber for Door Status ---

    unsubscribeStatus = subscribeToDoorStatus((newStatus, err) => {

      if (err) {

        console.error("Page Component: Error subscribing to Door Status:", err.message); // เพิ่ม console.error

        setError(err.message);

        setStatus(null);

      } else {

        console.log("Page Component: Received New Door Status:", newStatus); // เพิ่ม console.log ที่นี่

        setStatus(newStatus);

        setLoadingStatus(false); // เมื่อได้รับข้อมูลครั้งแรก ให้ตั้งค่า loading เป็น false

        setError(null); // ล้าง error ถ้ามี

      }

    });


    // --- Subscriber for Logs ---

    unsubscribeLogs = subscribeToLogs((newLogs, err) => {

      if (err) {

        console.error("Page Component: Error subscribing to Logs:", err.message); // เพิ่ม console.error

        setLogs([]);

      } else {

        console.log("Page Component: Received New Logs:", newLogs); // เพิ่ม console.log ที่นี่

        setLogs(newLogs);

        setLoadingLogs(false); // เมื่อได้รับข้อมูลครั้งแรก ให้ตั้งค่า loading เป็น false

        setError(null); // ล้าง error ถ้ามี

      }

    });


    // Cleanup function: จะถูกเรียกเมื่อ Component ถูก Unmount

    return () => {

      if (unsubscribeStatus) {

        unsubscribeStatus();

        console.log("Page Component: Unsubscribed from Door Status updates.");

      }

      if (unsubscribeLogs) {

        unsubscribeLogs();

        console.log("Page Component: Unsubscribed from Logs updates.");

      }

    };

  }, []); // [] หมายถึง Effect นี้จะรันแค่ครั้งเดียวเมื่อ Component Mount


  const handleRefresh = async () => {

    setBusy(true);

    setError(null);

    try {

      console.log("Page Component: Sending refreshStatusFromHardware command...");

      await refreshStatusFromHardware();

    } catch (e: any) {

      console.error("Page Component: Error in handleRefresh:", e);

      setError(e?.message ?? "Failed to refresh status");

    } finally {

      setBusy(false);

    }

  };


  const handleLock = async () => {

    setBusy(true);

    setError(null);

    try {

      console.log("Page Component: Sending lockDoor command...");

      await lockDoor();

    } catch (e: any) {

      console.error("Page Component: Error in handleLock:", e);

      setError(e?.message ?? "Failed to lock door");

    } finally {

      setBusy(false);

    }

  };


  const handleUnlock = async () => {

    setBusy(true);

    setError(null);

    try {

      console.log("Page Component: Sending unlockDoor command...");

      await unlockDoor();

    } catch (e: any) {

      console.error("Page Component: Error in handleUnlock:", e);

      setError(e?.message ?? "Failed to unlock door");

    } finally {

      setBusy(false);

    }

  };


  const handleSetMode = async (mode: DoorMode) => {

    setBusy(true);

    setError(null);

    try {

      console.log(`Page Component: Sending setMode command: ${mode}...`);

      await setMode(mode);

    } catch (e: any) {

      console.error("Page Component: Error in handleSetMode:", e);

      setError(e?.message ?? "Failed to set mode");

    } finally {

      setBusy(false);

    }

  };


  const handleSetAuto = async (auto: boolean) => {

    setBusy(true);

    setError(null);

    try {

      console.log(`Page Component: Sending setVentAuto command: ${auto}...`);

      await setVentAuto(auto);

    } catch (e: any) {

      console.error("Page Component: Error in handleSetAuto:", e);

      setError(e?.message ?? "Failed to set vent mode");

    } finally {

      setBusy(false);

    }

  };


  const handleSetVentOn = async (on: boolean) => {

    setBusy(true);

    setError(null);

    try {

      console.log(`Page Component: Sending setVentOn command: ${on}...`);

      await setVentOn(on);

    } catch (e: any) {

      setError(e?.message ?? "Failed to switch vent");

    } finally {

      setBusy(false);

    }

  };


  const handleSetThreshold = async (temp: number) => {

    setBusy(true);

    setError(null);

    try {

      console.log(`Page Component: Sending setTempThreshold command: ${temp}...`);

      await setTempThreshold(temp);

    } catch (e: any) {

      console.error("Page Component: Error in handleSetThreshold:", e);

      setError(e?.message ?? "Failed to set threshold");

    } finally {

      setBusy(false);

    }

  };


  return (

    <div style={appStyle}>

      <div style={layoutStyle}>

        <header style={{ marginBottom: 24 }}>

          <h1

            style={{

              fontSize: 24,

              fontWeight: 700,

              marginBottom: 4,

            }}

          >

            DoorDash – Smart Door Dashboard

          </h1>

          <p style={{ color: "#4b5563", fontSize: 14 }}>

            Connected to Firebase Realtime Database.

          </p>

        </header>


        {error && (

          <div

            style={{

              marginBottom: 16,

              padding: 12,

              borderRadius: 8,

              background: "#fee2e2",

              color: "#991b1b",

              fontSize: 14,

            }}

          >

            {error}

          </div>

        )}


        <div style={gridStyle}>

          <div>

            <DoorStatusCard status={status} loading={loadingStatus} />

            <DoorControls

              status={status}

              busy={busy}

              onLock={handleLock}

              onUnlock={handleUnlock}

              onSetMode={handleSetMode}

              onRefresh={handleRefresh}

            />

            <VentControls

              status={status}

              busy={busy}

              onSetAuto={handleSetAuto}

              onSetVentOn={handleSetVentOn}

              onSetThreshold={handleSetThreshold}

            />

          </div>

          <div>

            <LogsPanel logs={logs} loading={loadingLogs} />

          </div>

        </div>

      </div>

    </div>

  );

} 