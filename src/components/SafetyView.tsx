/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SafetyIncident } from '../types';
import { Shield, ShieldAlert, Plus, Check, Clock, AlertTriangle, Hammer, Users, HeartPulse } from 'lucide-react';

interface SafetyViewProps {
  incidents: SafetyIncident[];
  onAddIncident: (incident: Omit<SafetyIncident, 'id'>) => void;
  onResolveIncident: (id: string, actionTaken: string) => void;
  userRole: string;
}

export const SafetyView: React.FC<SafetyViewProps> = ({
  incidents,
  onAddIncident,
  onResolveIncident,
  userRole
}) => {
  const [showLogForm, setShowLogForm] = useState(false);
  const [severity, setSeverity] = useState<SafetyIncident['severity']>('Minor');
  const [type, setType] = useState<SafetyIncident['type']>('First Aid');
  const [description, setDescription] = useState('');

  // Action taken input for resolving incidents
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveAction, setResolveAction] = useState('');

  const activeIncidents = incidents.filter(i => i.status !== 'Resolved');
  
  // Calculate days since last Lost-Time Incident
  const lostTimeIncidents = incidents.filter(i => i.type === 'Lost-Time');
  let daysWithoutIncident = 42;
  if (lostTimeIncidents.length > 0) {
    const sorted = [...lostTimeIncidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = new Date(sorted[0].date).getTime();
    const currentDate = new Date('2026-08-02').getTime();
    const diffTime = Math.abs(currentDate - lastDate);
    daysWithoutIncident = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    onAddIncident({
      date: new Date().toISOString().split('T')[0],
      severity,
      type,
      description,
      status: 'Open'
    });
    setDescription('');
    setShowLogForm(false);
  };

  const handleSaveResolution = (id: string) => {
    if (!resolveAction) return;
    onResolveIncident(id, resolveAction);
    setResolvingId(null);
    setResolveAction('');
  };

  const getSeverityBadge = (sev: SafetyIncident['severity']) => {
    switch (sev) {
      case 'Severe':
        return <span className="bg-[#B71C1C]/10 text-[#B71C1C] border border-[#B71C1C]/20 text-[9px] px-2.5 py-0.5 uppercase tracking-wider font-sans font-bold">Severe</span>;
      case 'Moderate':
        return <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[9px] px-2.5 py-0.5 uppercase tracking-wider font-sans font-bold">Moderate</span>;
      case 'Minor':
        return <span className="bg-[#1A1A1A]/10 text-[#1A1A1A] border border-[#1A1A1A]/20 text-[9px] px-2.5 py-0.5 uppercase tracking-wider font-sans font-bold">Minor</span>;
    }
  };

  const getStatusBadge = (status: SafetyIncident['status']) => {
    switch (status) {
      case 'Open':
        return <span className="bg-[#B71C1C]/10 text-[#B71C1C] border border-[#B71C1C]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Active Case</span>;
      case 'Under Investigation':
        return <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Investigating</span>;
      case 'Resolved':
        return <span className="bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20 text-[9px] px-2 py-0.5 uppercase tracking-wider font-sans font-bold flex items-center gap-1 w-fit"><Check className="w-3 h-3" /> Resolved</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6" id="safety-module-container">
      {/* Safety Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="safety-scorecards">
        <div className="bg-white border border-[#D1CEC6] p-6 flex items-center justify-between shadow-sm" id="safe-card-days">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Days Since Lost-Time Incident</span>
            <h2 className="text-[#1A1A1A] text-3xl font-sans font-extrabold italic mt-2">{daysWithoutIncident} Days</h2>
            <p className="text-[#2E7D32] text-xs mt-1.5 flex items-center gap-1 font-sans italic">
              <Check className="w-3.5 h-3.5" /> Site safety compliance optimal
            </p>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-[#D1CEC6] rounded-sm">
            <HeartPulse className="w-6 h-6 text-[#2E7D32]" />
          </div>
        </div>

        <div className="bg-white border border-[#D1CEC6] p-6 flex items-center justify-between shadow-sm" id="safe-card-incidents">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Unresolved Safety Cases</span>
            <h2 className="text-[#1A1A1A] text-3xl font-sans font-extrabold italic mt-2">{activeIncidents.length} Active</h2>
            <p className="text-[#7A756C] text-xs mt-1.5 font-sans font-bold uppercase tracking-wider">
              Out of {incidents.length} incidents YTD
            </p>
          </div>
          <div className={`p-3 border rounded-sm ${activeIncidents.length > 0 ? 'bg-[#B71C1C]/10 border-[#B71C1C]/25' : 'bg-[#F4F1EA] border-[#D1CEC6]'}`}>
            <ShieldAlert className={`w-6 h-6 ${activeIncidents.length > 0 ? 'text-[#B71C1C]' : 'text-[#7A756C]'}`} />
          </div>
        </div>

        <div className="bg-white border border-[#D1CEC6] p-6 flex items-center justify-between shadow-sm" id="safe-card-compliance">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Site PPE Compliance Rating</span>
            <h2 className="text-[#1A1A1A] text-3xl font-sans font-extrabold italic mt-2">96%</h2>
            <p className="text-[#7A756C] text-xs mt-1.5 font-sans italic">
              Daily toolboxes & inspections
            </p>
          </div>
          <div className="p-3 bg-[#F4F1EA] border border-[#D1CEC6] rounded-sm">
            <Shield className="w-6 h-6 text-[#C5A059]" />
          </div>
        </div>
      </div>

      {/* PPE Audit Checklists & Action points */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="safety-secondary-layouts">
        {/* Compliance Checklist */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between shadow-sm" id="compliance-checklists">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">EHS Site Inspection Checklist</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">Standard checklist of regulatory safety requirements on-site</p>
          </div>
          <div className="flex flex-col gap-3 text-xs">
            {[
              { label: 'Eye & Hand Protection Gear (PPE)', checked: true, note: '100% checks done during shift change' },
              { label: 'Fall Arrest Harness & Scaffolding checks', checked: true, note: 'Level 4 harnesses locked and validated' },
              { label: 'Extreme Heat Hydration Breaks logged', checked: true, note: 'Shaded tents active with hydration electrolyte packs' },
              { label: 'Tower Crane clearance zone barriered', checked: true, note: 'Signage and physical barriers securely installed' },
              { label: 'Electrical distribution switchboard grounding', checked: false, note: 'Inspectors review scheduled for August 4' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-[#F4F1EA] border border-[#D1CEC6]">
                <div className={`p-1 mt-0.5 ${item.checked ? 'bg-[#2E7D32]/10 border border-[#2E7D32]/20' : 'bg-[#C5A059]/10 border border-[#C5A059]/20'}`}>
                  {item.checked ? (
                    <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                  )}
                </div>
                <div>
                  <p className="text-[#1A1A1A] font-sans font-bold text-sm">{item.label}</p>
                  <p className="text-[#7A756C] text-[10px] mt-0.5 font-sans font-bold uppercase tracking-wider">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Training Rate indicator */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between shadow-sm" id="training-rates">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">Subcontractor Training Certification</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">EHS compliance tracking per active site crew</p>
          </div>
          <div className="flex flex-col gap-4 text-xs">
            {[
              { crew: 'Ironworkers Local 4', rate: 100, color: 'bg-[#2E7D32]' },
              { crew: 'Plumbing Subcontractor', rate: 94, color: 'bg-[#2E7D32]' },
              { crew: 'Concrete Crew B', rate: 91, color: 'bg-[#C5A059]' },
              { crew: 'Volt Builders', rate: 88, color: 'bg-[#C5A059]' },
              { crew: 'Excavation Crew A', rate: 100, color: 'bg-[#2E7D32]' }
            ].map(item => (
              <div key={item.crew} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[#1A1A1A] font-sans font-bold text-xs">
                  <span>{item.crew}</span>
                  <span className="font-sans text-[10px] text-[#C5A059] font-bold uppercase tracking-wide">{item.rate}% Certified</span>
                </div>
                <div className="w-full bg-[#E5E2D9] h-1.5 overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#F4F1EA] p-3 text-[10px] text-[#7A756C] leading-relaxed mt-5 italic font-sans border border-[#D1CEC6]">
            * Note: All workers must pass site-specific hazard training before issuing active RFID hardhat tags.
          </div>
        </div>

        {/* Incident severity distribution */}
        <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between shadow-sm" id="safety-severity-distribution">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base mb-1">Incident Classification Breakdown</h3>
            <p className="text-[#7A756C] text-xs mb-5 font-sans italic">EHS hazard severity frequency classification</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { type: 'First Aid', count: incidents.filter(i => i.type === 'First Aid').length, color: 'bg-[#C5A059]', desc: 'Minor abrasions or burns requiring basic first aid on site' },
              { type: 'Near-Miss', count: incidents.filter(i => i.type === 'Near-Miss').length, color: 'bg-[#1A1A1A]', desc: 'Potential hazard spotted & defused before injury occured' },
              { type: 'Lost-Time', count: incidents.filter(i => i.type === 'Lost-Time').length, color: 'bg-[#B71C1C]', desc: 'Injuries that halt working duty for at least 1 calendar day' },
              { type: 'Equipment Damage', count: incidents.filter(i => i.type === 'Equipment Damage').length, color: 'bg-[#7A756C]', desc: 'Heavy machinery collisions or electrical defects' }
            ].map(item => (
              <div key={item.type} className="flex items-center gap-3 p-2.5 bg-[#F4F1EA] border border-[#D1CEC6]">
                <div className="w-8 h-8 bg-white border border-[#D1CEC6] flex items-center justify-center font-sans font-extrabold italic text-[#1A1A1A] shrink-0">
                  {item.count}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#1A1A1A] font-sans font-bold text-xs">{item.type}</span>
                  </div>
                  <p className="text-[#7A756C] text-[10px] mt-0.5 leading-relaxed font-sans italic">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident register log & Reporting */}
      <div className="bg-white border border-[#D1CEC6] shadow-sm overflow-hidden" id="incident-ledger-block">
        <div className="p-4 border-b border-[#D1CEC6] bg-[#F4F1EA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-[#1A1A1A] font-sans font-bold text-base">EHS Site Incident Register</h3>
            <p className="text-[#7A756C] text-xs font-sans italic mt-0.5">Formal compliance logging in accordance with OSHA standards</p>
          </div>
          {(userRole === 'SafetyOfficer' || userRole === 'SiteSupervisor') && (
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 transition-colors cursor-pointer w-full sm:w-auto justify-center"
              id="btn-trigger-report-incident"
            >
              <Plus className="w-4 h-4" />
              <span>Log Site Safety Incident</span>
            </button>
          )}
        </div>

        {/* Incident logger form expansion */}
        {showLogForm && (
          <form onSubmit={handleReportIncident} className="p-6 bg-white border-b border-[#D1CEC6] animate-fade-in" id="report-incident-form">
            <h4 className="text-[#1A1A1A] font-sans uppercase tracking-widest font-bold text-xs mb-4">Report Active Construction Hazard / Injury Event</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Incident Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SafetyIncident['severity'])}
                  className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer"
                >
                  <option value="Minor">Minor (First Aid/Hazard resolved)</option>
                  <option value="Moderate">Moderate (EHS review needed)</option>
                  <option value="Severe">Severe (Halt work / Lost-Time risk)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Event Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as SafetyIncident['type'])}
                  className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans cursor-pointer"
                >
                  <option value="First Aid">First Aid Injury</option>
                  <option value="Near-Miss">Near-Miss Hazard Alert</option>
                  <option value="Lost-Time">Lost-Time Injury (Days lost)</option>
                  <option value="Equipment Damage">Heavy Machinery Damage</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">Factual Scope & Event Summary *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize exact occurrence, location..."
                  className="bg-[#F4F1EA] border border-[#D1CEC6] p-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#C5A059] font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="bg-transparent hover:bg-[#F4F1EA] border border-[#D1CEC6] text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#1A1A1A] hover:bg-[#C5A059] text-white text-[10px] uppercase tracking-widest font-bold px-5 py-2 cursor-pointer"
              >
                Broadcast Safety Incident
              </button>
            </div>
          </form>
        )}

        {/* Incident table list */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D1CEC6] bg-[#E5E2D9] text-[#1A1A1A] font-sans uppercase tracking-wider text-[10px] font-bold select-none">
                <th className="p-3 pl-4">Incident ID</th>
                <th className="p-3">Logged Date</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Classification</th>
                <th className="p-3">Event Summary</th>
                <th className="p-3">Incident Status</th>
                <th className="p-3">Resolution Action Plan</th>
                <th className="p-3 text-right pr-4">Safety Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1CEC6]" id="incident-rows">
              {incidents.map(incident => {
                const isResolving = resolvingId === incident.id;
                return (
                  <tr key={incident.id} className="hover:bg-[#F4F1EA]/30 transition-all">
                    <td className="p-3 pl-4 font-mono font-bold text-[#B71C1C]">
                      {incident.id}
                    </td>
                    <td className="p-3 font-sans text-[#7A756C]">
                      {incident.date}
                    </td>
                    <td className="p-3">
                      {getSeverityBadge(incident.severity)}
                    </td>
                    <td className="p-3 font-sans font-bold text-[#1A1A1A]">
                      {incident.type}
                    </td>
                    <td className="p-3 text-[#7A756C] font-sans max-w-[200px] truncate" title={incident.description}>
                      {incident.description}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(incident.status)}
                    </td>
                    <td className="p-3 max-w-[200px]">
                      {isResolving ? (
                        <input
                          type="text"
                          required
                          value={resolveAction}
                          onChange={(e) => setResolveAction(e.target.value)}
                          placeholder="Action taken to mitigate recurrence..."
                          className="bg-white border border-[#D1CEC6] px-2 py-1 text-[11px] text-[#1A1A1A] w-full font-sans focus:outline-none focus:border-[#C5A059]"
                        />
                      ) : (
                        <p className="text-[#7A756C] font-sans italic text-[11px]" title={incident.actionTaken}>
                          {incident.actionTaken || <span className="text-[#A89F91] font-sans uppercase tracking-widest text-[9px] font-bold">Investigation pending.</span>}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4 whitespace-nowrap">
                      {(userRole === 'SafetyOfficer' || userRole === 'SiteSupervisor') && incident.status !== 'Resolved' && (
                        <div>
                          {isResolving ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setResolvingId(null)}
                                className="text-[#7A756C] hover:text-[#1A1A1A] bg-[#E5E2D9] px-2 py-1 text-[10px] uppercase font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveResolution(incident.id)}
                                className="text-white bg-[#1A1A1A] hover:bg-[#C5A059] px-2.5 py-1 text-[10px] uppercase font-bold"
                              >
                                Resolve EHS Case
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setResolvingId(incident.id);
                                setResolveAction(incident.actionTaken || '');
                              }}
                              className="text-white bg-[#1A1A1A] hover:bg-[#C5A059] px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all cursor-pointer"
                            >
                              Log Remedial Action
                            </button>
                          )}
                        </div>
                      )}
                      {incident.status === 'Resolved' && (
                        <span className="text-[#2E7D32] text-[10px] font-sans font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" /> Case Closed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
