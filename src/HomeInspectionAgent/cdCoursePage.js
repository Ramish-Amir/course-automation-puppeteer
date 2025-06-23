import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

export const openCdCoursePage = async () => {
  const SITE_URL = process.env.CD_SITE_URL;
  const USERNAME = process.env.CD_USERNAME;
  const PASSWORD = process.env.CD_PASSWORD;

  console.time("AUTOMATION");
  console.log("LOGGING IN AS >>> ", USERNAME);
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(SITE_URL);

  const usernameSelector = await page.$("#user_login");
  await usernameSelector.type(USERNAME);

  const passwordSelector = await page.$("#user_pass");
  await passwordSelector.type(PASSWORD);

  const loginButton = await page.waitForSelector("#wp-submit");
  await loginButton.click();

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  return { page, browser };
};
