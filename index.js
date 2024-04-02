const puppeteer = require("puppeteer");
const { setTimeout } = require("timers/promises");
require("dotenv").config();

async function run() {
  const SITE_URL = process.env.SITE_URL;
  const COURSE_DOMAIN = process.env.COURSE_DOMAIN;
  const USERNAME = process.env.USERNAME;
  const PASSWORD = process.env.PASSWORD;

  const start = Date.now();
  const browser = await puppeteer.launch({ headless: true });
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

  const href = await page.evaluate(
    (anchor) => anchor.getAttribute("href"),
    courseLinkSelector
  );

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

    await setTimeout(1000);
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

  await browser.close();
}

run();
