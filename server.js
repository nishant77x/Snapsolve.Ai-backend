const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const axios = require("axios");
const fs = require("fs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

// Home route
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
- Solve all questions properly.
- If there is a diagram, explain every part.
- If there is math, solve step-by-step.
- If there is science, explain clearly.
- If there is graph/chart/figure, explain it.
- Give clean educational answer.
- Language should be: ${language}

Supported Languages:
- English
- Hindi
- Marathi
`;

    // DeepSeek API Request
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-vision",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const answer = response.data.choices[0].message.content;

    // Delete uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "AI solving failed",
      error: error.response?.data || error.message,
    });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
