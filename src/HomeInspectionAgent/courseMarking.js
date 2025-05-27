import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

async function runInspectionCourseMarking({ headless = false }) {
  const SITE_URL = process.env.CD_SITE_URL;
  const USERNAME = process.env.CD_USERNAME;
  const PASSWORD = process.env.CD_PASSWORD;

  console.time("AUTOMATION");
  console.log("LOGGING IN AS >>> ", USERNAME);
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  await page.goto(SITE_URL);

  const usernameSelector = await page.$("#user_login");
  await usernameSelector.type(USERNAME);

  const passwordSelector = await page.$("#user_pass");
  await passwordSelector.type(PASSWORD);

  const loginButton = await page.waitForSelector("#wp-submit");
  await loginButton.click();

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  const allLessonsBtn = await page.waitForSelector(".button.next-lesson");
  await allLessonsBtn.click();

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  let lessonsFinished = false;

  while (!lessonsFinished) {
    lessonsFinished = await markLessonAsCompleted(page);
  }

  await browser.close();
}

runInspectionCourseMarking({ headless: false });

const markLessonAsCompleted = async (page) => {
  try {
    const nextBtn = await page.waitForSelector(".quiz-submit.complete", {
      timeout: 1000,
    });
    await nextBtn.click();
    await page.waitForNavigation({ waitUntil: "networkidle0" });
  } catch (err) {
    console.log("NEXT BTN NOT FOUND");

    // If next button not found, then look for button with following html:
    // <a class="button" href="https://training.carsondunlop.com/quiz/quick-quiz-3-71/" title="View the quiz">
    // View the quiz
    // </a>

    try {
      const viewQuizBtn = await page.waitForSelector(
        'a.button[title="View the quiz"]',
        {
          timeout: 1000,
        }
      );
      await viewQuizBtn.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    } catch (quizErr) {
      console.log("VIEW QUIZ BUTTON NOT FOUND");

      // If Quiz button not found, look for element with following html:
      //   <a class="next-lesson" href="https://training.carsondunlop.com/lesson/introduction-to-study-session-3-34/" rel="next"><span class="meta-nav"></span>Continue</a>
      try {
        const continueBtn = await page.waitForSelector(
          'a.next-lesson[rel="next"]',
          {
            timeout: 1000,
          }
        );
        await continueBtn.click();
        await page.waitForNavigation({ waitUntil: "networkidle0" });
      } catch (continueErr) {
        console.log("CONTINUE BUTTON NOT FOUND");
        return true; // Assume lessons are finished if no button is found
      }
    }
  }
};
