import { performQuizV2 } from "./quizSimulator.js";
import { openPageAndGetHref } from "../utils.js";

async function getQuizUrls(page, isFinalExam) {
  // Select all ungraded student assignments
  const selector = "tr.student_assignment:not(.assignment_graded)";

  const quizHrefs = await page.$$eval(
    selector,
    (tableRows, isFinalExam) => {
      return tableRows
        .map((row) => row.querySelector("th.title a"))
        .filter((anchor) => {
          if (!anchor) return false;
          const text = anchor.textContent?.trim().toLowerCase() || "";
          return isFinalExam ? text.includes("final") : !text.includes("final");
        })
        .map((anchor) => anchor.getAttribute("href"))
        .filter((href) => Boolean(href));
    },
    isFinalExam
  );

  return quizHrefs;
}

async function runQuizAgent() {
  console.log("RUNNING QUIZ AUTOMATOR");

  const isFinalExam = process.argv[3] || false;

  console.log("IS FINAL EXAM >>> ", isFinalExam);

  const { href, page, browser, courseTitle } = await openPageAndGetHref({
    headless: true,
    userNumber: parseInt(process.argv[2]) - 1 || 0,
  });
  try {
    console.log("HREF >>> ", href);

    const COURSE_DOMAIN = process.env.COURSE_DOMAIN;

    const gradesUrl = COURSE_DOMAIN + href + "/grades";
    console.log("Modules URL >> ", gradesUrl);

    await page.goto(gradesUrl);

    const quizHrefs = await getQuizUrls(page, isFinalExam);
    console.log("QUIZ HREFS >>> ", quizHrefs);
    console.log("COURSE TITLE >>> ", courseTitle);

    const allAccessCodes = process.env.ACCESS_CODES?.split(", ");

    for (let index = 0; index < quizHrefs?.length; index++) {
      const quizHref = quizHrefs[index];
      await page.goto(COURSE_DOMAIN + quizHref);

      const iframeHandle = await page.waitForSelector("iframe#preview_frame", {
        timeout: 10000,
      });

      const frame = await iframeHandle.contentFrame();
      if (!frame)
        throw new Error("Couldn’t get the contentFrame for #preview_frame");

      // Rather than going to quizHref, click on this button '.take_quiz_link'
      const takeQuizBtn = await frame.waitForSelector(".take_quiz_button");

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        takeQuizBtn.click(),
      ]);

      const accessCodeSelector = await page.$("#quiz_access_code");

      if (accessCodeSelector) {
        const accessCode = allAccessCodes?.[index];

        console.log("ACCESS CODE >>> ", index, accessCode);

        if (!!!accessCode) {
          console.log("Access code required but not provided");
          return;
        }

        // Type access code
        await accessCodeSelector.type(accessCode);

        // Submit access code
        const submitButton = await page.$('button.btn[type="submit"]');
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle0" }),
          submitButton.click(),
        ]);
      } else {
        console.log("Access code not required");
      }

      await performQuizV2(page, courseTitle);
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    console.timeEnd("AUTOMATION");
    await browser.close();
  }
}

runQuizAgent();
