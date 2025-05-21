import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

const SITE_URL = "https://myaolcc.ca/studentportal/login/";
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

export const runAttendanceBot = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(SITE_URL);

  const usernameSelector = await page.$("#emailForm");
  await usernameSelector.type(USERNAME);

  const passwordSelector = await page.$("#pwdform");
  await passwordSelector.type(PASSWORD);

  const loginButton = await page.waitForSelector(".btnlogin");
  await loginButton.click();
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  console.log(
    "Leaving browser open. Press CTRL+C to exit script, then close browser manually."
  );

  setInterval(() => {}, 1 << 30); // Keeps Node running but does nothing
};

function delay(time) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}

runAttendanceBot();
