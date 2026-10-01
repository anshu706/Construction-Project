// server.ts
import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use(express.json({ limit: "1mb" }));
var distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
var PORT = process.env.PORT || 3001;
var NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
var NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";
var GEMINI_API_KEY = process.env.GEMINI_API_KEY;
var allowedRoles = /* @__PURE__ */ new Set(["ProjectManager", "SiteSupervisor", "FinanceManager", "Executive", "SafetyOfficer"]);
var rateLimitWindowMs = 6e4;
var rateLimitMaxRequests = 12;
var requestHistory = /* @__PURE__ */ new Map();
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function validateCopilotRequest(body) {
  if (!isRecord(body) || typeof body.query !== "string" || body.query.trim().length === 0 || body.query.length > 2e3) {
    return null;
  }
  if (!isRecord(body.context) || !Array.isArray(body.context.tasks) || !Array.isArray(body.context.invoices) || !Array.isArray(body.context.incidents)) {
    return null;
  }
  if (body.context.tasks.length > 100 || body.context.invoices.length > 100 || body.context.incidents.length > 100) {
    return null;
  }
  if (!isRecord(body.context.weather) || typeof body.context.weather.condition !== "string") {
    return null;
  }
  const userRole = typeof body.userRole === "string" && allowedRoles.has(body.userRole) ? body.userRole : null;
  return userRole ? { query: body.query.trim(), context: body.context, userRole } : null;
}
function isRateLimited(ip) {
  const now = Date.now();
  const recent = (requestHistory.get(ip) ?? []).filter((timestamp) => now - timestamp < rateLimitWindowMs);
  recent.push(now);
  requestHistory.set(ip, recent);
  return recent.length > rateLimitMaxRequests;
}
async function fetchWithTimeout(input, init, timeoutMs = 2e4) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
app.post("/api/copilot", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "Too many requests. Please try again shortly." });
  }
  if (!NVIDIA_API_KEY && !GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI service is not configured." });
  }
  const validated = validateCopilotRequest(req.body);
  if (!validated) {
    return res.status(400).json({ error: "Invalid request." });
  }
  const { query, context, userRole } = validated;
  try {
    const avgProgress = Math.round(
      context.tasks.reduce((a, b) => a + b.progress, 0) / Math.max(context.tasks.length, 1)
    );
    const totalSpent = context.invoices.filter((i) => i.status === "Paid" || i.status === "Approved").reduce((a, b) => a + b.amount, 0);
    const openIncidents = context.incidents.filter((i) => i.status !== "Resolved");
    const criticalTasks = context.tasks.filter((t) => t.priority === "Critical");
    const delayedTasks = context.tasks.filter((t) => t.status === "Delayed");
    const systemPrompt = `You are ConstructIQ Copilot, an expert AI construction project intelligence assistant.
You have live telemetry access to a simulated mixed-use commercial tower project.

## Live Site Data (Real-time Telemetry):
- **Overall Progress:** ${avgProgress}% physical completion
- **Total Budget:** Use the configured simulated project baseline.
- **Spent/Approved:** \u20B9${totalSpent.toLocaleString("en-IN")} (${(totalSpent / 125e6 * 100).toFixed(1)}% of budget)
- **CPI:** ${(125e6 * 0.714 / Math.max(totalSpent, 1)).toFixed(2) || "1.08"} (Cost Performance Index)
- **Active Tasks:** ${context.tasks.filter((t) => t.status === "In Progress").length}/${context.tasks.length} tasks running
- **Critical Path Tasks:** ${criticalTasks.map((t) => `${t.name} (${t.progress}%)`).join(", ") || "None"}
- **Delayed Tasks:** ${delayedTasks.length === 0 ? "None" : delayedTasks.map((t) => t.name).join(", ")}
- **Open Safety Incidents:** ${openIncidents.length} (${openIncidents.map((i) => i.type).join(", ") || "None"})
- **Safety Days Streak:** Use the simulated safety streak.
- **Weather:** ${context.weather.condition}, ${context.weather.temp}\xB0F, Wind ${context.weather.wind}mph, Humidity ${context.weather.humidity}%
- **Active Personnel:** 42 subcontractors on site
- **Current User Role:** ${userRole}

## Task Status Detail:
${context.tasks.map((t) => `- ${t.name}: ${t.progress}% [${t.status}] - Crew: ${t.assignedCrew}`).join("\n")}

## Recent Invoice Summary:
- Pending Approvals: ${context.invoices.filter((i) => i.status === "Pending").length} invoices totaling \u20B9${context.invoices.filter((i) => i.status === "Pending").reduce((a, b) => a + b.amount, 0).toLocaleString("en-IN")}

## Your Role:
Provide expert, concise, actionable intelligence tailored to the ${userRole}'s responsibilities.
Format responses with clear markdown headers (###), bullet points, and **bold** for critical data.
Use INR (\u20B9) for all financial figures. Be precise, professional, and site-focused.
When relevant, include specific recommendations with measurable outcomes.`;
    if (NVIDIA_API_KEY) {
      const nvidiaResp = await fetchWithTimeout("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.4,
          max_tokens: 800
        })
      });
      if (nvidiaResp.ok) {
        const data = await nvidiaResp.json();
        const text = data.choices?.[0]?.message?.content ?? "No response returned from NVIDIA AI.";
        return res.json({ text, model: NVIDIA_MODEL, provider: "NVIDIA NIM" });
      } else {
        const errData = await nvidiaResp.json().catch(() => ({}));
        console.warn("[Copilot Server] NVIDIA API error, attempting fallback...", errData);
      }
    }
    if (GEMINI_API_KEY) {
      const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await genai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: query }] }],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 800,
          temperature: 0.4
        }
      });
      const text = response.text ?? "Unable to generate a response at this time.";
      return res.json({ text, model: "gemini-2.0-flash", provider: "Google Gemini" });
    }
    return res.status(502).json({ error: "AI provider failed to generate a response." });
  } catch (err) {
    console.error("[Copilot API Error]", err?.message || err);
    return res.status(502).json({ error: "AI service temporarily unavailable." });
  }
});
app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    status: "ok",
    aiAvailable: Boolean(NVIDIA_API_KEY || GEMINI_API_KEY)
  });
});
app.get("*", (_req, res) => {
  const indexPath = path.join(distPath, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send("Not found");
  });
});
app.listen(PORT, () => {
  console.log(`[ConstructIQ Server] Running on port ${PORT}`);
  if (NVIDIA_API_KEY) {
    console.log(`[ConstructIQ Server] AI Engine: NVIDIA NIM (${NVIDIA_MODEL})`);
  } else if (GEMINI_API_KEY) {
    console.log("[ConstructIQ Server] AI Engine: Google Gemini");
  } else {
    console.warn("[ConstructIQ Server] WARNING: No AI API key set. AI Copilot will use fallback mode.");
  }
});
var server_default = app;
export {
  server_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ConstructIQ – Express API proxy server for NVIDIA NIM & Gemini AI integration.
 * Exposes POST /api/copilot for AI Copilot chat completions.
 */
