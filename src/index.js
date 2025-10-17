import { openPageAndGetHref } from "./utils.js";

async function run() {
  console.log("🚀 RUNNING MARKING AUTOMATOR");
  console.log("⏰ Starting timer...");
  console.time("TOTAL_RUNTIME");

  const userNumber = parseInt(process.argv[2]) - 1 || 0;
  console.log(`👤 Using user number: ${userNumber}`);

  const COURSE_DOMAIN = process.env.COURSE_DOMAIN;
  console.log(`🌐 Course domain: ${COURSE_DOMAIN}`);

  console.log("🔗 Starting page and href extraction...");
  let href, page, browser;
  try {
    const result = await openPageAndGetHref({
      headless: true,
      userNumber,
    });
    href = result.href;
    page = result.page;
    browser = result.browser;
  } catch (error) {
    console.log("❌ Error during page and href extraction:", error.message);
    console.log("📊 Error details:", error);
    throw error;
  }

  const modulesUrl = COURSE_DOMAIN + href + "/modules";
  console.log("Modules URL >> ", modulesUrl);

  await page.goto(modulesUrl);

  const toggleButtonHandle = await page.waitForSelector(
    "button#expand_collapse_all"
  );

  const toggleValue = await page.evaluate(
    (btn) => btn.textContent,
    toggleButtonHandle
  );

  console.log("TOGGLE VALUE >> ", toggleValue);

  if (toggleValue == "Expand All") {
    await toggleButtonHandle.click();
    await new Promise((r) => setTimeout(r, 200));
  } else {
    await toggleButtonHandle.click();
    await new Promise((r) => setTimeout(r, 200));

    await new Promise((r) => setTimeout(r, 200));
    await toggleButtonHandle.click();
    await new Promise((r) => setTimeout(r, 200));
  }

  const rows = await page.$$(".ig-row"); // Select all module rows

  const links = [];

  for (const row of rows) {
    // Check if the row contains the "icon-mark-as-read" element
    const icon = await row.$(".icon-mark-as-read");
    if (!icon) continue; // Skip if not found

    // Get the anchor inside the same row
    const anchor = await row.$("a.ig-title.title.item_link");
    if (!anchor) continue; // Skip if no anchor found

    // Extract the href attribute
    const href = await (await anchor.getProperty("href")).jsonValue();

    if (href) {
      links.push(href);
    }
  }
  console.log("LINKS found >> ", links?.length);

  if (links.length === 0) {
    console.log("NO LINKS FOUND");
    await browser.close();
    return;
  }

  await page.goto(links[0]);

  let lessonsFinished = false;
  let lessonNumber = 1;
  while (!lessonsFinished) {
    // Print the page title (h1.page-title) only if it exists
    try {
      const title = await page.$eval("h1.page-title", (el) =>
        el.textContent.trim()
      );
      console.log(`${lessonNumber}: ${title}`);
    } catch (error) {
      console.log(`${lessonNumber}: Quiz`);
    }
    lessonNumber++;

    // Find "Next" button and click it
    try {
      const nextLessonBtn = await page.waitForSelector(
        'a[aria-label="Next Module Item"]'
      );

      if (!nextLessonBtn) {
        lessonsFinished = true;
        break;
      }

      // Scroll the element into view before clicking
      await nextLessonBtn.scrollIntoView();

      // Wait a moment for the scroll to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify it's now clickable
      await nextLessonBtn.isIntersectingViewport();

      await nextLessonBtn.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    } catch (error) {
      console.log("NEXT LESSON BUTTON NOT FOUND");
      lessonsFinished = true;
      break;
    }
  }

  console.log("Completed items >> ", links.length);

  console.timeEnd("AUTOMATION");

  await browser.close();
}

run();
