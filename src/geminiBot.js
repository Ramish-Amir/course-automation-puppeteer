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

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  console.log("TEXT >> ", response.text);

  const answers = response.text.split(",").map((ans) => parseInt(ans.trim()));
  console.log("Splitted >>> ", answers);

  //   const testArray = ["BMW", "Mercedes", "Audi", "Toyota"];

  //   for (const ans of answers) {
  //     console.log(testArray[ans]);
  //   }

  return answers;
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
