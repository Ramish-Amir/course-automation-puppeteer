import { performQuizV2 } from "./QuizAIAgent/quizSimulator.js";
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
  let href, page, browser, courseTitle;
  try {
    const result = await openPageAndGetHref({
      headless: true,
      userNumber,
    });
    href = result.href;
    page = result.page;
    browser = result.browser;
    courseTitle = result.courseTitle;
  } catch (error) {
    console.log("❌ Error during page and href extraction:", error.message);
    console.log("📊 Error details:", error);
    // throw error;
  }

  const modulesUrl = COURSE_DOMAIN + href + "/modules";
  console.log("Modules URL >> ", modulesUrl);

  await page.goto(modulesUrl);

  const toggleButtonHandle = await page.waitForSelector(
    "button#expand_collapse_all",
  );

  const toggleValue = await page.evaluate(
    (btn) => btn.textContent,
    toggleButtonHandle,
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
    return;
  }

  await page.goto(links[0]);

  let lessonsFinished = false;
  let lessonNumber = 1;
  while (!lessonsFinished) {
    // Get page title - try multiple selectors for different page types
    let title = "";
    let isAssignmentPage = false;

    try {
      title = await page.$eval("h1.page-title", (el) => el.textContent.trim());
    } catch {
      try {
        title = await page.$eval("h1#quiz_title", (el) =>
          el.textContent.trim(),
        );
      } catch {
        // Assignment pages: get title from document or [data-testid="title"]
        try {
          title =
            (await page.$eval("[data-testid='title']", (el) =>
              el.textContent.trim(),
            )) || (await page.title());
        } catch {
          title = await page.title();
        }
      }
    }

    // Check if this is an assignment page (Practice Exercise or Submission)
    const titleLower = title.toLowerCase();
    isAssignmentPage =
      titleLower.includes("practice exercise") ||
      titleLower.includes("submission");

    if (isAssignmentPage) {
      console.log(`${lessonNumber}: ${title} (Assignment - skipping)`);
    } else {
      console.log(`${lessonNumber}: ${title}`);
    }

    // For quiz pages (not assignment), perform the quiz
    if (!isAssignmentPage) {
      try {
        const quizTitle = await page.$eval("h1#quiz_title", (el) =>
          el.textContent.trim(),
        );
        if (!quizTitle.toLowerCase().includes("questions")) {
          const takeQuizBtn = await page.waitForSelector(".take_quiz_button");
          await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            takeQuizBtn.click(),
          ]);
          await performQuizV2(page, courseTitle);
        }
      } catch {
        // Not a quiz page, continue
      }
    }

    lessonNumber++;

    // Find "Next" button and click it
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let nextLessonBtn = await page
        .waitForSelector('a[aria-label="Next Module Item"]', { timeout: 5000 })
        .catch(() => null);

      // Assignment pages use a different Next button selector
      if (!nextLessonBtn && isAssignmentPage) {
        nextLessonBtn = await page.waitForSelector(
          'a[data-testid="next-assignment-btn"]',
        );
      }

      if (!nextLessonBtn) {
        lessonsFinished = true;
        break;
      }

      await nextLessonBtn.scrollIntoView();
      await new Promise((resolve) => setTimeout(resolve, 500));
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

  // await browser.close();
}

run().catch((error) => {
  console.log("❌ Error:", error.message);
  console.log("📊 Error details:", error);
});
