import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

async function openPageAndGetHref() {
  const SITE_URL = process.env.SITE_URL;
  const USERNAME = process.env.USERNAME;
  const PASSWORD = process.env.PASSWORD;

  console.time("AUTOMATION");
  const browser = await puppeteer.launch({ headless: false });
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

export { openPageAndGetHref };
