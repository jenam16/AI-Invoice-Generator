import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const aiInvoiceRouter = express.Router();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is missing in .env");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];



// Build Invoice Prompt


function buildInvoicePrompt(promptText) {
  const invoiceTemplate = {
    invoiceNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",

    fromBusinessName: "",
    fromEmail: "",
    fromAddress: "",
    fromPhone: "",

    client: {
      name: "",
      email: "",
      address: "",
      phone: "",
    },

    items: [
      {
        id: "1",
        description: "",
        qty: 1,
        unitPrice: 0,
      },
    ],

    taxPercent: 18,
    notes: "",
  };

  return `
You are an invoice generation assistant.

Analyze the user's input and generate an invoice JSON object.

IMPORTANT RULES:
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT use code fences.
- Do NOT add explanations.
- Include ALL fields from the schema.
- Dates must use YYYY-MM-DD format.
- qty, unitPrice and taxPercent must be numbers.
- If information is missing, use an empty string or appropriate default value.
- items must always be an array.

Invoice schema:

${JSON.stringify(invoiceTemplate, null, 2)}

User input:
${promptText}

Return ONLY the JSON object.
`;
}



// Generate content using Gemini


async function tryGenerateWithModel(modelName, prompt) {
  if (!ai) {
    throw new Error("Gemini API is not configured");
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,

    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response?.text;

  if (!text || !text.trim()) {
    throw new Error("Empty response returned from Gemini");
  }

  return {
    text: text.trim(),
    modelName,
  };
}



// POST /generate


aiInvoiceRouter.post("/generate", async (req, res) => {
  try {
    // Check API key
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: missing Gemini API key",
      });
    }

    // Check request body
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt text is required",
      });
    }

    // Build prompt
    const fullPrompt = buildInvoicePrompt(prompt.trim());

    let lastErr = null;
    let lastText = null;
    let usedModel = null;

    // Try models one by one
    for (const modelName of MODEL_CANDIDATES) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);

        const result = await tryGenerateWithModel(
          modelName,
          fullPrompt
        );

        lastText = result.text;
        usedModel = result.modelName;

        if (lastText) {
          break;
        }
      } catch (err) {
        console.warn(
          `Model ${modelName} failed:`,
          err?.message || err
        );

        lastErr = err;
      }
    }

    // If all models failed
    if (!lastText) {
      const errorMessage =
        lastErr?.message ||
        "All Gemini models failed. Check API key, network, or model availability.";

      console.error(
        "AI generation failed:",
        errorMessage
      );

      return res.status(502).json({
        success: false,
        message: "AI generation failed",
        detail: errorMessage,
      });
    }

    
    // Parse JSON
    

    let data;

    try {
      // First try direct JSON parsing
      data = JSON.parse(lastText);
    } catch (directParseError) {
      console.warn(
        "Direct JSON parsing failed. Trying to extract JSON..."
      );

      // Extract JSON object from response
      const firstBrace = lastText.indexOf("{");
      const lastBrace = lastText.lastIndexOf("}");

      if (
        firstBrace === -1 ||
        lastBrace === -1 ||
        lastBrace <= firstBrace
      ) {
        console.error(
          "Gemini response does not contain valid JSON:",
          lastText
        );

        return res.status(502).json({
          success: false,
          message: "AI returned malformed response",
          raw: lastText,
          model: usedModel,
        });
      }

      const jsonText = lastText.slice(
        firstBrace,
        lastBrace + 1
      );

      try {
        data = JSON.parse(jsonText);
      } catch (parseError) {
        console.error(
          "Failed to parse extracted JSON:",
          parseError
        );

        return res.status(502).json({
          success: false,
          message: "AI returned invalid JSON",
          model: usedModel,
          raw: lastText,
        });
      }
    }

    
    // Success
    

    return res.status(200).json({
      success: true,
      model: usedModel,
      data,
    });

  } catch (err) {
    console.error(
      "AI invoice generation error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "AI invoice generation failed",
      detail: err?.message || String(err),
    });
  }
});


export default aiInvoiceRouter;