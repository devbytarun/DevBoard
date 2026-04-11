require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    if (!req.body?.message) return res.status(400).json({ reply: "message is required" });
    const r = await client.responses.create({ model: "gpt-4o-mini", input: req.body.message });
    res.json({ reply: r.output_text || "No reply" });
  } catch {
    res.status(500).json({ reply: "Failed to generate reply" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
