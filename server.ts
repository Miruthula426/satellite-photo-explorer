import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true, limit: "35mb" }));

// Lazy Google Gen AI helper
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper: Format error message cleanly for the client
function cleanErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";
  const raw = error.message || String(error);
  if (
    raw.includes("503") ||
    raw.includes("high demand") ||
    raw.includes("UNAVAILABLE")
  ) {
    return "The planetary AI model is experiencing a temporary surge in traffic. Please retry in a few moments.";
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "API rate limit reached. Please wait a moment before trying again.";
  }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // ignore parse error
  }
  return raw;
}

// Resilient Gemini generateContent with model fallback and exponential backoff
async function generateContentWithRetry(params: {
  contents: any;
  config: any;
  primaryModel?: string;
  fallbackModel?: string;
  maxAttempts?: number;
}) {
  const ai = getGenAI();
  // gemini-3.1-flash-lite is robust, fast, and has dedicated quota availability
  const models = [
    params.primaryModel || "gemini-3.1-flash-lite",
    params.fallbackModel || "gemini-3.8-flash",
  ];
  const maxAttempts = params.maxAttempts || 3;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentModel = models[attempt % models.length];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: params.contents,
        config: params.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(
        `Gemini call attempt ${attempt + 1}/${maxAttempts} failed on ${currentModel}:`,
        errMsg
      );

      const isQuotaError =
        errMsg.includes("429") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("quota");

      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("high demand") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("ECONNRESET") ||
        errMsg.includes("ETIMEDOUT");

      if (attempt < maxAttempts - 1) {
        // If quota is exhausted on one model, switch to the other immediately without delay
        const delay = isQuotaError ? 200 : isTransient ? 1000 * (attempt + 1) : 400;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint: Comprehensive Initial Analysis of the Satellite Photo
app.post("/api/analyze-satellite", async (req, res) => {
  try {
    const { image, userPrompt } = req.body;
    if (!image || !image.data || !image.mimeType) {
      return res.status(400).json({ error: "Missing image data or mimeType" });
    }

    const ai = getGenAI();

    const systemInstruction = `You are an expert planetary scientist, astrophysicist, and NASA/ESA satellite remote sensing specialist. 
The user has provided a satellite photograph taken within the solar system (e.g. orbiters around Mars, Moon, Earth, Venus, Mercury, Jupiter, Saturn, icy moons, or solar observatories).

Your task is to analyze the EXACT satellite photo given by the user:
1. Identify the celestial body (e.g. Mars, Moon, Earth, Jupiter, Europa, Titan, Enceladus, etc.) and specific feature or region captured in this photo.
2. Identify the likely or actual satellite mission, orbiter, or instrument that captures such satellite imagery (e.g., HiRISE on MRO, LROC on LRO, Landsat/Sentinel, JunoCam, Cassini ISS, etc.).
3. Provide a crystal-clear, textbook-level scientific DEFINITION of the primary geological, atmospheric, or astronomical feature/phenomenon shown in this photo.
4. Provide an in-depth scientific breakdown based directly on what is visible in the photo (formation mechanics, visual indicators such as albedo, strata, cratering, fractures, or cloud dynamics, scale, composition).
5. Detail the satellite observation characteristics (spectral band, visible/infrared/radar, resolution, viewing geometry).
6. 4-5 bulleted key scientific facts directly relevant to this image.
7. 4 suggested questions the user can ask next specifically about what is visible in this satellite photo.`;

    const promptText = userPrompt && userPrompt.trim()
      ? `Analyze this specific satellite photo provided by the user, with focus on: "${userPrompt.trim()}". Base your definition and breakdown on the visual features in this image. Return structured JSON.`
      : `Carefully examine the satellite photo provided by the user. Identify the celestial body and feature, give the formal scientific definition of what is shown, and provide detailed geological/atmospheric analysis grounded in the image. Return structured JSON.`;

    const cleanBase64 = image.data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const response = await generateContentWithRetry({
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: image.mimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            celestialBody: {
              type: Type.STRING,
              description: "The planet, moon, asteroid, or star (e.g., Mars, Earth, Europa, Jupiter, The Moon, Sun)",
            },
            featureName: {
              type: Type.STRING,
              description: "The name of the feature or phenomenon (e.g., Jezero Crater Delta, Great Red Spot, Impact Crater Rays, Sahara Eye)",
            },
            satelliteMission: {
              type: Type.STRING,
              description: "The likely satellite, orbiter, probe, or instrument (e.g., Mars Reconnaissance Orbiter HiRISE, Lunar Reconnaissance Orbiter, JunoCam)",
            },
            definition: {
              type: Type.STRING,
              description: "A formal, precise scientific definition of the feature or phenomenon displayed.",
            },
            inDepthDetail: {
              type: Type.STRING,
              description: "Comprehensive scientific details: formation mechanics, physical scale, composition, scientific significance, and atmospheric or geological processes.",
            },
            satelliteImagingDetails: {
              type: Type.STRING,
              description: "Technical observation aspects: imaging spectrum (visible, UV, IR, multispectral), false color vs true color, resolution, orbital vantage.",
            },
            keyFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-5 concise, striking scientific facts about this feature and observation.",
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 relevant questions a user could ask next about this satellite photo.",
            },
          },
          required: [
            "celestialBody",
            "featureName",
            "satelliteMission",
            "definition",
            "inDepthDetail",
            "satelliteImagingDetails",
            "keyFacts",
            "suggestedQuestions",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/analyze-satellite:", error);
    const friendlyMsg = cleanErrorMessage(error);
    const isTransient =
      friendlyMsg.includes("temporary surge") ||
      friendlyMsg.includes("rate limit") ||
      String(error?.message || "").includes("503");
    res.status(isTransient ? 503 : 500).json({
      error: friendlyMsg,
      isTransient,
    });
  }
});

// Endpoint: Interactive Q&A for the Satellite Photo
app.post("/api/ask-question", async (req, res) => {
  try {
    const { image, question, history, featureContext } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Missing question" });
    }

    const ai = getGenAI();

    const systemInstruction = `You are an expert planetary scientist, astrophysicist, and satellite remote sensing specialist.
The user has provided a satellite photograph taken in the solar system.
The user is asking a question about what is shown in this specific photograph.

CRITICAL INSTRUCTIONS:
1. You MUST answer the user's question directly based on the provided satellite image. Look closely at the visual elements in the photo (structures, coloration, shadows, impact rims, layering, erosion channels, clouds, lighting, rings, or surface textures).
2. 'definition': Provide an authoritative, crystal-clear scientific definition of the feature, structure, or scientific concept asked about in the question, contextualized to what is shown in this satellite photo.
3. 'detailedExplanation': Give a comprehensive, structured scientific explanation answering their question thoroughly based on the image. Explicitly describe how the features appear in this specific photo and explain the underlying physical, geological, or atmospheric processes.
4. 'satelliteContext': Explain how the satellite's sensors/cameras (e.g., optical focal plane, radar altimetry, thermal infrared, multispectral filters) detected or imaged this phenomenon in space.
5. 'followUpQuestions': Suggest 3 thoughtful follow-up questions directly related to what is visible in this satellite photo.`;

    const parts: any[] = [];

    // Attach image part if provided
    if (image && image.data && image.mimeType) {
      const cleanBase64 = image.data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: cleanBase64,
        },
      });
    }

    let promptContext = `User Question: "${question.trim()}"\n`;
    if (featureContext) {
      promptContext += `Known Context from initial analysis: Body: ${featureContext.celestialBody || "Unknown"}, Feature: ${featureContext.featureName || "Unknown"}, Satellite: ${featureContext.satelliteMission || "Unknown"}.\n`;
    }
    if (history && Array.isArray(history) && history.length > 0) {
      const priorHistoryStr = history
        .slice(-6)
        .map((h: { role: string; text: string }) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
        .join("\n");
      promptContext += `\nPrior Discussion:\n${priorHistoryStr}\n`;
    }
    promptContext += `\nPlease deliver a comprehensive definition and detail in JSON format matching the schema.`;

    parts.push({ text: promptContext });

    const response = await generateContentWithRetry({
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: {
              type: Type.STRING,
              description: "The exact, clear definition answering what the user asked about this satellite image.",
            },
            detailedExplanation: {
              type: Type.STRING,
              description: "Detailed scientific explanation and breakdown referencing visible photo features, processes, and implications.",
            },
            satelliteContext: {
              type: Type.STRING,
              description: "Remote sensing details: how satellite instruments image, measure, or analyze this phenomenon.",
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 intelligent follow-up questions relevant to this topic and photo.",
            },
          },
          required: ["definition", "detailedExplanation", "satelliteContext", "followUpQuestions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/ask-question:", error);
    const friendlyMsg = cleanErrorMessage(error);
    const isTransient =
      friendlyMsg.includes("temporary surge") ||
      friendlyMsg.includes("rate limit") ||
      String(error?.message || "").includes("503");
    res.status(isTransient ? 503 : 500).json({
      error: friendlyMsg,
      isTransient,
    });
  }
});

// Vite Middleware for development vs Static Production Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Satellite Explorer server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
