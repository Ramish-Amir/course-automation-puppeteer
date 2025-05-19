import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAnswersFromAI(courseTitle, questions) {
  const prompt =
    `You are an assistant to answer quiz questions for the course: ${courseTitle}.\n` +
    `Provide a JSON array of answers in the following format:\n` +
    `
    General questions example:
    [
        {
        id: "897",
        type: "mcq",
        question: "Lin Dan is known for:",
        options: [
            {
            value: "question_897_answer_3921_label",
            label: "Soccer",
            },
            {
            value: "question_897_answer_3959_label",
            label: "Basketball",
            },
            {
            value: "question_897_answer_8419_label",
            label: "Volleyball",
            },
            {
            value: "question_897_answer_4790_label",
            label: "Badminton",
            },
        ],
        },
        {
        id: "129834712",
        type: "select",
        question:
            "What is Ronaldo known for \n" +
            "[ Select ]\n" +
            "Basketball\n" +
            "Soccer\n" +
            "Badminton\n" +
            "Cricket\n" +
            " .",
        options: [
            {
            name: "question_129834712_asdfasd",
            opts: [
                { value: "31241", label: "Basketball" },
                { value: "464", label: "Soccer" },
                { value: "354", label: "Badminton" },
                { value: "457", label: "Cricket" },
            ],
            },
        ],
        },
    ];


    Sample answers example:
    [
    // For MCQ or all other types (such as checkbox)
    {
        id: "897",
        type: "mcq", 
        answer: ["question_897_answer_4790_label"],
    },

    // For Select type
    {
        id: "5040305",
        type: "select",
        answer: [ { name: 'question_129834712_asdfasd', value: '464' } ],
    },
    ]


    ` +
    `${questions}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
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
