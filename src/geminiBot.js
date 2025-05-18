import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAnswersFromAI(courseTitle, questions) {
  const prompt = `You are a helpful assistant for the course ${courseTitle}. Answer MCQ questions in context of ${courseTitle}.
  

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
    You are a quiz‑answering assistant with expert knowledge in '${courseTitle}'. I will give you a JSON array called QUESTIONS. Each entry is an object:
    
    • text: the full question text  
    • radios: an array (possibly empty) of { value, label } objects for radio/MCQ or true/false questions  
    • selects: an array (possibly empty) of dropdown definitions; each has:
        – name: the form field name  
        – options: an array of { value, label } for each <option>  
    
    For each question object:
    1. If radios.length > 0, ignore selects and pick the one radio option whose label best answers the question.  
    2. Otherwise (radios.length === 0 and selects.length > 0), for each dropdown in selects choose the option whose label best completes the sentence.  
    
    Return exactly one answer for each question in the same order.

    Return: array<{ radioIndex?: number, selectChoices?: array<number> }>
    
    Here is the QUESTIONS array:
    
    ${JSON.stringify(questions)}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: promptV1,
  });

  let answers = response.text;

  if (answers?.startsWith("```json")) {
    answers = answers
      .replace(/^```(?:json)?/i, "") // remove opening ```json or ```
      .replace(/```$/, "") // remove closing ```
      .trim();
  }

  console.log("TEXT >> ", answers);

  return JSON.parse(answers);
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
