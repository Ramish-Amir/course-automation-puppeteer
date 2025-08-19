import { openPageAndGetHref } from "./utils.js";

async function run() {
  console.log("RUNNING MARKING AUTOMATOR");

  const userNumber = parseInt(process.argv[2]) - 1 || 0;

  const COURSE_DOMAIN = process.env.COURSE_DOMAIN;

  const { href, page, browser } = await openPageAndGetHref({
    headless: true,
    userNumber,
  });

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

  for (const link of links) {
    console.log("Visiting >> ", link);

    // Open a new tab
    const pageTarget = await browser.newPage();

    // Load URL in the new tab
    await pageTarget.goto(link);

    // Wait for the page to load
    await new Promise((r) => setTimeout(r, 1000));

    // Close the new tab
    await pageTarget.close();
  }

  console.log("Completed items >> ", links.length);

  console.timeEnd("AUTOMATION");

  await browser.close();
}

run();
