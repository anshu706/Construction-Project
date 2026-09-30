/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Task, Invoice, SafetyIncident, ProjectRisk, Milestone, PunchItem } from '../types';
import { formatINR } from '../currency';
import { Printer, Download, X, Award, CheckCircle2, ShieldCheck, Building2, Calendar } from 'lucide-react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  invoices: Invoice[];
  incidents: SafetyIncident[];
  risks: ProjectRisk[];
  milestones: Milestone[];
  punchItems: PunchItem[];
  weather: { temp: number; condition: string; wind: number };
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  invoices,
  incidents,
  risks,
  milestones,
  punchItems,
  weather
}) => {
  if (!isOpen) return null;

  const totalSpent = invoices.filter(i => i.status === 'Paid' || i.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const avgProgress = Math.round(tasks.reduce((a, b) => a + b.progress, 0) / (tasks.length || 1));
  const openIncidents = incidents.filter(i => i.status !== 'Resolved').length;
  const closedPunch = punchItems.filter(p => p.status === 'Closed').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#D1CEC6] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative font-sans print:max-w-none print:max-h-none print:shadow-none print:border-none">
        {/* Actions bar (hidden during print) */}
        <div className="sticky top-0 bg-[#1A1A1A] text-white p-3.5 flex items-center justify-between z-10 print:hidden">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs font-bold uppercase tracking-wider">Executive Site Performance Dossier</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#C5A059] hover:bg-[#B38F48] text-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 text-[#1A1A1A]" id="printable-dossier">
          {/* Document Header */}
          <div className="border-b-2 border-[#1A1A1A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-mono bg-[#E5E2D9] px-2 py-0.5 font-bold">
                  PROJECT DOSSIER // VOL. IV
                </span>
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#7A756C]">ISO 9001 AUDITED</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
                Bangalore Metro Commercial Tower
              </h1>
              <p className="text-xs text-[#7A756C] mt-1 font-mono">
                Site ID: BLR-SEZ-2026-T4 • Phase 2 Structural & MEP Execution
              </p>
            </div>

            <div className="text-right sm:text-right font-mono text-xs text-[#7A756C]">
              <p>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>Site Condition: {weather.condition} ({weather.temp}°F)</p>
              <p className="text-emerald-700 font-bold">Site Status: ACTIVE / GO</p>
            </div>
          </div>

          {/* Key Metric Scorecard Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-8">
            <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA]">
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#7A756C] block">Physical Progress</span>
              <span className="text-2xl font-bold font-mono text-[#1A1A1A] block mt-1">{avgProgress}%</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">✓ 67% Milestone Target</span>
            </div>

            <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA]">
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#7A756C] block">Incurred Spend (YTD)</span>
              <span className="text-xl font-bold font-mono text-[#1A1A1A] block mt-1">{formatINR(totalSpent)}</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">CPI 1.08 (Under Budget)</span>
            </div>

            <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA]">
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#7A756C] block">Safety Streak</span>
              <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">184 Days</span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase">Zero Lost-Time Cases</span>
            </div>

            <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA]">
              <span className="text-[9px] uppercase tracking-widest font-mono text-[#7A756C] block">QA/QC Defect Clearance</span>
              <span className="text-2xl font-bold font-mono text-[#1A1A1A] block mt-1">{closedPunch}/{punchItems.length}</span>
              <span className="text-[10px] text-blue-700 font-bold uppercase">{Math.round((closedPunch / (punchItems.length || 1)) * 100)}% Pass Rate</span>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-[#D1CEC6] pb-2 mb-3">
              1. Primary Schedule & Critical Path Ledger
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D1CEC6] bg-[#E5E2D9]/40 text-[#7A756C] font-mono uppercase text-[9px]">
                  <th className="py-2 px-3">Task ID</th>
                  <th className="py-2 px-3">Operation Description</th>
                  <th className="py-2 px-3">Phase</th>
                  <th className="py-2 px-3">Progress</th>
                  <th className="py-2 px-3">Subcontractor</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1CEC6]">
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 px-3 font-mono text-[10px] text-[#7A756C]">{t.id}</td>
                    <td className="py-2 px-3 font-semibold">{t.name}</td>
                    <td className="py-2 px-3 font-mono text-[10px] uppercase text-[#7A756C]">{t.phase}</td>
                    <td className="py-2 px-3 font-mono font-bold">{t.progress}%</td>
                    <td className="py-2 px-3 italic">{t.assignedCrew}</td>
                    <td className="py-2 px-3 font-mono text-[10px] uppercase">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider border-b border-[#D1CEC6] pb-2 mb-3">
              2. INR Financial Variance & Subcontractor Disbursements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-[#F4F1EA] border border-[#D1CEC6] font-mono text-xs">
                <span className="text-[#7A756C] block text-[9px] uppercase tracking-wider">Total Approved Baseline:</span>
                <span className="text-base font-bold text-[#1A1A1A]">₹ 12,50,00,000 (100%)</span>
              </div>
              <div className="p-3 bg-[#F4F1EA] border border-[#D1CEC6] font-mono text-xs">
                <span className="text-[#7A756C] block text-[9px] uppercase tracking-wider">Unallocated Contingency Reserve:</span>
                <span className="text-base font-bold text-emerald-700">₹ 1,25,00,000 (10% Buffer)</span>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#D1CEC6] bg-[#E5E2D9]/40 text-[#7A756C] font-mono uppercase text-[9px]">
                  <th className="py-2 px-3">Invoice #</th>
                  <th className="py-2 px-3">Vendor</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Amount (INR)</th>
                  <th className="py-2 px-3">Approval State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D1CEC6]">
                {invoices.slice(0, 6).map(inv => (
                  <tr key={inv.id}>
                    <td className="py-2 px-3 font-mono text-[10px] text-[#7A756C]">{inv.id}</td>
                    <td className="py-2 px-3 font-semibold">{inv.vendor}</td>
                    <td className="py-2 px-3 font-mono text-[10px] uppercase text-[#7A756C]">{inv.category}</td>
                    <td className="py-2 px-3 font-mono font-bold">{formatINR(inv.amount)}</td>
                    <td className="py-2 px-3 font-mono text-[10px] uppercase">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures and Sign-off */}
          <div className="mt-12 pt-8 border-t-2 border-[#1A1A1A] grid grid-cols-3 gap-6 text-xs">
            <div>
              <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
              <span className="font-bold block uppercase text-[10px] tracking-wider">Rahul Sharma</span>
              <span className="text-[10px] text-[#7A756C] uppercase font-mono">Senior Project Manager</span>
            </div>

            <div>
              <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
              <span className="font-bold block uppercase text-[10px] tracking-wider">Priya Patel</span>
              <span className="text-[10px] text-[#7A756C] uppercase font-mono">Site Superintendent</span>
            </div>

            <div>
              <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
              <span className="font-bold block uppercase text-[10px] tracking-wider">Amit Kumar</span>
              <span className="text-[10px] text-[#7A756C] uppercase font-mono">Financial Controller</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
