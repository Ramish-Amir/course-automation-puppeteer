import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAnswersFromAI(courseName, questions) {
  const prompt = `You are a helpful assistant for the course ${courseName}. Answer MCQ questions in context of ${courseName}.
  

    Following is the example of questions, please provide the correct answer by its index (0-based) in the options list like given below.
    Questions = [
        {
        "question": "What is the capital of France?",
        "options": ["Paris", "London", "Berlin", "Madrid"]
        },
        {
        "question": "What game is LinDan known for?",
        "options": ["Tennis", "Football", "Badminton", "Cricket"]
        }
    ]


    Give answers (in same sequence) like this:
    0,2


    Questions = ${questions}
    `;

  const promptV1 = `
You are a quiz‑answering assistant with expert knowledge in “Customer Service”.  I will give you a JSON array called QUESTIONS.  Each entry is an object:

  • text: the full question text  
  • radios: an array (possibly empty) of { value, label } objects for radio/MCQ or true/false questions  
  • selects: an array (possibly empty) of dropdown definitions; each has:
      – name: the form field name  
      – options: an array of { value, label } for each <option>  

For each question object:
  1. If radios.length > 0, ignore selects and pick the one radio option whose label best answers the question.  
  2. Otherwise (radios.length === 0 and selects.length > 0), for each dropdown in selects choose the option whose label best completes the sentence.  

Produce exactly one JSON array of length QUESTIONS.length.  For each index i:
  - If you answered via radios, output { "radioIndex": N } where N is the 0‑based index into QUESTIONS[i].radios.  
  - If you answered via selects, output { "selectChoices": [c0, c1, …] } where ck is the 0‑based index into QUESTIONS[i].selects[k].options.  

Do not wrap your answer in any code fences or markdown.  Output the raw JSON array only, with no extra text.

Here is the QUESTIONS array:

${JSON.stringify(questions)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: promptV1,
  });

  return JSON.parse(response.text);
}

export { getAnswersFromAI };

const questions = [
  {
    question: "Which of these options are examples of cognitive distortions?",
    options: [
      "Focusing on the positive, All-or-nothing thinking, Catastrophizing",
      "Catastrophizing, All-or-nothing thinking, Should statements",
      "Emotional reasoning, Visualization, Should statements",
      "Logical reasoning, Focusing on the positive, Should statements",
    ],
  },
  {
    question:
      "Besides people, what are the three elements within an organizational environment that make an organization customer-centric?",
    options: [
      "Empowerment, ownership, and commitment",
      "Communication, ownership, and commitment",
      "Empathy, commitment, and empowerment",
      "Empowerment, communication, and ownership",
    ],
  },
];

const testCourseName = "Customer Service";
// getAnswersFromAI(testCourseName, JSON.stringify(questions));
