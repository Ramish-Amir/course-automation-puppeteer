import puppeteer from "puppeteer";
import dotenv from "dotenv";
import users from "../../users.json" assert { type: "json" };

dotenv.config();

const SITE_URL = process.env.ATTENDANCE_SITE_URL;

export const launchAttendanceSession = async (USERNAME, PASSWORD) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(SITE_URL);

  const usernameSelector = await page.waitForSelector("#emailForm");
  await usernameSelector.type(USERNAME);

  const passwordSelector = await page.waitForSelector("#pwdform");
  await passwordSelector.type(PASSWORD);

  const loginButton = await page.waitForSelector(".btnlogin");
  await loginButton.click();

  await page.waitForNavigation();

  // // Schedule browser close after 4.1 hours
  // setTimeout(async () => {
  //   try {
  //     await browser.close();
  //     console.log(`Browser closed for user: ${USERNAME}`);
  //   } catch (err) {
  //     console.error(`Error closing browser for user ${USERNAME}:`, err);
  //   }
  // }, 14760000); // 4.1 hours in milliseconds (14760000)
};

export const runAttendanceBot = async () => {
  console.log("\n🚀🚀🚀 STARTING ATTENDANCE LOGIN \n");
  const attendanceUsers = users;

  if (!attendanceUsers?.length) {
    console.log("No users found for attendance");
    return;
  }

  for (const { username, password } of attendanceUsers) {
    console.log("✅  >>> Logging Attendance for: ", username);
    // Don't await, start session in background
    await launchAttendanceSession(username, password);
  }

  console.log(`\nLogged in for ${attendanceUsers.length} users.`);
  console.log(new Date().toLocaleString(), " - Attendance Bot is running...");

  // setInterval(() => {}, 1 << 30); // Keeps Node running
};

runAttendanceBot();
