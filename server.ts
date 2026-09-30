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
app.use(express.json({ limit: '1mb' }));

// Serve Vite-built frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const PORT = process.env.PORT || 3001;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- POST /api/copilot ---
app.post('/api/copilot', async (req, res) => {
  if (!NVIDIA_API_KEY && !GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'No AI API key configured. Set NVIDIA_API_KEY or GEMINI_API_KEY in .env.'
    });
  }

  const { query, context, userRole } = req.body as {
    query: string;
    context: {
      tasks: any[];
      invoices: any[];
      incidents: any[];
      weather: {
        temp: number;
        condition: string;
        wind: number;
        humidity: number;
        forecast: string;
      };
    };
    userRole: string;
  };

  if (!query || !context) {
    return res.status(400).json({ error: 'Missing query or context.' });
  }

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
      const nvidiaResp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
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
    return res.status(500).json({ error: err?.message || 'Internal server error.' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiProvider: NVIDIA_API_KEY ? 'NVIDIA NIM' : GEMINI_API_KEY ? 'Google Gemini' : 'None',
    model: NVIDIA_API_KEY ? NVIDIA_MODEL : GEMINI_API_KEY ? 'gemini-2.0-flash' : 'None'
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
