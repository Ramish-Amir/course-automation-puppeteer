import puppeteer from "puppeteer";
import { getAnswersFromAI } from "./geminiBot.js";

const performQuizByExtractingQuestionsAndMarkingAnswers = async (html) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setContent(html);

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
      "Customer Service",
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

  //   await browser.close();
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

export const performQuizV2 = async (page, courseTitle) => {
  // 1) Extract questions
  const questions = await page.$$eval(".question_holder", (holders) => {
    return holders.map((holder) => {
      const questionEl = holder.querySelector(".display_question");
      const qType = questionEl.classList.contains("multiple_choice_question")
        ? "mcq"
        : questionEl.classList.contains("true_false_question")
        ? "mcq"
        : questionEl.classList.contains("multiple_dropdowns_question")
        ? "select"
        : questionEl.classList.contains("multiple_answers_question")
        ? "checkbox"
        : null;

      // TODO: Another type is matching question

      const assessmentId = questionEl
        .querySelector(".assessment_question_id")
        .textContent.trim();
      // extract text
      const text = questionEl.querySelector(".question_text").innerText.trim();

      let options = [];
      if (qType === "mcq") {
        holder.querySelectorAll("input.question_input").forEach((input) => {
          const inputId = `${input.id}_label`;
          const label = holder.querySelector(`#${inputId}`)?.innerText.trim();
          options.push({ value: inputId, label });
        });
      } else if (qType === "select") {
        holder.querySelectorAll("select.question_input").forEach((select) => {
          const opts = Array.from(select.options)
            .filter((o) => o.value)
            .map((o) => ({ value: o.value, label: o.text }));
          options.push({ name: select.name, opts });
        });
      }

      return { id: assessmentId, type: qType, question: text, options };
    });
  });

  console.log("QUESTIONS LENGTH >>", questions.length);

  // 2) Batch and get answers
  const BATCH_SIZE = 20;
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

  console.log("AI Answers LENGTH >>>", allAnswers.length);

  // 3) Mark answers on page
  for (const [i, ans] of allAnswers.entries()) {
    try {
      if (ans.type === "select") {
        const values = Array.isArray(ans.answer) ? ans.answer : [ans.answer];

        for (const { name, value } of values) {
          await page.select(`select[name='${name}']`, value);
        }
      } else {
        for (const answer of ans.answer) {
          const correctOption = await page.waitForSelector(`#${answer}`, {
            timeout: 3000,
          });
          await correctOption.click();
        }
      }
    } catch (err) {
      console.warn(`⚠️⚠️⚠️  WARNING: Skipping question ${i + 1}.`);
      continue;
    }
  }

  await page.click("#submit_quiz_button");
  await page.waitForNavigation({ waitUntil: "networkidle0" });
};
