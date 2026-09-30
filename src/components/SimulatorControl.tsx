/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OperationLog } from '../types';
import { Play, Pause, FastForward, Activity, Flame, ShieldAlert, TrendingUp, Wind } from 'lucide-react';

interface SimulatorControlProps {
  logs: OperationLog[];
  simulationSpeed: 'paused' | 'normal' | 'fast';
  onSpeedChange: (speed: 'paused' | 'normal' | 'fast') => void;
  onTriggerEvent: (eventKey: string) => void;
}

export const SimulatorControl: React.FC<SimulatorControlProps> = ({
  logs,
  simulationSpeed,
  onSpeedChange,
  onTriggerEvent
}) => {
  const getLogSeverityColorClass = (severity: OperationLog['severity']) => {
    switch (severity) {
      case 'success': return 'text-[#2E7D32] bg-[#2E7D32]/10 border-[#2E7D32]/20';
      case 'warning': return 'text-[#C5A059] bg-[#C5A059]/10 border-[#C5A059]/20';
      case 'alert': return 'text-[#B71C1C] bg-[#B71C1C]/10 border-[#B71C1C]/20';
      case 'info': return 'text-[#1A1A1A] bg-[#1A1A1A]/10 border-[#1A1A1A]/20';
    }
  };

  return (
    <div className="bg-white border border-[#D1CEC6] p-6 flex flex-col justify-between w-full h-full shadow-sm" id="simulator-control-panel">
      {/* Simulation Controls Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-[#C5A059] animate-pulse shrink-0" />
          <h3 className="text-[#1A1A1A] font-sans font-bold text-base">Operations Feed & Simulation</h3>
        </div>
        <p className="text-[#7A756C] text-xs font-sans italic leading-relaxed">
          Simulate construction activities to test real-time metric propagations across role-specific views.
        </p>

        {/* Speed selectors */}
        <div className="flex gap-1 bg-[#F4F1EA] p-1 border border-[#D1CEC6] mt-4 w-full">
          {[
            { key: 'paused' as const, label: 'Pause', icon: <Pause className="w-3.5 h-3.5" /> },
            { key: 'normal' as const, label: '1x Play', icon: <Play className="w-3.5 h-3.5" /> },
            { key: 'fast' as const, label: '5x Fast', icon: <FastForward className="w-3.5 h-3.5" /> }
          ].map(speed => {
            const isSelected = simulationSpeed === speed.key;
            return (
              <button
                key={speed.key}
                onClick={() => onSpeedChange(speed.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] uppercase tracking-widest font-sans font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected ? 'bg-[#1A1A1A] text-white shadow-sm' : 'text-[#7A756C] hover:text-[#1A1A1A] hover:bg-[#E5E2D9]'
                }`}
                id={`btn-sim-${speed.key}`}
              >
                {speed.icon}
                <span>{speed.label}</span>
              </button>
            );
          })}
        </div>

        {/* Manual Event triggers list */}
        <div className="flex flex-col gap-2 mt-5">
          <span className="text-[10px] text-[#7A756C] uppercase font-sans tracking-widest font-bold">Inject Site Hazard Events:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onTriggerEvent('WIND_HAZARD')}
              className="flex items-center gap-2 bg-[#F4F1EA] hover:bg-white border border-[#D1CEC6] p-3 text-[10px] text-[#1A1A1A] font-sans font-bold cursor-pointer transition-colors text-left"
              title="Trigger crane high wind delays"
              id="btn-trigger-wind"
            >
              <Wind className="w-4 h-4 text-[#7A756C] shrink-0" />
              <span>Crane Wind Delay</span>
            </button>

            <button
              onClick={() => onTriggerEvent('SAFETY_ACCIDENT')}
              className="flex items-center gap-2 bg-[#F4F1EA] hover:bg-white border border-[#D1CEC6] p-3 text-[10px] text-[#1A1A1A] font-sans font-bold cursor-pointer transition-colors text-left"
              title="Inject scaffold safety harness trip"
              id="btn-trigger-accident"
            >
              <ShieldAlert className="w-4 h-4 text-[#B71C1C] shrink-0" />
              <span>Scaffold Slipped</span>
            </button>

            <button
              onClick={() => onTriggerEvent('FRAMING_PROGRESS')}
              className="flex items-center gap-2 bg-[#F4F1EA] hover:bg-white border border-[#D1CEC6] p-3 text-[10px] text-[#1A1A1A] font-sans font-bold cursor-pointer transition-colors text-left"
              title="Increase Framing deck progress to 80%"
              id="btn-trigger-framing"
            >
              <TrendingUp className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>Framing 80%</span>
            </button>

            <button
              onClick={() => onTriggerEvent('HEAT_HYDRATION')}
              className="flex items-center gap-2 bg-[#F4F1EA] hover:bg-white border border-[#D1CEC6] p-3 text-[10px] text-[#1A1A1A] font-sans font-bold cursor-pointer transition-colors text-left"
              title="Log temperature spike shaded shelter hydration break"
              id="btn-trigger-heatwave"
            >
              <Flame className="w-4 h-4 text-[#C5A059] shrink-0" />
              <span>Heat hydration</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operations log feed console */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex items-center justify-between text-[10px] text-[#7A756C] font-sans uppercase tracking-widest font-bold">
          <span>Real-time Operations console</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]"></span>
          </span>
        </div>

        {/* Console display area */}
        <div className="bg-[#F4F1EA] border border-[#D1CEC6] p-4 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-3" id="simulator-console">
          {logs.slice(0, 18).map(log => {
            const dateObj = new Date(log.timestamp);
            const timeStr = dateObj.toTimeString().split(' ')[0];
            return (
              <div key={log.id} className="border-l border-[#D1CEC6] pl-3" id={`log-${log.id}`}>
                <div className="flex justify-between items-center text-[9px] font-sans uppercase font-bold text-[#7A756C]">
                  <span>[{timeStr}] - User: <span className="text-[#1A1A1A]">{log.user}</span></span>
                  <span className={`px-1.5 py-0.2 uppercase border font-bold text-[8px] tracking-wide ${getLogSeverityColorClass(log.severity)}`}>
                    {log.type}
                  </span>
                </div>
                <p className="text-[#1A1A1A] mt-1 font-sans italic text-xs leading-relaxed">{log.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
