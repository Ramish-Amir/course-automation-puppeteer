import { readFile } from "fs/promises";

export function waitForOTP(filePath, intervalMs = 2000) {
  return new Promise((resolve) => {
    const checkFile = async () => {
      try {
        console.log("Checking for OTP...");
        const data = await readFile(filePath, "utf8");
        const otp = data.trim();

        if (otp.length > 0) {
          clearInterval(timer);
          resolve(otp);
        }
      } catch {
        // Ignore errors (file not ready yet)
      }
    };

    // Run immediately
    checkFile();

    // Poll every 2 seconds
    const timer = setInterval(checkFile, intervalMs);
  });
}
