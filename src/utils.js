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

  // Wait for the Canvas tab to open and then close it after 1 second
  console.log("⏳ Waiting for Canvas tab to open...");
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds for tab to open

  // Get all pages/tabs
  const pages = await browser.pages();
  console.log(`📄 Found ${pages.length} tabs`);

  // Close the 3rd tab (Canvas tab) if it exists
  if (pages.length >= 3) {
    console.log("🗑️ Closing 3rd tab (Canvas tab)...");
    await pages[2].close(); // Close the 3rd tab (index 2)
    console.log("✅ 3rd tab closed");
  }

  // Optionally close the 1st tab (empty tab) if it exists and is empty
  if (pages.length >= 2) {
    const firstTab = pages[0];
    const firstTabUrl = firstTab.url();
    console.log(`🔍 First tab URL: ${firstTabUrl}`);

    // Close first tab if it's empty or just the default new tab page
    if (
      firstTabUrl === "about:blank" ||
      firstTabUrl.includes("chrome://") ||
      firstTabUrl === ""
    ) {
      console.log("🗑️ Closing 1st tab (empty tab)...");
      await firstTab.close();
      console.log("✅ 1st tab closed");
    }
  }

  // Make sure we're working with the 2nd tab (now the active tab)
  const remainingPages = await browser.pages();
  if (remainingPages.length > 0) {
    page = remainingPages[0]; // Use the first remaining tab
    console.log("✅ Switched to active tab");
  }

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
