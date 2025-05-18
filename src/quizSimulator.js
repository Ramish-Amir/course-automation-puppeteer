import puppeteer from "puppeteer";
import { getAnswersFromAI } from "./geminiBot.js";

const performQuizByExtractingQuestionsAndMarkingAnswers = async (html) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setContent(html);

  // Extracting questions
  const questions = await page.evaluate(() => {
    const questionElements = document.querySelectorAll(".display_question");
    return Array.from(questionElements).map((question) => {
      const questionText = question.querySelector(".question_text").innerText;
      const answers = Array.from(
        question.querySelectorAll(".answer_label")
      ).map((answer) => answer.innerText);
      return { question: questionText, answers };
    });
  });

  const answers = await getAnswersFromAI(
    "Customer Service",
    JSON.stringify(questions)
  );

  const answerIndexes = answers; // Assuming answers is an array of 0-based indexes of correct answers

  await page.evaluate((answerIndexes) => {
    const questionElements = document.querySelectorAll(".display_question");
    Array.from(questionElements).forEach((question, index) => {
      const answerInputs = question.querySelectorAll(".question_input");
      if (answerInputs[answerIndexes[index]]) {
        answerInputs[answerIndexes[index]].click();
      }
    });
  }, answerIndexes);

  // Finally, click the submit button
  await page.click("#submit_quiz_button");

  //   await browser.close();
  return questions;
};

const performQuizByExtractingQuestionsAndMarkingAnswersV1 = async (html) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setContent(html);

  // 1) Extract all questions, with either radio-inputs or dropdowns
  const questions = await page.evaluate(() => {
    const questionEls = Array.from(
      document.querySelectorAll(".display_question")
    );
    return questionEls.map((qEl) => {
      // question text
      const text = qEl.querySelector(".question_text")?.innerText.trim() || "";

      // find all radio/checkbox inputs
      const radios = Array.from(
        qEl.querySelectorAll("input.question_input[type=radio]")
      ).map((inp) => ({
        type: "radio",
        value: inp.value,
        label: qEl.querySelector(`#${inp.id}_label`)?.innerText.trim() || "",
      }));

      // find all selects (could be multiple dropdowns per question)
      const selects = Array.from(
        qEl.querySelectorAll("select.question_input")
      ).map((sel) => {
        const opts = Array.from(sel.querySelectorAll("option"))
          .filter((o) => o.value) // ignore the blank “[ Select ]” option
          .map((o) => ({ value: o.value, label: o.innerText.trim() }));
        return { name: sel.name, options: opts };
      });

      return { text, radios, selects };
    });
  });

  console.log("QUESTIONS >>> ", questions);

  const aiPayload = JSON.stringify(questions);
  const aiAnswers = await getAnswersFromAI("Customer Service", aiPayload);

  console.log("AI Answers >>> ", aiAnswers);

  // 3) Apply those answers into the page
  await page.evaluate(
    (questions, aiAnswers) => {
      const qEls = Array.from(document.querySelectorAll(".display_question"));
      qEls.forEach((qEl, qi) => {
        const answer = aiAnswers[qi];

        //  — if radio/true-false
        if (typeof answer.radioIndex === "number") {
          console.log("NUMBER TYPE FOUND");
          const inputs = qEl.querySelectorAll(
            "input.question_input[type=radio]"
          );
          if (inputs[answer.radioIndex]) inputs[answer.radioIndex].click();
        }

        //  — if dropdown(s)
        if (Array.isArray(answer.selectChoices)) {
          const selects = Array.from(
            qEl.querySelectorAll("select.question_input")
          );
          answer.selectChoices.forEach((choiceIdx, si) => {
            const sel = selects[si];
            if (!sel) return;
            const opt = sel.querySelectorAll("option[value]")[choiceIdx + 1];
            if (opt) {
              sel.value = opt.value;
              // some frameworks need a change event:
              sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        }
      });
    },
    questions,
    aiAnswers
  );

  // 4) Submit
  //   await page.click("#submit_quiz_button");
  // await browser.close();
};

export { performQuizByExtractingQuestionsAndMarkingAnswers };

export const extractQuestions = async (page) => {
  const questions = await page.evaluate(() => {
    const questionElements = document.querySelectorAll(".display_question");
    return Array.from(questionElements).map((question) => {
      const questionText = question.querySelector(".question_text").innerText;
      const answers = Array.from(
        question.querySelectorAll(".answer_label")
      ).map((answer) => answer.innerText);
      return { question: questionText, answers };
    });
  });

  return questions;
};

const markAnswers = async (page, answerIndexes) => {
  await page.evaluate((answerIndexes) => {
    const questionElements = document.querySelectorAll(".display_question");
    Array.from(questionElements).forEach((question, index) => {
      const answerInputs = question.querySelectorAll(".question_input");
      if (answerInputs[answerIndexes[index]]) {
        answerInputs[answerIndexes[index]].click();
      }
    });
  }, answerIndexes);

  // Finally, click the submit button
  await page.click("#submit_quiz_button");

  // Wait for navigation to the next page
  await page.waitForNavigation({ waitUntil: "networkidle0" });
};

export const performQuiz = async (page) => {
  const questions = await extractQuestions(page);

  console.log("QUESTIONS >>> ", questions);

  if (questions.length === 0) {
    return "No questions found";
  }

  const answers = await getAnswersFromAI(
    "Customer Service",
    JSON.stringify(questions)
  );

  await markAnswers(page, answers);

  return;
};

export const performQuizV1 = async (page, courseTitle) => {
  // 1) Extract all questions
  const questions = await page.evaluate(() => {
    const questionEls = Array.from(
      document.querySelectorAll(".display_question")
    );
    return questionEls.map((qEl) => {
      const text = qEl.querySelector(".question_text")?.innerText.trim() || "";

      const radios = Array.from(
        qEl.querySelectorAll("input.question_input[type=radio]")
      ).map((inp) => ({
        type: "radio",
        value: inp.value,
        label: qEl.querySelector(`#${inp.id}_label`)?.innerText.trim() || "",
      }));

      const selects = Array.from(
        qEl.querySelectorAll("select.question_input")
      ).map((sel) => {
        const opts = Array.from(sel.querySelectorAll("option"))
          .filter((o) => o.value)
          .map((o) => ({ value: o.value, label: o.innerText.trim() }));
        return { name: sel.name, options: opts };
      });

      return { text, radios, selects };
    });
  });

  console.log("QUESTIONS LENGTH >> ", questions.length);

  // 2) Batch the questions into groups of 25
  const BATCH_SIZE = 25;
  const allAnswers = [];

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const aiAnswers = await getAnswersFromAI(
      courseTitle,
      JSON.stringify(batch)
    );
    console.log(`Batch ${i / BATCH_SIZE + 1} - Answered: ${aiAnswers.length}`);
    allAnswers.push(...aiAnswers);
  }

  console.log("AI Answers LENGTH >>> ", allAnswers.length);

  // 3) Apply answers to the page
  await page.evaluate(
    (questions, aiAnswers) => {
      const qEls = Array.from(document.querySelectorAll(".display_question"));
      qEls.forEach((qEl, qi) => {
        const answer = aiAnswers[qi];
        if (!answer) return;

        if (typeof answer.radioIndex === "number") {
          const inputs = qEl.querySelectorAll(
            "input.question_input[type=radio]"
          );
          if (inputs[answer.radioIndex]) inputs[answer.radioIndex].click();
        }

        if (Array.isArray(answer.selectChoices)) {
          const selects = Array.from(
            qEl.querySelectorAll("select.question_input")
          );
          answer.selectChoices.forEach((choiceIdx, si) => {
            const sel = selects[si];
            if (!sel) return;
            const opt = sel.querySelectorAll("option[value]")[choiceIdx + 1];
            if (opt) {
              sel.value = opt.value;
              sel.dispatchEvent(new Event("change", { bubbles: true }));
            }
          });
        }
      });
    },
    questions,
    allAnswers
  );

  await page.click("#submit_quiz_button");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
};
