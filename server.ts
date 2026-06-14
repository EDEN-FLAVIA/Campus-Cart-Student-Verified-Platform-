import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import Tesseract from "tesseract.js";

// Load local environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with generous limit
app.use(express.json({ limit: "10mb" }));

// Initialize the Google Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper function to resolve supported Gemini image MIME types
function getSupportedMimeType(mimeType: string, url: string = ""): string {
  const normalized = (mimeType || "").toLowerCase().trim();
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (allowed.includes(normalized)) {
    return normalized;
  }
  // Try mapping common variations
  if (normalized === "image/jpg") return "image/jpeg";
  
  // Try to determine from URL file extension if available
  try {
    const extMatch = url.split("?")[0].split("#")[0].match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      const ext = extMatch[1].toLowerCase();
      if (ext === "png") return "image/png";
      if (ext === "webp") return "image/webp";
      if (ext === "heic") return "image/heic";
      if (ext === "heif") return "image/heif";
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    }
  } catch (e) {
    // ignore
  }
  return "image/jpeg";
}

// AI Student ID Card parsing endpoint
app.post("/api/analyze-id", async (req, res) => {
  try {
    const { frontImageUrl, backImageUrl, imageUrl } = req.body;
    
    // We can receive a legacy single url as 'imageUrl', otherwise 'frontImageUrl' and 'backImageUrl'
    const imageUrlsToProcess: string[] = [];
    if (frontImageUrl) imageUrlsToProcess.push(frontImageUrl);
    if (backImageUrl) imageUrlsToProcess.push(backImageUrl);
    if (imageUrlsToProcess.length === 0 && imageUrl) {
      imageUrlsToProcess.push(imageUrl);
    }

    if (imageUrlsToProcess.length === 0) {
      return res.status(400).json({ error: "No student ID image URLs provided." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not set." });
    }

    // Fetch, perform OCR on, and read base64 for all provided images
    const modelContentsParts: any[] = [];
    const extractedTexts: string[] = [];
    
    for (const url of imageUrlsToProcess) {
      if (!url) continue;
      try {
        let imageBuffer: Buffer;
        let mimeType = "image/jpeg";
        
        if (url.startsWith("data:")) {
          const match = url.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
          if (match) {
            mimeType = getSupportedMimeType(match[1], url);
            const base64Image = match[2];
            imageBuffer = Buffer.from(base64Image, "base64");
            modelContentsParts.push({
              inlineData: {
                mimeType,
                data: base64Image,
              }
            });
            console.log(`[AI-SCAN] Decoded inline base64 image data URI directly (type: ${mimeType})`);
          } else {
            console.warn(`[AI-SCAN] Data URL is not a valid base64 pattern`);
            continue;
          }
        } else {
          // Normalize relative URLs to absolute InsForge public server URLs
          let fetchUrl = url;
          if (url.startsWith("/")) {
            fetchUrl = `https://pw4dvxp6.ap-southeast.insforge.app${url}`;
          } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
            fetchUrl = `https://pw4dvxp6.ap-southeast.insforge.app/${url}`;
          }

          console.log(`[AI-SCAN] Fetching ID card image from: ${fetchUrl}`);
          const imageRes = await fetch(fetchUrl);
          if (!imageRes.ok) {
            console.warn(`[AI-SCAN] Could not fetch image from: ${fetchUrl}, status: ${imageRes.status}`);
            continue;
          }
          const arrayBuffer = await imageRes.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          const base64Image = imageBuffer.toString("base64");
          
          const rawMimeType = imageRes.headers.get("content-type") || "image/jpeg";
          mimeType = getSupportedMimeType(rawMimeType, fetchUrl);
          
          modelContentsParts.push({
            inlineData: {
              mimeType,
              data: base64Image,
            }
          });
          console.log(`[AI-SCAN] Successfully loaded and base64-encoded: ${fetchUrl} (resolved type: ${mimeType})`);
        }

        // Run Tesseract OCR to convert text inside the ID card to machine-readable format
        console.log(`[AI-SCAN] Running GitHub OCR tool (Tesseract.js) to extract text...`);
        try {
          const ocrResult = await Tesseract.recognize(imageBuffer, 'eng');
          if (ocrResult && ocrResult.data && ocrResult.data.text) {
            const text = ocrResult.data.text;
            console.log(`[AI-SCAN] OCR successful. Extracted ${text.length} characters of raw text.`);
            extractedTexts.push(text);
          } else {
            console.warn(`[AI-SCAN] OCR succeeded but returned no text.`);
          }
        } catch (ocrErr) {
          console.error(`[AI-SCAN] Tesseract OCR failed on this image. Continuing with Gemini multi-modal fallback:`, ocrErr);
        }
      } catch (err) {
        console.error(`[AI-SCAN] Error processing image ${url}:`, err);
      }
    }

    if (modelContentsParts.length === 0) {
      return res.status(400).json({ error: "Failed to load any images from the provided URLs. Please ensure the uploaded files are valid image formats." });
    }

    const mergedOcrText = extractedTexts.join("\n\n---\n\n");

    // Add instructions text part containing the extracted machine-readable OCR text
    modelContentsParts.push({
      text: `You are a high-fidelity Student ID verification AI model.
We have used GitHub's Tesseract OCR tool to convert the text inside the ID card image(s) to machine-readable text first.

Here is the exact machine-readable text extracted by the OCR tool:
----------------------------------------
${mergedOcrText || "(No readable text could be extracted via raw OCR, please rely directly on the multimodality of the image if available)"}
----------------------------------------

Identify the student details from this machine-readable text and cross-reference them with the visual ID images to provide an accurate representation with absolute zero errors.

Extract and output:
1. Student's full name ("detectedName").
2. Official College / School / University Name ("collegeName").
3. Institution's full address, state, or location details ("collegeAddress").
4. Detect the appropriate Student Category ("studentCategory") which MUST be one of:
   - 'Engineering / College' (if they are in a college, university, BTech, BCom, MBA, BSc, etc.)
   - 'PUC / 11th-12th' (if in Pre-University standard, 11th or 12th state/CBSE grade)
   - 'School' (if in school standard 1 to 10)
5. Detected branch / stream / combinations ("branch"):
   - For 'Engineering / College': detect the branch/major (e.g. 'Computer Science & Eng', 'Electronics & Comm', 'Mechanical', 'BCom').
   - For 'PUC / 11th-12th': detect stream/combination (e.g. 'PCMC', 'HEBA', 'Sci-PCMB', 'Commerce').
   - For 'School': return empty or 'General'.
6. Detected semester / standard / class / year ("semesterOrClass"):
   - For 'Engineering / College': detect or suggest current semester (e.g. '3rd Semester', '5th Semester', '1st Year').
   - For 'PUC / 11th-12th': detect or select '1st Year' or '2nd Year'.
   - For 'School': detect standard or grade/class (e.g., '9th Standard', 'Class 10', 'Grade 6').
7. The validity period, academic year range, or expiration year printed on the ID card ("validity"). Examples: '2025-2026', '2026', 'Valid till 2028', '2024-2025'.

Analyze both sides to assemble the most accurate representation! Return structured JSON values.`,
    });

    // Call Gemini 3.5 Flash to parse ID Card details with correct { parts } schema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: modelContentsParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedName: {
              type: Type.STRING,
              description: "The student's full name.",
            },
            collegeName: {
              type: Type.STRING,
              description: "The full formal title of the college, school, academy, or university.",
            },
            collegeAddress: {
              type: Type.STRING,
              description: "The address/location/city of the college or school.",
            },
            studentCategory: {
              type: Type.STRING,
              description: "One of: 'Engineering / College', 'PUC / 11th-12th', 'School'. Determine this based on the ID details.",
            },
            branch: {
              type: Type.STRING,
              description: "Department, stream, combination or branch name.",
            },
            semesterOrClass: {
              type: Type.STRING,
              description: "Current class grade, standard, semester, or academic year.",
            },
            validity: {
              type: Type.STRING,
              description: "The printed academic years, active cycle range, or expiration date/year printed on the ID Card (e.g. '2025-2026', 'valid till 2027', '2024-2025').",
            },
          },
          required: ["detectedName", "collegeName", "collegeAddress", "studentCategory", "branch", "semesterOrClass", "validity"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      return res.status(500).json({ error: "Gemini did not return any readable result." });
    }

    const parsed = JSON.parse(resultText.trim());
    res.json(parsed);

  } catch (error: any) {
    console.error("Error analyzing ID Card images:", error);
    res.status(500).json({ error: error?.message || "An unexpected error occurred inside the AI analysis agent." });
  }
});

// Configure Vite middleware or production build files inside async boot wrapper to avoid CJS top-level await error
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind server for ingress routing
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusCart Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
