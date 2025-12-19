import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAnswersFromAI(courseTitle, questions) {
  const prompt = `You are an AI assistant tasked with answering quiz questions from the course: "${courseTitle}".
    
    Your goal is to return a JSON array of answers for a batch of questions. You must follow these rules strictly:
    
    1. Match each answer to the corresponding question using its "id".
    2. Only choose from the "options" or "opts" provided for each question — do NOT invent new IDs or values.
    3. Please return the exact "value" fields from the options given; while answering. PLEASE DO NOT ALTER. And DO NOT mix-up opts labels with values. NEVER return "label" value in the answer.
    4. Return the final output in the specified answer format (see below). Do NOT include explanations or formatting like markdown or extra text.
    5. Don't skip any question, even if there's a question which requires referring to an image or additional information, make the best guess from its given options.
    
    ---
    
    ### Question Format (input to you):
    
    Each question will have the format:
    
    For MCQ and Checkbox types:
    {
      id: "123",
      type: "mcq", // or "checkbox"
      question: "Question text here...",
      options: [
        { value: "option_abc123", label: "Option text" },
        ...
      ]
    }
    
    For Select type:
    {
      id: "456",
      type: "select",
      question: "Question text here...",
      options: [
        {
          name: "select_name_1",
          opts: [
            { value: "111", label: "Option A" },
            { value: "222", label: "Option B" }
          ]
        },
        ...
      ]
    }
    
    ---
    
    ### Your Answer Format (your only output should be this):
    
    [
      {
        id: "123",
        type: "mcq",
        answer: ["option_abc123"] // You may choose more than one for checkbox
      },
      {
        id: "456",
        type: "select",
        answer: [
          { name: "select_name_1", value: "111" }
        ]
      }
    ]
    
    ONLY respond with a valid JSON array as described above. Do not include any markdown or commentary.
    
    ---
    
    ### Questions Batch:
    ${questions}
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  let answers = response.text;

  if (answers?.startsWith("```json")) {
    answers = answers
      .replace(/^```(?:json)?/i, "") // remove opening ```json or ```
      .replace(/```$/, "") // remove closing ```
      .trim();
  }

  return JSON.parse(answers);
}

export { getAnswersFromAI };
