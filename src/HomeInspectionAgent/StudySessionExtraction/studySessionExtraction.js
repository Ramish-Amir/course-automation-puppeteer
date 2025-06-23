import puppeteer from "puppeteer";
import { cdCourseContentsSummaryHtml } from "../../../HTMLS/cdCourseContentsSummaryHtml.js";
import { openCdCoursePage } from "../cdCoursePage.js";

async function extractStudySessionLinks(page) {
  console.log("EXTRACTING STUDY SESSION LINKS");

  const links = await page.evaluate(() => {
    let currentTitleNumber = 0;
    let currentStudySessionNumber = 1;
    const studySessionLinks = { [`Module ${currentStudySessionNumber}`]: [] };
    // Select all anchor tags that contain "Study Session" in their text content
    const linkElements = document.querySelectorAll("a");

    linkElements.forEach((link) => {
      if (link.textContent.startsWith("Study Session") && link.href) {
        const title = link.textContent.split(" - ")[0].trim();

        const titleNumber = parseInt(title.split(" ")[2]);

        if (titleNumber === currentTitleNumber + 1) {
          studySessionLinks?.[`Module ${currentStudySessionNumber}`]?.push(
            link.href
          );
        } else {
          currentStudySessionNumber++;
          studySessionLinks[`Module ${currentStudySessionNumber}`] = [
            link.href,
          ];
        }

        currentTitleNumber = titleNumber;
      }
    });

    return studySessionLinks;
  });

  return links;
}

export const studySessionExtraction = async () => {
  const { page, browser } = await openCdCoursePage();
  try {
    console.log("EXTRACTING STUDY SESSIONS");

    const CURRENT_COURSE_URL =
      "https://training.carsondunlop.com/course/roofing-content/";

    await page.goto(CURRENT_COURSE_URL, { waitUntil: "networkidle0" });

    const links = await extractStudySessionLinks(page);
    console.log("STUDY SESSION LINKS >>> ", links);

    return;

    for (const studySessionLink of [links.studySessionLinks[0]]) {
      console.log("VISITING STUDY SESSION LINK >>> ", studySessionLink);
      await page.goto(studySessionLink, { waitUntil: "networkidle0" });

      // Read the text content of the study session
      const content = await readStudySessionText(page);
      if (content) {
        console.log("STUDY SESSION CONTENT >>> ", content);
      } else {
        console.log("No content found for this study session.");
      }
    }
  } catch (error) {
    console.error("Error extracting study sessions:", error);
  } finally {
    await browser.close();
  }
};

const readStudySessionText = async (page) => {
  const content = await page.evaluate(() => {
    const entryFixElement = document.querySelector(".entry.fix");
    if (entryFixElement) {
      // Extract and return the text content, trimming whitespace
      return entryFixElement.textContent.trim();
    }
    return null; // Return null if the element is not found
  });

  return content;
};

studySessionExtraction();
