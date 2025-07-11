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

  if (toggleValue == "Expand All") {
    await toggleButtonHandle.click();
  } else {
    await toggleButtonHandle.click();

    setTimeout(() => {}, 1000);
    await toggleButtonHandle.click();
  }

  const links = await page.$$eval("a.ig-title.title.item_link", (anchors) => {
    return anchors?.map((anchor) => anchor.getAttribute("href"));
  });

  console.log("LINKS found >> ", links?.length);

  for (const link of links) {
    console.log("Visiting >> ", link);

    // Open a new tab
    const pageTarget = await browser.newPage();

    // Load URL in the new tab
    await pageTarget.goto(COURSE_DOMAIN + link);

    // Close the new tab
    await pageTarget.close();
  }

  console.log("Completed items >> ", links.length);

  console.timeEnd("AUTOMATION");

  await browser.close();
}

run();
