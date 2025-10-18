import puppeteer from "puppeteer";
import dotenv from "dotenv";
import users from "../users.json" assert { type: "json" };

dotenv.config();

async function openPageAndGetHref({ headless = false, userNumber = 0 }) {
  console.log("🎯 Starting openPageAndGetHref function...");

  const SITE_URL = process.env.SITE_URL;
  const { USERNAME, PASSWORD } = getUserCredentials(userNumber);

  console.time("AUTOMATION");
  console.log("LOGGING IN AS >>> ", USERNAME);

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({ headless });
  let page = await browser.newPage();

  // Increase default timeout to prevent premature timeouts
  page.setDefaultTimeout(30000); // 30 seconds
  console.log("⏰ Set page timeout to 30 seconds");

  console.log("🌐 Navigating to site:", SITE_URL);
  await page.goto(SITE_URL);

  console.log("👤 Filling username...");
  const usernameSelector = await page.$("#MainContent_txt_Username");
  await usernameSelector.type(USERNAME);

  console.log("🔒 Filling password...");
  const passwordSelector = await page.$("#MainContent_txt_Password");
  await passwordSelector.type(PASSWORD);

  console.log("🔘 Clicking login button...");
  const loginButton = await page.waitForSelector("#MainContent_btn_Login");
  await loginButton.click();

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  const canvasButton = await page.waitForSelector(
    "#anchortagcanvasforinactivestudent"
  );
  await canvasButton.click();

  // Wait a bit for the page to fully load
  console.log("⏳ Waiting for page to fully load...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.goto(process.env.COURSE_DOMAIN, {
    waitUntil: "networkidle0",
    timeout: 15000,
  });

  // Try to find the course link with better error handling
  console.log("🔍 Attempting to find course link selector...");
  let courseLinkSelector = await page.waitForSelector(
    ".ic-DashboardCard__link"
  );

  console.log("🔍 Getting course titles...");
  const titles = await page.$$eval(
    'h2[data-testid="dashboard-card-title"]',
    (elements) => elements.map((el) => el.getAttribute("title"))
  );
  console.log("📋 Course titles found:", titles);

  console.log("🔗 Extracting href from course link...");
  const href = await page.evaluate(
    (anchor) => anchor.getAttribute("href"),
    courseLinkSelector
  );
  console.log("✅ Course href extracted:", href);

  console.log("🎉 Successfully completed course link extraction!");
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
