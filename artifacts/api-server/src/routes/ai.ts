import { Router, type IRouter } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:e4b";

interface DocumentChunk {
  text: string;
  filename: string;
  embedding?: number[];
}

let knowledgeBase: DocumentChunk[] = [];

const upload = multer({ dest: path.join(process.cwd(), "uploads") });

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data.embedding ?? null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function ollamaGenerate(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data: any = await res.json();
  return data.response ?? "";
}

router.get("/ai/status", async (_req, res): Promise<void> => {
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error("not ok");
    const data: any = await r.json();
    const models: string[] = (data.models ?? []).map((m: any) => m.name as string);
    const modelAvailable = models.some((m) => m.startsWith(OLLAMA_MODEL.split(":")[0]));
    res.json({
      online: true,
      model: OLLAMA_MODEL,
      modelAvailable,
      availableModels: models,
      knowledgeChunks: knowledgeBase.length,
    });
  } catch {
    res.json({ online: false, model: OLLAMA_MODEL, modelAvailable: false, knowledgeChunks: knowledgeBase.length });
  }
});

router.post("/ai/generate-proposal", async (req, res): Promise<void> => {
  try {
    const { dealData } = req.body as {
      dealData: {
        name: string;
        clientName: string;
        industryVertical?: string;
        primaryBusinessGoal?: string;
        currentInfrastructure?: string;
        workloadTypes?: string[];
        totalVMs?: number;
        totalPhysicalServers?: number;
        suggestedStrategy?: string;
        complexity?: string;
        estimatedEffortDays?: number;
        estimatedMigrationWeeks?: number;
        costIndicatorMin?: number;
        costIndicatorMax?: number;
      };
    };

    const prompt = `You are a senior Cloud Professional Services consultant.
Write a concise executive summary proposal for the following deal. Use professional language suitable for a CPS leadership team.

Deal: ${dealData.name}
Client: ${dealData.clientName}
Industry: ${dealData.industryVertical || "Not specified"}
Business Goal: ${dealData.primaryBusinessGoal || "Not specified"}
Current Infrastructure: ${dealData.currentInfrastructure || "Not specified"}
Workload Types: ${(dealData.workloadTypes || []).join(", ") || "Not specified"}
Total VMs: ${dealData.totalVMs ?? 0}
Physical Servers: ${dealData.totalPhysicalServers ?? 0}
Recommended Strategy: ${dealData.suggestedStrategy || "TBD"}
Complexity: ${dealData.complexity || "medium"}
Estimated Effort: ${dealData.estimatedEffortDays ?? 0} days (${dealData.estimatedMigrationWeeks ?? 0} weeks)
Indicative Cost Range: $${((dealData.costIndicatorMin ?? 0) / 1000).toFixed(0)}k–$${((dealData.costIndicatorMax ?? 0) / 1000).toFixed(0)}k

Write a structured proposal with: Executive Summary (2-3 sentences), Scope Overview, Recommended Approach, Key Risks & Mitigations, and Indicative Timeline & Investment. Keep it concise — no filler, no generic padding.`;

    const text = await ollamaGenerate(prompt);
    res.json({ proposal: text, model: OLLAMA_MODEL });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Failed to generate proposal via Ollama" });
  }
});

router.post("/ai/upload-knowledge", upload.single("file"), async (req: any, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    fs.unlinkSync(req.file.path);

    const rawChunks = data.text.split(/\n\n+/).filter((c: string) => c.trim().length > 60);
    const newChunks: DocumentChunk[] = [];

    for (const chunk of rawChunks) {
      const trimmed = chunk.trim();
      const embedding = await getEmbedding(trimmed);
      newChunks.push({ text: trimmed, filename: req.file.originalname, embedding: embedding ?? undefined });
    }

    knowledgeBase.push(...newChunks);

    res.json({
      message: "Knowledge base updated",
      chunksAdded: newChunks.length,
      totalChunks: knowledgeBase.length,
    });
  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message || "Failed to process document" });
  }
});

router.post("/ai/ask-brain", async (req, res): Promise<void> => {
  try {
    const { question } = req.body as { question: string };
    if (!question?.trim()) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    let context = "";
    if (knowledgeBase.length > 0) {
      const qEmbed = await getEmbedding(question);
      if (qEmbed && knowledgeBase.some((d) => d.embedding)) {
        const scored = knowledgeBase
          .filter((d) => d.embedding)
          .map((d) => ({ chunk: d, score: cosineSimilarity(qEmbed, d.embedding!) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);
        context = scored.map((s) => s.chunk.text).join("\n---\n");
      } else {
        const kw = question.toLowerCase().split(" ")[0];
        context = knowledgeBase
          .filter((d) => d.text.toLowerCase().includes(kw))
          .slice(0, 3)
          .map((d) => d.text)
          .join("\n---\n");
      }
    }

    const prompt = `You are the Private Presales Brain for the CPS Deal Navigator.
Your role: help the deal-shaping team answer technical and commercial questions about cloud migrations.

${context ? `Context from uploaded documents:\n${context}\n\n` : ""}Question: ${question}

Respond professionally and concisely. If the uploaded context doesn't fully answer the question, draw on your general cloud migration expertise and indicate you are doing so.`;

    const answer = await ollamaGenerate(prompt);
    res.json({ answer, contextUsed: !!context, chunks: knowledgeBase.length });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Failed to query Presales Brain" });
  }
});

router.delete("/ai/knowledge", async (_req, res): Promise<void> => {
  knowledgeBase = [];
  res.json({ message: "Knowledge base cleared", totalChunks: 0 });
});

export default router;
