/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ConstructIQ – Express API proxy server for NVIDIA NIM & Gemini AI integration.
 * Exposes POST /api/copilot for AI Copilot chat completions.
 */

import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '1mb' }));

// Serve Vite-built frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const PORT = process.env.PORT || 3001;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const allowedRoles = new Set(['ProjectManager', 'SiteSupervisor', 'FinanceManager', 'Executive', 'SafetyOfficer']);
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 12;
const requestHistory = new Map<string, number[]>();

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

function validateCopilotRequest(body: unknown): { query: string; context: any; userRole: string } | null {
  if (!isRecord(body) || typeof body.query !== 'string' || body.query.trim().length === 0 || body.query.length > 2_000) {
    return null;
  }
  if (!isRecord(body.context) || !Array.isArray(body.context.tasks) || !Array.isArray(body.context.invoices) || !Array.isArray(body.context.incidents)) {
    return null;
  }
  if (body.context.tasks.length > 100 || body.context.invoices.length > 100 || body.context.incidents.length > 100) {
    return null;
  }
  if (!isRecord(body.context.weather) || typeof body.context.weather.condition !== 'string') {
    return null;
  }
  const userRole = typeof body.userRole === 'string' && allowedRoles.has(body.userRole)
    ? body.userRole
    : null;
  return userRole ? { query: body.query.trim(), context: body.context, userRole } : null;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestHistory.get(ip) ?? []).filter(timestamp => now - timestamp < rateLimitWindowMs);
  recent.push(now);
  requestHistory.set(ip, recent);
  return recent.length > rateLimitMaxRequests;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// --- POST /api/copilot ---
app.post('/api/copilot', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  }

  if (!NVIDIA_API_KEY && !GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI service is not configured.' });
  }

  const validated = validateCopilotRequest(req.body);
  if (!validated) {
    return res.status(400).json({ error: 'Invalid request.' });
  }
  const { query, context, userRole } = validated;

  try {
    // Build a rich project summary for the system prompt
    const avgProgress = Math.round(
      context.tasks.reduce((a: number, b: any) => a + b.progress, 0) / Math.max(context.tasks.length, 1)
    );
    const totalSpent = context.invoices
      .filter((i: any) => i.status === 'Paid' || i.status === 'Approved')
      .reduce((a: number, b: any) => a + b.amount, 0);
    const openIncidents = context.incidents.filter((i: any) => i.status !== 'Resolved');
    const criticalTasks = context.tasks.filter((t: any) => t.priority === 'Critical');
    const delayedTasks = context.tasks.filter((t: any) => t.status === 'Delayed');

    const systemPrompt = `You are ConstructIQ Copilot, an expert AI construction project intelligence assistant.
You have live telemetry access to a simulated mixed-use commercial tower project.

## Live Site Data (Real-time Telemetry):
- **Overall Progress:** ${avgProgress}% physical completion
- **Total Budget:** Use the configured simulated project baseline.
- **Spent/Approved:** ₹${totalSpent.toLocaleString('en-IN')} (${((totalSpent / 125000000) * 100).toFixed(1)}% of budget)
- **CPI:** ${((125000000 * 0.714) / Math.max(totalSpent, 1)).toFixed(2) || '1.08'} (Cost Performance Index)
- **Active Tasks:** ${context.tasks.filter((t: any) => t.status === 'In Progress').length}/${context.tasks.length} tasks running
- **Critical Path Tasks:** ${criticalTasks.map((t: any) => `${t.name} (${t.progress}%)`).join(', ') || 'None'}
- **Delayed Tasks:** ${delayedTasks.length === 0 ? 'None' : delayedTasks.map((t: any) => t.name).join(', ')}
- **Open Safety Incidents:** ${openIncidents.length} (${openIncidents.map((i: any) => i.type).join(', ') || 'None'})
- **Safety Days Streak:** Use the simulated safety streak.
- **Weather:** ${context.weather.condition}, ${context.weather.temp}°F, Wind ${context.weather.wind}mph, Humidity ${context.weather.humidity}%
- **Active Personnel:** 42 subcontractors on site
- **Current User Role:** ${userRole}

## Task Status Detail:
${context.tasks.map((t: any) => `- ${t.name}: ${t.progress}% [${t.status}] - Crew: ${t.assignedCrew}`).join('\n')}

## Recent Invoice Summary:
- Pending Approvals: ${context.invoices.filter((i: any) => i.status === 'Pending').length} invoices totaling ₹${context.invoices.filter((i: any) => i.status === 'Pending').reduce((a: number, b: any) => a + b.amount, 0).toLocaleString('en-IN')}

## Your Role:
Provide expert, concise, actionable intelligence tailored to the ${userRole}'s responsibilities.
Format responses with clear markdown headers (###), bullet points, and **bold** for critical data.
Use INR (₹) for all financial figures. Be precise, professional, and site-focused.
When relevant, include specific recommendations with measurable outcomes.`;

    // 1. Try NVIDIA NIM (Meta Llama 3.2 on accelerated compute)
    if (NVIDIA_API_KEY) {
      const nvidiaResp = await fetchWithTimeout('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          temperature: 0.4,
          max_tokens: 800
        })
      });

      if (nvidiaResp.ok) {
        const data = await nvidiaResp.json();
        const text = data.choices?.[0]?.message?.content ?? 'No response returned from NVIDIA AI.';
        return res.json({ text, model: NVIDIA_MODEL, provider: 'NVIDIA NIM' });
      } else {
        const errData = await nvidiaResp.json().catch(() => ({}));
        console.warn('[Copilot Server] NVIDIA API error, attempting fallback...', errData);
      }
    }

    // 2. Fallback to Gemini if configured
    if (GEMINI_API_KEY) {
      const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: query }] }],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 800,
          temperature: 0.4,
        },
      });

      const text = response.text ?? 'Unable to generate a response at this time.';
      return res.json({ text, model: 'gemini-2.0-flash', provider: 'Google Gemini' });
    }

    return res.status(502).json({ error: 'AI provider failed to generate a response.' });
  } catch (err: any) {
    console.error('[Copilot API Error]', err?.message || err);
    return res.status(502).json({ error: 'AI service temporarily unavailable.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    aiAvailable: Boolean(NVIDIA_API_KEY || GEMINI_API_KEY)
  });
});

// Fallback: serve SPA for all other routes (production only)
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Not found');
  });
});

app.listen(PORT, () => {
  console.log(`[ConstructIQ Server] Running on port ${PORT}`);
  if (NVIDIA_API_KEY) {
    console.log(`[ConstructIQ Server] AI Engine: NVIDIA NIM (${NVIDIA_MODEL})`);
  } else if (GEMINI_API_KEY) {
    console.log('[ConstructIQ Server] AI Engine: Google Gemini');
  } else {
    console.warn('[ConstructIQ Server] WARNING: No AI API key set. AI Copilot will use fallback mode.');
  }
});

export default app;
