import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

//  INIT GEMINI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//  ROOT
app.get("/", (req, res) => {
  res.send("backend working");
});

//  TEST AI (VERY IMPORTANT)
app.get("/test-ai", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const result = await model.generateContent("Say hello");

    const text = result.response.text();

    console.log("AI TEST:", text);

    res.send(text);
  } catch (err) {
    console.error("❌ TEST ERROR:", err);
    res.send("AI TEST FAILED");
  }
});

//  ANALYZE ROUTE
app.post("/analyze", async (req, res) => {
  console.log("🔥 BACKEND HIT");
  console.log("DATA:", req.body);

  try {
    const {
      personalInfo = {},
      education = [],
      skills = {},
      projects = [],
      experience = {},
      certifications = []
    } = req.body;

    const prompt = `
Return ONLY valid JSON.
No markdown.
No backticks.
No explanation.

FORMAT:
{
  "personalInfo": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "github": "",
    "linkedin": "",
    "summary": ""
  },
  "education": [],
  "skills": {
    "technical": [],
    "soft": [],
    "tools": []
  },
  "projects": [],
  "experience": {},
  "certifications": []
}

Improve this resume:

${JSON.stringify(
      { personalInfo, education, skills, projects, experience, certifications },
      null,
      2
    )}
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

     const result = await model.generateContent(prompt);

    if (!result || !result.response) {
      throw new Error("No response from Gemini");
    }

    let text = result.response.text();

    console.log("🧠 RAW AI:", text);

    let clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      console.log("❌ JSON PARSE FAILED");

      return res.json({
        message: "AI returned invalid JSON",
        ...req.body
      });
    }

    res.json(parsed);

  } catch (err) {
    console.error("❌ FINAL ERROR:", err);

    res.json({
      message: "AI failed, returning fallback",
      ...req.body
    });
  }
});

// START SERVER
const PORT = 8138;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});