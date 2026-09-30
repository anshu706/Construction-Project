/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ProjectState } from '../types';
import { Settings, Download, Upload, RotateCcw, X, Check, Database, ShieldAlert } from 'lucide-react';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: ProjectState;
  onImportState: (importedState: Partial<ProjectState>) => void;
  onResetToDefaults: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportState,
  onResetToDefaults
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const exportData = JSON.stringify(state, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `constructiq_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportState(parsed);
        setImportStatus('✅ Project backup state successfully loaded!');
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1200);
      } catch (err) {
        setImportStatus('❌ Invalid JSON file structure.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#D1CEC6] w-full max-w-lg p-6 shadow-2xl relative font-sans animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[#7A756C] hover:text-[#1A1A1A]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#D1CEC6]">
          <Database className="w-5 h-5 text-[#C5A059]" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A1A1A]">
            Project Data & System Configuration
          </h3>
        </div>

        {importStatus && (
          <div className="mb-4 p-3 bg-[#F4F1EA] border border-[#C5A059] text-xs font-semibold text-[#1A1A1A]">
            {importStatus}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Export card */}
          <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA] flex items-center justify-between">
            <div>
              <span className="font-bold uppercase tracking-wider block text-[#1A1A1A]">Export Full Site JSON</span>
              <span className="text-[#7A756C] text-[11px]">Download all tasks, INR invoices, safety logs, and quality items.</span>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Export</span>
            </button>
          </div>

          {/* Import card */}
          <div className="p-4 border border-[#D1CEC6] bg-[#F4F1EA] flex items-center justify-between">
            <div>
              <span className="font-bold uppercase tracking-wider block text-[#1A1A1A]">Restore from Backup</span>
              <span className="text-[#7A756C] text-[11px]">Upload a previously saved constructiq .json state file.</span>
            </div>
            <label className="px-3 py-1.5 bg-white border border-[#D1CEC6] hover:border-[#C5A059] text-[#1A1A1A] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Upload</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Reset card */}
          <div className="p-4 border border-red-200 bg-red-50/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold uppercase tracking-wider block text-red-800">Reset to Factory Seed Data</span>
                <span className="text-red-700/80 text-[11px]">Re-initializes all tasks, INR budgets, and safety logs.</span>
              </div>
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onResetToDefaults();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-red-800 text-white font-bold text-[10px] uppercase"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1.5 border border-slate-300 text-[10px] uppercase"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
