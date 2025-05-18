import { performQuiz } from "./quizSimulator.js";
import { openPageAndGetHref } from "./utils.js";

async function getQuizUrls(page) {
  // Selector for table rows that are student assignments but NOT graded
  const selector = "tr.student_assignment:not(.assignment_graded)";

  const quizHrefs = await page.$$eval(selector, (tableRows) => {
    const hrefs = []; // Array to store the hrefs

    // Loop through each selected table row
    for (const row of tableRows) {
      // Find the anchor tag within the 'th' element with class 'title'
      const anchorElement = row.querySelector("th.title a");

      // Check if an anchor tag exists and its text does NOT include 'Final Exam'
      if (anchorElement && !anchorElement.textContent.includes("Final")) {
        // If conditions met, get the 'href' attribute and add it to the array
        const href = anchorElement.getAttribute("href");
        if (href) {
          // Ensure href is not null or empty
          hrefs.push(href);
        }
      }
    }
    // Return the array of collected hrefs
    return hrefs;
  });

  return quizHrefs; // Return the array of hrefs
}

async function runQuizAgent() {
  const { href, page, browser } = await openPageAndGetHref();
  try {
    console.log("HREF >>> ", href);

    const COURSE_DOMAIN = process.env.COURSE_DOMAIN;

    const gradesUrl = COURSE_DOMAIN + href + "/grades";
    console.log("Modules URL >> ", gradesUrl);

    await page.goto(gradesUrl);

    const quizHrefs = await getQuizUrls(page);
    console.log("QUIZ HREFS >>> ", quizHrefs);

    for (const quizHref of quizHrefs) {
      await page.goto(COURSE_DOMAIN + quizHref);

      const iframeHandle = await page.waitForSelector("iframe#preview_frame", {
        timeout: 10000,
      });

      const frame = await iframeHandle.contentFrame();
      if (!frame)
        throw new Error("Couldn’t get the contentFrame for #preview_frame");

      // 5b) If you need the HREF or element handle:
      const quizhref = await frame.$eval("#take_quiz_link", (el) =>
        el.getAttribute("href")
      );
      console.log("Quiz URL:", quizhref);

      // Rather than going to quizHref, click on this button '#take_quiz_link'
      const takeQuizBtn = await frame.waitForSelector("#take_quiz_link");

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        takeQuizBtn.click(),
      ]);

      await performQuiz(page);
    }
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    console.timeEnd("AUTOMATION");
    // await browser.close();
  }
}

runQuizAgent();
