// testCommands.ts
// Utility สำหรับทดสอบการส่งคำสั่งไปยัง Firebase Realtime Database
// คุณสามารถเรียกใช้ฟังก์ชันเหล่านี้ได้โดยตรงใน Console ของเบราว์เซอร์

import {
    lockDoor,
    unlockDoor,
    setVentAuto,
    setVentOn,
    setTempThreshold,
    setMode,
    ringBell,
} from "./doorService";

/**
 * @function testAllCommands
 * @description รันคำสั่งทั้งหมดทีละตัวเพื่อตรวจสอบว่าค่าถูกเขียนลง Firebase หรือไม่
 * (ตรวจสอบผลลัพธ์ใน Firebase Console)
 */
export async function testAllCommands(): Promise<void> {
    console.log("--- 🧪 เริ่มการทดสอบ Commands ใน Firebase ---");
    
    try {
        // 1. สั่ง Lock (ควรเห็น commands/lockCommand อัปเดตเป็น trigger: true)
        console.log("1. Sending LOCK command...");
        await lockDoor();
        console.log("   ✅ Lock command sent.");

        // 2. สั่ง Unlock (ควรเห็น commands/unlockCommand อัปเดตเป็น trigger: true)
        console.log("2. Sending UNLOCK command...");
        await unlockDoor();
        console.log("   ✅ Unlock command sent.");

        // 3. ตั้งค่าพัดลมเป็น Auto OFF (ควรเห็น commands/fanAutoMode อัปเดตเป็น enabled: false)
        console.log("3. Setting Fan Auto Mode to OFF...");
        await setVentAuto(false);
        console.log("   ✅ Fan Auto Mode set to OFF.");

        // 4. ตั้งค่าพัดลมเป็น Manual ON (ควรเห็น commands/fanManualOverride อัปเดตเป็น value: true)
        console.log("4. Setting Fan Manual Override to ON...");
        await setVentOn(true);
        console.log("   ✅ Fan Manual Override set to ON.");

        // 5. ตั้งค่าเกณฑ์อุณหภูมิ (ควรเห็น commands/tempThreshold อัปเดตเป็น value: 25)
        console.log("5. Setting Temperature Threshold to 25°C...");
        await setTempThreshold(25);
        console.log("   ✅ Temp Threshold set to 25.");

        // 6. ตั้งค่า Door Mode เป็น Fingerprint (ควรเห็น commands/doorMode อัปเดตเป็น value: "fingerprint")
        // console.log("6. Setting Door Mode to Fingerprint...");
        // await setMode("fingerprint");
        // console.log("   ✅ Door Mode set to 'fingerprint'.");

        // 7. จำลองการกดกริ่ง (ควรเห็น Log Entry ใหม่ถูก Push เข้าไปใน /logs)
        console.log("7. Sending simulated Doorbell Press (RingBell)...");
        await ringBell();
        console.log("   ✅ RingBell command sent (Check the /logs node).");

        console.log("--- 🎉 การทดสอบ Commands ทั้งหมดเสร็จสมบูรณ์ ---");
        console.log("กรุณาตรวจสอบการเปลี่ยนแปลงทั้งหมดใน Firebase Console ที่ Node /doors/mainDoor/commands");

    } catch (error) {
        console.error("--- ❌ เกิดข้อผิดพลาดในการทดสอบ Commands ---", error);
    }
}