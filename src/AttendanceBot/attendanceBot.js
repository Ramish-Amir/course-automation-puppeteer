import puppeteer from "puppeteer";
import dotenv from "dotenv";
import users from "../../users.json" assert { type: "json" };

dotenv.config();

const SITE_URL = "https://myaolcc.ca/studentportal/login/";

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
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  console.log(
    "Leaving browser open. Press CTRL+C to exit script, then close browser manually."
  );

  setInterval(() => {}, 1 << 30); // Keeps Node running but does nothing
};

export const runAttendanceBot = async () => {
  const attendanceUsers = users;

  if (!attendanceUsers?.length) {
    console.log("No users found for attendance");
  }

  for (const { username, password } of attendanceUsers) {
    console.log("Logging Attendance for: ", username);
    await launchAttendanceSession(username, password);
  }

  console.log(`Logged in for ${attendanceUsers.length} users.`);

  //   // Keep script running
  setInterval(() => {}, 1 << 30);
};

runAttendanceBot();
