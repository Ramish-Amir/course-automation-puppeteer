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

  // Wait for navigation to complete after clicking Canvas button
  try {
    console.log("⏳ Waiting for navigation to complete...");
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 });
  } catch (error) {
    console.log(
      "⚠️ Navigation wait timed out, checking if we need to handle popup or new tab..."
    );

    // Check if a new tab/window was opened
    const pages = await browser.pages();
    console.log(`📄 Found ${pages.length} pages/tabs`);

    if (pages.length > 1) {
      console.log("🔄 Multiple tabs detected, switching to the new tab...");
      // Switch to the new tab (usually the last one)
      const newPage = pages[pages.length - 1];
      await newPage.bringToFront();
      // Update our page reference
      page = newPage;
    }
  }

  // Wait a bit for the page to fully load
  console.log("⏳ Waiting for page to fully load...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check if we're on the right page by looking for dashboard elements
  const currentUrl = page.url();

  // If we're not on a Canvas dashboard page, try to navigate to it
  if (
    !currentUrl.includes("canvas") &&
    !currentUrl.includes("mynew.aolcc.ca")
  ) {
    console.log(
      "🔄 Not on Canvas page, trying to navigate to Canvas dashboard..."
    );
    try {
      // Try to navigate to the Canvas dashboard directly
      await page.goto("https://mynew.aolcc.ca/", {
        waitUntil: "networkidle0",
        timeout: 15000,
      });
    } catch (error) {
      console.log("⚠️ Direct navigation failed:", error.message);
    }
  }

  // Wait for the dashboard to load first - try multiple approaches
  console.log("🔍 Looking for dashboard elements...");

  // First, try to wait for any dashboard-related element
  const dashboardSelectors = [
    ".ic-DashboardCard__link",
    ".ic-DashboardCard",
    "#dashboard",
    "[data-testid='dashboard-card-title']",
    ".ic-dashboard-app",
  ];

  let dashboardFound = false;
  for (const selector of dashboardSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      dashboardFound = true;
      break;
    } catch (error) {
      console.log(`❌ Selector ${selector} not found`);
    }
  }

  if (!dashboardFound) {
    console.log("❌ No dashboard elements found, checking what's available...");

    // Debug: Check what elements are actually on the page
    const pageTitle = await page.title();
    console.log("📄 Page title:", pageTitle);

    const bodyText = await page.evaluate(() => document.body.textContent);
    console.log("📝 Page contains text:", bodyText.substring(0, 200) + "...");

    // Check for any dashboard-related elements
    const dashboardElements = await page.$$eval("*", (elements) =>
      elements
        .filter((el) => el.className && el.className.includes("dashboard"))
        .map((el) => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent.trim().substring(0, 50),
        }))
    );
    console.log("🔍 Dashboard-related elements:", dashboardElements);

    // Check for any course-related elements
    const courseElements = await page.$$eval("*", (elements) =>
      elements
        .filter((el) => el.className && el.className.includes("course"))
        .map((el) => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent.trim().substring(0, 50),
        }))
    );
    console.log("🔍 Course-related elements:", courseElements);

    throw new Error("No dashboard elements found on page");
  }

  // Scroll to the end of the page to ensure all elements are loaded
  console.log("📜 Starting to scroll to end of page...");
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Wait a bit more for any lazy-loaded content
  console.log("⏳ Waiting for lazy-loaded content...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Try to find the course link with better error handling
  console.log("🔍 Attempting to find course link selector...");
  let courseLinkSelector;
  try {
    courseLinkSelector = await page.waitForSelector(".ic-DashboardCard__link", {
      timeout: 10000,
    });
  } catch (error) {
    console.log("❌ Primary selector failed:", error.message);
    console.log("🔄 Trying alternative selectors...");

    // Try alternative selectors
    const alternativeSelectors = [
      'a[href*="/courses/"]',
      ".ic-DashboardCard a",
      '[data-testid="dashboard-card-title"] a',
    ];

    for (const selector of alternativeSelectors) {
      try {
        console.log(`🔍 Trying selector: ${selector}`);
        courseLinkSelector = await page.waitForSelector(selector, {
          timeout: 5000,
        });
        break;
      } catch (e) {
        console.log(`❌ Selector ${selector} failed:`, e.message);
        continue;
      }
    }

    if (!courseLinkSelector) {
      console.log("❌ All selectors failed. Let's debug what's on the page...");

      // Debug: Get all links on the page
      const allLinks = await page.$$eval("a", (links) =>
        links.map((link) => ({
          href: link.href,
          text: link.textContent.trim(),
          classes: link.className,
        }))
      );
      console.log("🔍 All links found on page:", allLinks);

      // Debug: Get all elements with course-related classes
      const courseElements = await page.$$eval(
        '.ic-DashboardCard, .ic-DashboardCard__link, [data-testid="dashboard-card-title"]',
        (elements) =>
          elements.map((el) => ({
            tagName: el.tagName,
            className: el.className,
            textContent: el.textContent.trim(),
            href: el.href || "N/A",
          }))
      );
      console.log("🔍 Course-related elements:", courseElements);

      throw new Error("Could not find course link with any selector");
    }
  }

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
