import puppeteer from "puppeteer";
import dotenv from "dotenv";
import users from "../users.json" assert { type: "json" };

dotenv.config();

async function openPageAndGetHref({ headless = false, userNumber = 0 }) {
  const SITE_URL = process.env.SITE_URL;
  const { USERNAME, PASSWORD } = getUserCredentials(userNumber);

  console.time("AUTOMATION");
  console.log("LOGGING IN AS >>> ", USERNAME);
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  await page.goto(SITE_URL);

  const usernameSelector = await page.$("#pseudonym_session_unique_id");
  await usernameSelector.type(USERNAME);

  const passwordSelector = await page.$("#pseudonym_session_password");
  await passwordSelector.type(PASSWORD);

  const loginButton = await page.waitForSelector(".Button--login");
  await loginButton.click();

  const courseLinkSelector = await page.waitForSelector(
    ".ic-DashboardCard__link"
  );

  const titles = await page.$$eval(
    'h2[data-testid="dashboard-card-title"]',
    (elements) => elements.map((el) => el.getAttribute("title"))
  );

  const href = await page.evaluate(
    (anchor) => anchor.getAttribute("href"),
    courseLinkSelector
  );

  return { href, page, browser, courseTitle: titles[0] };
}

function getUserCredentials(userNumber) {
  if (!users || !users.length) {
    throw new Error("No users found in users.json");
  }

  const user = users[userNumber];
  if (!user) {
    throw new Error(`User not found for user number: ${userNumber}`);
  }

  return { USERNAME: user.username, PASSWORD: user.password };
}

export { openPageAndGetHref };
