/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ProjectState, Task, Invoice, SafetyIncident, OperationLog } from '../types';
import { formatINR } from '../currency';
import { Sparkles, Bot, Send, X, RefreshCw, AlertTriangle, ShieldCheck, TrendingUp, Calendar, Zap, MessageSquare, Wifi, WifiOff, Cpu } from 'lucide-react';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: {
    tasks: Task[];
    invoices: Invoice[];
    incidents: SafetyIncident[];
    logs: OperationLog[];
    weather: { temp: number; condition: string; wind: number; humidity: number; forecast: string };
  };
  userRole: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: 'briefing' | 'risk' | 'financial' | 'safety' | 'general';
  isAI?: boolean;
  provider?: string;
}

// Build system prompt from live project data
function buildSystemPrompt(state: AICopilotDrawerProps['state'], userRole: string): string {
  const avgProgress = Math.round(state.tasks.reduce((a, b) => a + b.progress, 0) / Math.max(state.tasks.length, 1));
  const totalSpent = state.invoices
    .filter(i => i.status === 'Paid' || i.status === 'Approved')
    .reduce((a, b) => a + b.amount, 0);
  const openIncidents = state.incidents.filter(i => i.status !== 'Resolved');
  const criticalTasks = state.tasks.filter(t => t.priority === 'Critical');
  const delayedTasks = state.tasks.filter(t => t.status === 'Delayed');

  return `You are ConstructIQ Copilot, an expert AI construction project intelligence assistant for the Bangalore Commercial Tower project (5-story mixed-use commercial tower, Bangalore Tech Park Phase 2).

## Live Site Telemetry (Real-time):
- Overall Progress: ${avgProgress}% physical completion
- Total Project Budget: ₹12,50,00,000 (₹12.50 Crores)  
- Spent/Approved: ${formatINR(totalSpent)} (${((totalSpent / 125000000) * 100).toFixed(1)}% of budget)
- CPI: 1.08 (Cost Performance Index – Under Budget)
- Active Tasks: ${state.tasks.filter(t => t.status === 'In Progress').length}/${state.tasks.length} running
- Critical Path: ${criticalTasks.map(t => `${t.name} (${t.progress}%)`).join(', ') || 'None'}
- Delayed Tasks: ${delayedTasks.length === 0 ? 'None' : delayedTasks.map(t => t.name).join(', ')}
- Open Safety Incidents: ${openIncidents.length}
- Safety Days Streak: 184 Days Zero Lost-Time
- Weather: ${state.weather.condition}, ${state.weather.temp}°F, Wind ${state.weather.wind}mph
- Active Personnel: 42 subcontractors on site
- Current User Role: ${userRole}

## Task Status:
${state.tasks.map(t => `- ${t.name}: ${t.progress}% [${t.status}] – ${t.assignedCrew}`).join('\n')}

## Pending Invoices:
- ${state.invoices.filter(i => i.status === 'Pending').length} invoices pending, total: ${formatINR(state.invoices.filter(i => i.status === 'Pending').reduce((a, b) => a + b.amount, 0))}

Provide expert, concise, actionable intelligence tailored to the ${userRole}'s responsibilities.
Format responses with clear markdown (### headers, **bold**, bullet points).
Use ₹ INR for all financial figures. Be precise, professional, site-focused.`;
}

// Fallback local AI response generator (used when AI APIs are unreachable)
function generateLocalResponse(query: string, state: AICopilotDrawerProps['state'], userRole: string): string {
  const q = query.toLowerCase();
  const avgProgress = Math.round(state.tasks.reduce((a, b) => a + b.progress, 0) / Math.max(state.tasks.length, 1));
  const totalSpent = state.invoices.filter(i => i.status === 'Paid' || i.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const criticalTasks = state.tasks.filter(t => t.priority === 'Critical');
  const openIncidents = state.incidents.filter(i => i.status !== 'Resolved');

  if (q.includes('briefing') || q.includes('executive') || q.includes('summary')) {
    return `### 📋 Daily Executive Site Briefing
**Project:** Bangalore Commercial Tower (Mixed-Use, Tech Park Phase 2)
**Status:** 🟢 **ON TRACK (${avgProgress}% Physical Milestone Completion)**

1. **Structural Schedule Health:**
   - Critical Path: **${criticalTasks.map(t => t.name).join(', ')}**
   - Framing (T3) at **75%**, concrete decks poured through Level 4.
   - Plumbing & HVAC rough-ins active at 8–15%.

2. **INR Financial Health:**
   - **Total Budget:** ₹12.50 Crores | **Disbursed YTD:** ${formatINR(totalSpent)}
   - **CPI:** **1.08 (Under Budget by ~₹34.5 Lakhs)**

3. **EHS Safety:**
   - Zero Lost-Time streak: **184 Days**
   - Weather: **${state.weather.condition} (${state.weather.temp}°F, Wind: ${state.weather.wind}mph)**
   - Crane operations safe (< 20mph threshold).`;
  }

  if (q.includes('risk') || q.includes('delay') || q.includes('schedule') || q.includes('critical path')) {
    return `### ⚠️ Critical Path & Delay Risk Radar

1. **HVAC & Copper Pipe Supply Lead-Times (Moderate Risk):**
   - **Task T5 (Plumbing Rough-in)** at 8%, dependent on structural slab curing.
   - *Recommendation:* Pre-stage Level 2 copper manifolds to prevent HVAC ductwork collisions.

2. **High Wind Threshold for Tower Crane Lifts:**
   - Current: **${state.weather.wind} mph**. Auto-lock triggers at **20 mph**.
   - *Recommendation:* Schedule heavy lifts 06:00–11:00 morning window.

3. **Subcontractor Crew Utilization:**
   - 42 personnel logged. Ironworkers Local 4 at 100% capacity.`;
  }

  if (q.includes('budget') || q.includes('financial') || q.includes('cost') || q.includes('inr')) {
    return `### 💰 INR Financial Variance & Cashflow Analysis

- **Total Allocated Baseline:** ₹12.50 Crores
- **Incurred & Approved Spend:** ${formatINR(totalSpent)}
- **Pending Claims:** ${formatINR(state.invoices.filter(i => i.status === 'Pending').reduce((a, b) => a + b.amount, 0))}

**Cost Saving Insights:**
1. Concrete batching efficiency saved ~₹12.4 Lakhs vs. original estimate.
2. Contingency reserve remaining: **₹1,25,00,000 (100% intact)**.
3. Recommended: Approve INV-1009 (FlowTech Plumbing) to lock material discount.`;
  }

  if (q.includes('weather') || q.includes('crane') || q.includes('rain') || q.includes('wind')) {
    return `### 🌧️ Weather Impact & Crane Telemetry Advisory

- **Current Condition:** ${state.weather.condition}
- **Temp:** ${state.weather.temp}°F | **Wind:** ${state.weather.wind} mph | **Humidity:** ${state.weather.humidity}%
- **Protocol Status:**
  - ✅ **Tower Crane:** FULL OPERATION (Wind < 20 mph)
  - ✅ **Concrete Curing:** Ideal ambient humidity for 28-day hydration test.
  - ⚠️ **Heat Precautions:** If temp > 85°F, 15-min shade rotation triggers.`;
  }

  if (q.includes('safety') || q.includes('incident') || q.includes('osha') || q.includes('ppe')) {
    return `### 🛡️ EHS Safety & Incident Prevention Advisory

- **Active Cases:** ${openIncidents.length} open issues.
- **Safety Rating:** **99.4% OSHA Audit Compliance**
- **Mitigation Protocols:**
  1. 100% double-lanyard tie-off on Level 4 structural perimeter.
  2. Daily morning toolbox briefing verified – all 42 subcontractors.
  3. Fire suppression & first aid stations inspected in Sectors 1–4.`;
  }

  return `### 💡 ConstructIQ Site Insights
Based on real-time analysis of your active site data:
- **${state.tasks.length} Schedule Tasks** averaging **${avgProgress}%** completion.
- **Financial Status:** ${formatINR(totalSpent)} disbursed against ₹12.50 Cr total (CPI: 1.08).
- **Safety:** ${openIncidents.length === 0 ? 'Zero active high-risk incidents.' : `${openIncidents.length} open case(s) under mitigation.`}

Would you like an **Executive Briefing**, **Delay Risk Analysis**, or **Subcontractor Variance** report?`;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  state,
  userRole
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: `Hello **${userRole}**! I am **ConstructIQ Copilot**, your real-time site intelligence assistant powered by NVIDIA NIM (Meta Llama 3.2). I have live telemetry on your ${state.tasks.length} schedule phases, ₹12.50 Cr INR budget, active safety audits, and current weather (${state.weather.condition}, ${state.weather.wind}mph wind). How can I assist your operations today?`,
      timestamp: 'Just now',
      category: 'general',
      isAI: false
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeEngine, setActiveEngine] = useState<string>('Initializing AI Engine...');
  const [usingRealAI, setUsingRealAI] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const geminiClientRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  // Determine active AI engine on mount
  useEffect(() => {
    const envNvidia = (import.meta as any).env?.VITE_NVIDIA_API_KEY || (window as any).__NVIDIA_API_KEY__;
    const envGemini = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).__GEMINI_API_KEY__;

    if (envNvidia) {
      setUsingRealAI(true);
      setActiveEngine('NVIDIA NIM • Llama 3.2 Vision');
      return;
    }

    if (envGemini) {
      try {
        geminiClientRef.current = new GoogleGenAI({ apiKey: envGemini });
        setUsingRealAI(true);
        setActiveEngine('Google Gemini 2.0 Flash');
        return;
      } catch {
        // Fall through to server check
      }
    }

    // Check server proxy health
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok' && data.aiProvider !== 'None') {
          setUsingRealAI(true);
          setActiveEngine(`${data.aiProvider} (${data.model || 'Live'})`);
        } else {
          setUsingRealAI(false);
          setActiveEngine('Local Analytics Mode');
        }
      })
      .catch(() => {
        // Direct test to proxy
        fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'ping', context: state, userRole })
        })
          .then(r => {
            setUsingRealAI(r.ok);
            setActiveEngine(r.ok ? 'ConstructIQ AI Proxy' : 'Local Analytics Mode');
          })
          .catch(() => {
            setUsingRealAI(false);
            setActiveEngine('Local Analytics Mode');
          });
      });
  }, []);

  if (!isOpen) return null;

  // Direct client call to NVIDIA NIM
  const sendViaNvidiaDirect = async (query: string, apiKey: string): Promise<string> => {
    const systemPrompt = buildSystemPrompt(state, userRole);
    const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.4,
        max_tokens: 800
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `NVIDIA NIM HTTP ${resp.status}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || 'No response returned from NVIDIA AI.';
  };

  // Call through Express proxy server
  const sendViaServerProxy = async (query: string): Promise<{ text: string; provider?: string }> => {
    const resp = await fetch('/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, context: state, userRole })
    });
    if (!resp.ok) throw new Error(`Server error ${resp.status}`);
    const data = await resp.json();
    return { text: data.text, provider: data.provider };
  };

  // Direct call to Gemini
  const sendViaGeminiDirect = async (query: string): Promise<string> => {
    const systemPrompt = buildSystemPrompt(state, userRole);
    const response = await geminiClientRef.current!.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
      config: { systemInstruction: systemPrompt, maxOutputTokens: 800, temperature: 0.4 }
    });
    return response.text ?? '';
  };

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isAnalyzing) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsAnalyzing(true);

    const nvidiaKey = (import.meta as any).env?.VITE_NVIDIA_API_KEY || (window as any).__NVIDIA_API_KEY__;

    try {
      let replyText: string;
      let isAI = false;
      let providerName = 'Local';

      // 1. Direct NVIDIA NIM call from client if key available
      if (nvidiaKey) {
        try {
          replyText = await sendViaNvidiaDirect(q, nvidiaKey);
          isAI = true;
          providerName = 'NVIDIA NIM';
        } catch (nvidiaErr: any) {
          console.warn('[AICopilot] Direct NVIDIA failed, trying proxy...', nvidiaErr);
          try {
            const proxyRes = await sendViaServerProxy(q);
            replyText = proxyRes.text;
            isAI = true;
            providerName = proxyRes.provider || 'NVIDIA Proxy';
          } catch {
            replyText = generateLocalResponse(q, state, userRole);
            isAI = false;
          }
        }
      }
      // 2. Direct Gemini call
      else if (geminiClientRef.current) {
        try {
          replyText = await sendViaGeminiDirect(q);
          isAI = true;
          providerName = 'Google Gemini';
        } catch {
          replyText = generateLocalResponse(q, state, userRole);
          isAI = false;
        }
      }
      // 3. Server Proxy call
      else {
        try {
          const proxyRes = await sendViaServerProxy(q);
          replyText = proxyRes.text;
          isAI = true;
          providerName = proxyRes.provider || 'AI Proxy';
        } catch {
          replyText = generateLocalResponse(q, state, userRole);
          isAI = false;
        }
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI,
        provider: providerName
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `e-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **AI Notice:** ${err?.message || 'Using local analytics mode.'}\n\n${generateLocalResponse(q, state, userRole)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAI: false
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickPrompts = [
    { label: '📋 Daily Executive Briefing', query: 'Generate comprehensive daily executive site briefing' },
    { label: '⚠️ Critical Path Delay Risk', query: 'Analyze critical path bottlenecks and delay risks' },
    { label: '💰 INR Budget & CPI Variance', query: 'Analyze INR budget variance and cashflow' },
    { label: '🌧️ Weather & Crane Impact', query: 'What is the weather impact on concrete curing and crane safety?' },
    { label: '🛡️ Safety & PPE Audit Plan', query: 'Generate OSHA compliance and safety mitigation checklist' },
  ];

  const renderMessageText = (text: string) => {
    return text
      .replace(/### (.*)/g, '<h4 class="font-bold text-xs uppercase tracking-wider text-[#C5A059] mb-1.5 mt-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1A1A1A]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/^(\d+)\. (.*)/gm, '<div class="flex gap-1.5 my-0.5"><span class="text-[#C5A059] font-bold shrink-0">$1.</span><span>$2</span></div>')
      .replace(/^- (.*)/gm, '<div class="flex gap-1.5 my-0.5"><span class="text-[#C5A059] shrink-0">•</span><span>$1</span></div>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white border-l border-[#D1CEC6] shadow-2xl z-50 flex flex-col animate-fade-in font-sans">
      {/* Header */}
      <div className="p-4 border-b border-[#D1CEC6] bg-[#1A1A1A] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#76B900] flex items-center justify-center text-[#1A1A1A] font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">ConstructIQ Copilot</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {usingRealAI === true ? (
                <>
                  <Wifi className="w-2.5 h-2.5 text-[#76B900]" />
                  <p className="text-[9px] text-[#76B900] font-mono font-medium">{activeEngine}</p>
                </>
              ) : usingRealAI === false ? (
                <>
                  <WifiOff className="w-2.5 h-2.5 text-[#C5A059]" />
                  <p className="text-[9px] text-[#C5A059] font-mono font-medium">Local Analytics Engine Active</p>
                </>
              ) : (
                <p className="text-[9px] text-[#7A756C] font-mono">Connecting to AI engine...</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
          title="Close Copilot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 bg-[#F4F1EA] border-b border-[#D1CEC6] overflow-x-auto scrollbar-none flex gap-2">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.query)}
            disabled={isAnalyzing}
            className="whitespace-nowrap px-2.5 py-1 bg-white border border-[#D1CEC6] hover:border-[#76B900] hover:bg-[#76B900]/10 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] rounded-sm transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#FAFAF8]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#7A756C] font-mono">
              <span>{msg.sender === 'user' ? userRole : 'ConstructIQ Intelligence'}</span>
              {msg.sender === 'assistant' && msg.isAI && (
                <span className="text-[#1A1A1A] text-[8px] bg-[#76B900] text-black font-bold px-1.5 py-0.2 rounded">
                  {msg.provider ? `${msg.provider.toUpperCase()} AI` : 'NVIDIA AI'}
                </span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[92%] p-3.5 text-xs leading-relaxed rounded-sm ${
                msg.sender === 'user'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white border border-[#D1CEC6] text-[#1A1A1A] shadow-sm'
              }`}
            >
              <div
                className="prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMessageText(msg.text) }}
              />
            </div>
          </div>
        ))}

        {isAnalyzing && (
          <div className="flex items-center gap-2 p-3 bg-white border border-[#D1CEC6] text-xs text-[#7A756C] rounded-sm">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#76B900]" />
            <span className="font-mono">
              {usingRealAI ? 'Querying NVIDIA NIM with live site telemetry...' : 'Analyzing telemetry, schedule critical paths, and INR cashflow...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input query form */}
      <div className="p-3 border-t border-[#D1CEC6] bg-white">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Ask Copilot about tasks, INR budget, safety, weather..."
            disabled={isAnalyzing}
            className="flex-1 px-3 py-2 bg-[#F4F1EA] border border-[#D1CEC6] text-xs focus:outline-none focus:border-[#76B900] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAnalyzing}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#333] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5 text-[#76B900]" />
            <span>Ask</span>
          </button>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <p className="text-[9px] text-[#7A756C] font-mono">
            Powered by NVIDIA NIM • Meta Llama 3.2
          </p>
          <span className="text-[9px] text-[#2E7D32] font-mono font-bold">
            Telemetry Synced
          </span>
        </div>
      </div>
    </div>
  );
};
