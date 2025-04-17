import { openPageAndGetHref } from "./utils.js";

async function run() {
  const COURSE_DOMAIN = process.env.COURSE_DOMAIN;

  const { href, page, browser } = await openPageAndGetHref();

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

    setTimeout(1000);
    await toggleButtonHandle.click();
  }

  const links = await page.$$eval("a.ig-title.title.item_link", (anchors) => {
    return anchors?.map((anchor) => anchor.getAttribute("href"));
  });

  console.log("LINKS found >> ", links?.length);

  // const tempLinks = [];

  // for (let i = 30; i < 60; i++) {
  //   tempLinks.push(links[i]);
  // }

  for (const link of links) {
    console.log("Visiting >> ", link);
    // const client = await page.target().createCDPSession();
    // await client.send("Target.createTarget", { url: COURSE_DOMAIN + link });

    // Open a new tab
    const pageTarget = await browser.newPage();

    // Load URL in the new tab
    await pageTarget.goto(COURSE_DOMAIN + link);

    // Close the new tab
    await pageTarget.close();
  }

  console.log("Time taken >> ", Date.now() - start);
  console.log("Completed items >> ", links.length);

  console.timeEnd("AUTOMATION");

  await browser.close();
}

run();
