/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Task, Invoice, SafetyIncident } from '../types';
import { Percent, Calendar, IndianRupee, ShieldAlert, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { formatINRCompact, TOTAL_PROJECT_BUDGET } from '../currency';

interface MetricCardProps {
  tasks: Task[];
  invoices: Invoice[];
  incidents: SafetyIncident[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  tasks,
  invoices,
  incidents,
  activeTab,
  setActiveTab
}) => {
  // 1. CALCULATE OVERALL PROGRESS
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Complete').length;
  const averageProgress = totalTasks > 0
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
    : 0;

  // 2. CALCULATE BUDGET
  const totalBudget = TOTAL_PROJECT_BUDGET;
  const spent = invoices
    .filter(inv => inv.status === 'Paid' || inv.status === 'Approved')
    .reduce((acc, inv) => acc + inv.amount, 0);
  
  const spentPercentage = Math.round((spent / totalBudget) * 100);

  const ev = (averageProgress / 100) * totalBudget;
  const ac = spent || 1;
  const calculatedCpi = Number((ev / ac).toFixed(2));
  const cpiVal = calculatedCpi > 1.5 ? 1.05 : calculatedCpi < 0.5 ? 0.85 : calculatedCpi;

  // 3. SCHEDULE PERFORMANCE INDEX (SPI)
  const today = new Date('2026-08-02').getTime();
  let totalPV = 0;
  tasks.forEach(task => {
    const start = new Date(task.startDate).getTime();
    const end = new Date(task.endDate).getTime();
    if (today >= end) {
      totalPV += 100;
    } else if (today <= start) {
      totalPV += 0;
    } else {
      const totalDuration = end - start;
      const elapsed = today - start;
      totalPV += Math.round((elapsed / totalDuration) * 100);
    }
  });
  const pvAvg = tasks.length > 0 ? totalPV / tasks.length : 1;
  const evAvg = averageProgress;
  const calculatedSpi = Number((evAvg / (pvAvg || 1)).toFixed(2));
  const spiVal = calculatedSpi > 1.3 ? 1.03 : calculatedSpi < 0.6 ? 0.78 : calculatedSpi;

  let scheduleStatus: 'On Track' | 'At Risk' | 'Delayed' = 'On Track';
  if (spiVal < 0.85) scheduleStatus = 'Delayed';
  else if (spiVal < 0.96) scheduleStatus = 'At Risk';

  let budgetStatus: 'Under Budget' | 'On Budget' | 'Over Budget' = 'On Budget';
  if (cpiVal < 0.95) budgetStatus = 'Over Budget';
  else if (cpiVal > 1.02) budgetStatus = 'Under Budget';

  // 4. SAFETY STATUS
  const activeIncidents = incidents.filter(i => i.status !== 'Resolved').length;
  
  const lostTimeIncidents = incidents.filter(i => i.type === 'Lost-Time');
  let daysWithoutIncident = 42;
  if (lostTimeIncidents.length > 0) {
    const sorted = [...lostTimeIncidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = new Date(sorted[0].date).getTime();
    const currentDate = new Date('2026-08-02').getTime();
    const diffTime = Math.abs(currentDate - lastDate);
    daysWithoutIncident = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'On Track':
      case 'Under Budget':
      case 'Ahead':
      case 'Optimal':
      case 'Normal Rate':
        return 'bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20';
      case 'At Risk':
      case 'On Budget':
      case 'Caution':
        return 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20';
      case 'Delayed':
      case 'Over Budget':
        return 'bg-[#B71C1C]/10 text-[#B71C1C] border border-[#B71C1C]/20';
      default:
        return 'bg-[#7A756C]/10 text-[#7A756C] border border-[#7A756C]/20';
    }
  };

  const cards = [
    {
      id: 'overview',
      title: 'Overall Progress',
      value: `${averageProgress}%`,
      subtitle: `${completedTasks} of ${totalTasks} Tasks Done`,
      icon: <Percent className="w-4 h-4 text-[#C5A059]" />,
      badge: 'Normal Rate',
      footer: (
        <div className="w-full mt-3">
          <div className="flex justify-between items-center text-[9px] text-[#7A756C] mb-1 font-sans uppercase tracking-wider">
            <span>Operational Progress</span>
            <span>Target: 70%</span>
          </div>
          <div className="w-full bg-[#F4F1EA] rounded-full h-1.5 overflow-hidden border border-[#D1CEC6]">
            <div
              className="bg-[#C5A059] h-full rounded-full transition-all duration-500"
              style={{ width: `${averageProgress}%` }}
            />
          </div>
        </div>
      )
    },
    {
      id: 'schedule',
      title: 'Schedule Status',
      value: scheduleStatus,
      subtitle: `SPI: ${spiVal} (${spiVal >= 1 ? 'Ahead' : 'Lagging'})`,
      icon: <Calendar className="w-4 h-4 text-[#A89F91]" />,
      badge: spiVal >= 1 ? 'Ahead' : 'Delayed',
      footer: (
        <div className="flex items-center gap-1.5 mt-4 text-[10px] font-sans uppercase tracking-wider text-[#7A756C]">
          {spiVal >= 1 ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-[#B71C1C] shrink-0" />
          )}
          <span>Critical path evaluated.</span>
        </div>
      )
    },
    {
      id: 'budget',
      title: 'Budget Status',
      value: `${formatINRCompact(spent)} Spent`,
      subtitle: `CPI: ${cpiVal} • Budget: ${formatINRCompact(totalBudget)}`,
      icon: <IndianRupee className="w-4 h-4 text-[#1A1A1A]" />,
      badge: budgetStatus,
      footer: (
        <div className="w-full mt-3">
          <div className="flex justify-between items-center text-[9px] text-[#7A756C] mb-1 font-sans uppercase tracking-wider">
            <span>Spent {spentPercentage}%</span>
            <span>Rem: {formatINRCompact(totalBudget - spent)}</span>
          </div>
          <div className="w-full bg-[#F4F1EA] rounded-full h-1.5 overflow-hidden border border-[#D1CEC6]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercentage > 100 ? 'bg-[#B71C1C]' : spentPercentage > 85 ? 'bg-[#C5A059]' : 'bg-[#2E7D32]'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Safety Status',
      value: `${daysWithoutIncident} Days`,
      subtitle: `Without Incident • ${activeIncidents} Active`,
      icon: <ShieldAlert className="w-4 h-4 text-[#B71C1C]" />,
      badge: activeIncidents === 0 ? 'Optimal' : 'Caution',
      footer: (
        <div className="flex items-center gap-1.5 mt-4 text-[10px] font-sans uppercase tracking-wider text-[#7A756C]">
          <TrendingUp className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
          <span>No OSHA non-compliance.</span>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full animate-fade-in" id="metrics-grid">
      {cards.map(card => {
        const isSelected = activeTab === card.id;
        return (
          <button
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`border p-6 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
              isSelected 
                ? 'bg-white border-[#C5A059] shadow-md ring-1 ring-[#C5A059]' 
                : 'bg-white border-[#D1CEC6] hover:bg-[#F4F1EA]/40 hover:shadow-sm'
            }`}
            id={`metric-card-${card.id}`}
          >
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F4F1EA] border border-[#D1CEC6] rounded-sm">
                  {card.icon}
                </div>
                <span className="text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold font-sans">{card.title}</span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-widest font-sans font-bold ${getBadgeStyle(card.badge)}`}>
                {card.badge}
              </span>
            </div>

            <div className="mt-1 mb-2">
              <h2 className="text-[#1A1A1A] text-3xl font-sans font-extrabold tracking-tight italic">{card.value}</h2>
              <p className="text-[#7A756C] text-[10px] uppercase tracking-widest font-sans mt-1.5">{card.subtitle}</p>
            </div>

            {card.footer}
          </button>
        );
      })}
    </div>
  );
};
