const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");

const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Gemini Setup
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

// Upload folder
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Home Route
app.get("/", (req, res) => {
  res.send("SnapSolve AI Backend Running 🚀");
});

// Solve Route
app.post("/solve", upload.single("image"), async (req, res) => {

  try {

    const language = req.body.language || "English";

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Read image
    const imageBuffer = fs.readFileSync(req.file.path);

    const base64Image = imageBuffer.toString("base64");

    // Prompt
    const prompt = `
Analyze this educational image carefully.

Rules:
- Solve all questions properly
- Explain every diagram clearly
- Solve maths step-by-step
- Explain science answers clearly
- Explain graphs/charts/tables
- Support school students
- Classes: 9th, 10th, 11th, 12th
- Give neat educational answers
- Answer language: ${language}

Supported Languages:
- English
- Hindi
- Marathi
`;

    // Gemini Request
    const result = await model.generateContent([

      prompt,

      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Image,
        },
      },

    ]);

    const response = await result.response;

    const answer = response.text();

    // Delete uploaded image
    fs.unlinkSync(req.file.path);

    // Send answer
    res.json({
      success: true,
      answer,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "AI solving failed",
      error: error.message,
    });

  }

});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
