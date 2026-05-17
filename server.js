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
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Upload folder
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Home Route
app.get("/", (req, res) => {
  res.send("SnapSolve AI Backend Running 🚀");
});

// Solve Route
app.post("/solve", upload.single("image"), async (req, res) => {

  let filePath = null;

  try {
    const language = req.body.language || "English";

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    filePath = req.file.path;

    // Read image
    const imageBuffer = fs.readFileSync(filePath);
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

    // ✅ Fixed Gemini call
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: req.file.mimetype,
          data: base64Image,
        },
      },
    ]);

    // ✅ Fixed response extraction
    const answer = result.response.text();

    // Delete uploaded image
    fs.unlinkSync(filePath);

    res.json({ success: true, answer });

  } catch (error) {

    console.error("Gemini Error:", error);

    // ✅ Always clean up file on error too
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

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
