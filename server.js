import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.AIzaSyDOSbyjPZ-VFu9xqriR5d9bGJi9ZkLwjac);

app.get("/",(req,res)=>{
  res.send("backend working")
})

app.post("/analyze", async (req, res) => {
  console.log("REQUEST RECEIVED");
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
Return ONLY valid JSON. No backticks. No explanation.

Required JSON structure:

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

Improve this resume but KEEP the same JSON format:

${JSON.stringify(
  { personalInfo, education, skills, projects, experience, certifications },
  null,
  2
)}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let result = await model.generateContent(prompt);

    if (!result || !result.response) {
      console.log("❌ Gemini returned empty response. Using fallback.");
      return res.json({
        personalInfo,
        education,
        skills,
        projects,
        experience,
        certifications
      });
    }

    let text = result.response.text();
    console.log("RAW GEMINI OUTPUT:", text);

  
    let clean = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      console.log("❌ JSON PARSE FAILED — using fallback");
      parsed = {
        personalInfo,
        education,
        skills,
        projects,
        experience,
        certifications
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(200).json({
      message: "AI failed, returning fallback",
      personalInfo: req.body.personalInfo,
      education: req.body.education,
      skills: req.body.skills,
      projects: req.body.projects,
      experience: req.body.experience,
      certifications: req.body.certifications
    });
  }
});

const PORT = process.env.PORT || 8138;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


