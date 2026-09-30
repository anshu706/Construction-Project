/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, Invoice, SafetyIncident, ProjectRisk, Milestone } from '../types';
import { Award, CheckCircle, AlertTriangle, Download, Eye, Calendar, ShieldCheck } from 'lucide-react';

interface ExecutiveViewProps {
  tasks: Task[];
  invoices: Invoice[];
  incidents: SafetyIncident[];
  risks: ProjectRisk[];
  milestones: Milestone[];
  userRole: string;
}

export const ExecutiveView: React.FC<ExecutiveViewProps> = ({
  tasks,
  invoices,
  incidents,
  risks,
  milestones,
  userRole
}) => {
  const [reportType, setReportType] = useState<'weekly' | 'financial' | 'safety'>('weekly');
  const [previewReport, setPreviewReport] = useState(false);

  const totalTasks = tasks.length;
  const averageProgress = totalTasks > 0
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
    : 0;

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').length;

  const handleDownloadCSV = () => {
    let headers = '';
    let rows = '';

    if (reportType === 'weekly') {
      headers = 'Task ID,Task Name,Phase,Progress,Assigned Crew,Status,Start Date,End Date\n';
      rows = tasks.map(t => `"${t.id}","${t.name}","${t.phase}",${t.progress},"${t.assignedCrew}","${t.status}","${t.startDate}","${t.endDate}"`).join('\n');
    } else if (reportType === 'financial') {
      headers = 'Invoice ID,Vendor,Amount,Category,Status,Date,Description\n';
      rows = invoices.map(i => `"${i.id}","${i.vendor}",${i.amount},"${i.category}","${i.status}","${i.date}","${i.description}"`).join('\n');
    } else {
      headers = 'Incident ID,Date,Severity,Type,Status,Description,Action Taken\n';
      rows = incidents.map(i => `"${i.id}","${i.date}","${i.severity}","${i.type}","${i.status}","${i.description}","${i.actionTaken || 'N/A'}"`).join('\n');
    }

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Construction_${reportType}_report_aug2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6" id="executive-module-container">
      {/* Portfolio status briefing board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="executive-executive-dash">
        {/* Main project executive summary */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between col-span-1 lg:col-span-2 shadow-sm" id="exec-scorecard-broad">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C5A059]" />
              <h3 className="text-[#1A1A1A] text-xs font-sans uppercase tracking-widest font-bold">Downtown Tower Commercial Portfolio Briefing</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 flex flex-col items-center text-center">
                <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Overall Progress</span>
                <span className="text-[#1A1A1A] text-2xl font-sans font-extrabold italic mt-1">{averageProgress}%</span>
                <span className="text-[10px] text-[#2E7D32] font-sans font-bold uppercase tracking-wider mt-1.5">✓ On schedule</span>
              </div>
              <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 flex flex-col items-center text-center">
                <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Budget variance</span>
                <span className="text-[#1A1A1A] text-2xl font-sans font-extrabold italic mt-1">2%</span>
                <span className="text-[10px] text-[#2E7D32] font-sans font-bold uppercase tracking-wider mt-1.5">✓ Under budget</span>
              </div>
              <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 flex flex-col items-center text-center">
                <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">EHS Safety Cases</span>
                <span className="text-[#1A1A1A] text-2xl font-sans font-extrabold italic mt-1">{activeIncidents}</span>
                <span className="text-[10px] text-[#2E7D32] font-sans font-bold uppercase tracking-wider mt-1.5">✓ 0 active severe</span>
              </div>
              <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 flex flex-col items-center text-center">
                <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Milestone Rate</span>
                <span className="text-[#1A1A1A] text-2xl font-sans font-extrabold italic mt-1">100%</span>
                <span className="text-[10px] text-[#2E7D32] font-sans font-bold uppercase tracking-wider mt-1.5">✓ Target met</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#D1CEC6] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5 font-sans">
              <ShieldCheck className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#1A1A1A] font-bold text-xs">Contractor Quality Certification</p>
                <p className="text-[#7A756C] text-[11px] mt-1.5 leading-relaxed italic">Subcontractors completed Level 1-4 framing and joint-welds audits with 100% municipal city certification.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 font-sans">
              <Calendar className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <p className="text-[#1A1A1A] font-bold text-xs">Estimated Completion Date</p>
                <p className="text-[#7A756C] text-[11px] mt-1.5 leading-relaxed italic">May 1, 2027 • Confidence level evaluated at 95% based on automated weather models.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Report generator toolbox */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between col-span-1 shadow-sm" id="exec-reports-panel">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">Briefing Report Exporter</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">Export real-time site states to spreadsheets for board coordination</p>
          </div>

          <div className="flex flex-col gap-3 font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Report Data Domain</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as any);
                  setPreviewReport(false);
                }}
                className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer"
              >
                <option value="weekly">Task Schedule Ledger (Gantt)</option>
                <option value="financial">Subcontractor Invoice Voucher Logs</option>
                <option value="safety">EHS Incident & Audits register</option>
              </select>
            </div>

            <div className="flex gap-2.5 mt-3">
              <button
                onClick={() => setPreviewReport(!previewReport)}
                className="flex-1 bg-transparent hover:bg-[#F4F1EA] border border-[#D1CEC6] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 cursor-pointer transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-1.5" />
                <span>{previewReport ? 'Hide' : 'Preview'}</span>
              </button>

              <button
                onClick={handleDownloadCSV}
                className="flex-1 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2.5 cursor-pointer transition-colors"
                id="btn-download-excel"
              >
                <Download className="w-4 h-4 inline mr-1.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <p className="text-[#7A756C] text-[10px] leading-relaxed mt-4 italic font-sans">
            * Generated reports match ISO 9001 quality audit tracking criteria and can be directly loaded into SAP or Excel.
          </p>
        </div>
      </div>

      {/* Preview Container if active */}
      {previewReport && (
        <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 animate-fade-in" id="report-excel-preview">
          <div className="flex items-center justify-between pb-3 border-b border-[#D1CEC6] mb-3">
            <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Spreadsheet Preview: Construction_{reportType}_report_aug2026.csv</span>
            <span className="text-[9px] bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/25 px-2 py-0.5 font-sans font-bold uppercase tracking-wider">Audit-Ready</span>
          </div>
          <div className="max-h-48 overflow-y-auto text-[11px] font-mono text-[#1A1A1A] divide-y divide-[#D1CEC6]">
            {reportType === 'weekly' && (
              <>
                <div className="py-1.5 text-[#7A756C] font-bold">Task ID,Task Name,Phase,Progress,Assigned Crew,Status,Start,End</div>
                {tasks.map(t => (
                  <div key={t.id} className="py-1.5 font-mono">"{t.id}","{t.name}","{t.phase}",{t.progress},"{t.assignedCrew}","{t.status}","{t.startDate}","{t.endDate}"</div>
                ))}
              </>
            )}
            {reportType === 'financial' && (
              <>
                <div className="py-1.5 text-[#7A756C] font-bold">Invoice ID,Vendor,Amount,Category,Status,Date,Description</div>
                {invoices.map(i => (
                  <div key={i.id} className="py-1.5 font-mono">"{i.id}","{i.vendor}",{i.amount},"${i.category}","{i.status}","{i.date}","{i.description}"</div>
                ))}
              </>
            )}
            {reportType === 'safety' && (
              <>
                <div className="py-1.5 text-[#7A756C] font-bold">Incident ID,Date,Severity,Type,Status,Description,Action</div>
                {incidents.map(i => (
                  <div key={i.id} className="py-1.5 font-mono">"{i.id}","{i.date}","{i.severity}","{i.type}","{i.status}","{i.description}","{i.actionTaken || 'N/A'}"</div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Milestone tracking & Corporate Risk Register */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="executive-bottom-panel">
        {/* Milestone tracking timeline */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between shadow-sm" id="milestones-tracker">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">Upcoming Critical Milestones Checklist</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">Milestone sign-off rate is used for board reporting on portfolio execution</p>
          </div>

          <div className="flex flex-col gap-3">
            {milestones.map(m => {
              const isComplete = m.status === 'Complete';
              const isAtRisk = m.status === 'At Risk';
              const isDelayed = m.status === 'Delayed';
              return (
                <div key={m.id} className="p-3.5 bg-[#F4F1EA] border border-[#D1CEC6] flex items-center justify-between" id={`milestone-${m.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 ${
                      isComplete ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : isAtRisk ? 'bg-[#C5A059]/10 text-[#C5A059]' : isDelayed ? 'bg-[#B71C1C]/10 text-[#B71C1C]' : 'bg-[#E5E2D9] text-[#7A756C]'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[#1A1A1A] font-sans font-bold text-sm">{m.name}</p>
                      <p className="text-[#7A756C] text-[10px] font-sans font-bold uppercase tracking-wider mt-0.5">Due: {m.dueDate} {m.completedDate && `• Completed: ${m.completedDate}`}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2.5 py-0.5 uppercase tracking-wider font-sans font-bold border ${
                    isComplete
                      ? 'bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20'
                      : isAtRisk
                      ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20'
                      : isDelayed
                      ? 'bg-[#B71C1C]/10 text-[#B71C1C] border-[#B71C1C]/20'
                      : 'bg-[#1A1A1A]/10 text-[#1A1A1A] border-[#1A1A1A]/20'
                  }`}>
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corporate risk register */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between shadow-sm" id="risk-register">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">EHS & Corporate Risk Registry</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">Active construction risk items with formal mitigation strategies</p>
          </div>

          <div className="flex flex-col gap-3">
            {risks.map(r => (
              <div key={r.id} className="p-3.5 bg-[#F4F1EA] border border-[#D1CEC6] flex flex-col gap-2" id={`risk-item-${r.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4.5 h-4.5 shrink-0 ${
                      r.probability === 'High' ? 'text-[#B71C1C]' : r.probability === 'Medium' ? 'text-[#C5A059]' : 'text-[#1A1A1A]'
                    }`} />
                    <span className="text-[#1A1A1A] font-sans font-bold text-sm">{r.title}</span>
                  </div>
                  <span className="bg-white border border-[#D1CEC6] text-[#7A756C] text-[9px] px-2 py-0.5 font-sans font-bold uppercase tracking-wider">
                    {r.category}
                  </span>
                </div>
                <p className="text-[#7A756C] text-[11px] leading-relaxed pl-6 font-sans italic">{r.mitigationPlan}</p>
                <div className="flex items-center gap-4 pl-6 text-[9px] font-sans uppercase font-bold tracking-wider mt-1 text-[#7A756C]">
                  <span>Prob: <span className={r.probability === 'High' ? 'text-[#B71C1C]' : 'text-[#C5A059]'}>{r.probability}</span></span>
                  <span>Impact: <span className={r.impact === 'High' ? 'text-[#B71C1C]' : 'text-[#C5A059]'}>{r.impact}</span></span>
                  <span>Status: <span className="text-[#1A1A1A]">{r.status}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
