import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';

// Load environment variables (.env file for local testing, GitHub Secrets for CI)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Example schema for the prompt
 */
const EXAMPLE_SCHEMA = {
  resortId: "bay-lake-tower",
  year: 2026,
  travelPeriods: [
    {
      id: "period-1",
      name: "Travel Period 1",
      dateRanges: [
        { start: "2026-09-01", end: "2026-09-30" }
      ]
    }
  ],
  pointChart: [
    {
      roomTypeId: "studio-standard",
      seasons: {
        "period-1": { weekday: 14, weekend: 17 }
      }
    }
  ]
};

/**
 * Downloads and parses a PDF from a URL
 */
async function fetchAndParsePDF(url) {
  console.log(`Downloading PDF from ${url}...`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`Parsing PDF...`);
  const data = await pdfParse(buffer);
  
  return data.text;
}

/**
 * Extracts point chart data using Gemini 2.5 Flash
 */
async function extractDataWithAI(pdfText, resortName, year) {
  console.log(`Extracting data for ${resortName} (${year}) using Gemini...`);
  
  const prompt = `
You are an expert data extraction bot. I am providing you with the raw text parsed from a Disney Vacation Club (DVC) Point Chart PDF for the resort "${resortName}" for the year ${year}.

Your goal is to parse this unstructured text into a strict JSON object that matches my application's schema.

Here is the exact JSON structure you MUST output:
${JSON.stringify(EXAMPLE_SCHEMA, null, 2)}

Rules:
1. "resortId" must be the kebab-case version of the resort name (e.g., "bay-lake-tower").
2. "year" must be ${year}.
3. "travelPeriods" contains the date ranges for each season. The "id" MUST be "period-1", "period-2", etc. Dates must be in YYYY-MM-DD format.
4. "pointChart" contains the point requirements. 
5. "roomTypeId" should be descriptive (e.g., "studio-standard", "1br-lake").
6. The "seasons" object maps the travel period ID (e.g., "period-1") to the weekday and weekend point costs.
7. Return ONLY valid JSON. Do not include markdown formatting or backticks.

Raw PDF Text:
${pdfText}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.1 // Low temperature for factual data extraction
    }
  });

  try {
    const jsonText = response.text;
    const parsedData = JSON.parse(jsonText);
    return parsedData;
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON:");
    console.log(response.text);
    throw err;
  }
}

/**
 * Main execution function
 */
async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY environment variable is required.");
    process.exit(1);
  }

  // In a real scenario, this would be a list of official Disney PDF URLs.
  // For demonstration, we'll configure a mock URL or local file fallback.
  const targetYear = 2026;
  
  const resortsToScrape = [
    {
      id: 'bay-lake-tower',
      name: 'Bay Lake Tower',
      // We use a dummy URL for the example. In production, provide the real DVC URL.
      url: 'https://cdn1.parksmedia.wdprapps.disney.com/media/dvc/catalog/resorts/dvc-resorts/point-charts/2024-BLT.pdf' 
    }
  ];

  const dataDir = path.resolve(__dirname, '../../src/data/points');

  for (const resort of resortsToScrape) {
    try {
      // 1. Fetch & Parse PDF
      const pdfText = await fetchAndParsePDF(resort.url);
      
      // 2. Extract Data with AI
      const jsonData = await extractDataWithAI(pdfText, resort.name, targetYear);
      
      // 3. Save Output
      const fileName = `${resort.id}-${targetYear}.json`;
      const filePath = path.join(dataDir, fileName);
      
      await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
      console.log(`✅ Successfully saved ${fileName}`);
      
    } catch (err) {
      console.error(`❌ Failed to process ${resort.name}: ${err.message}`);
    }
  }
}

main();
