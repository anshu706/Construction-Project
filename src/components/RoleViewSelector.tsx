/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, UserRole } from '../types';
import { USER_PROFILES } from '../data';
import { Briefcase, HardHat, IndianRupee, Award, Shield } from 'lucide-react';

interface RoleViewSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'ProjectManager':
      return <Briefcase className="w-4 h-4 text-[#C5A059]" id="icon-pm" />;
    case 'SiteSupervisor':
      return <HardHat className="w-4 h-4 text-[#A89F91]" id="icon-sup" />;
    case 'FinanceManager':
      return <IndianRupee className="w-4 h-4 text-[#1A1A1A]" id="icon-fin" />;
    case 'Executive':
      return <Award className="w-4 h-4 text-[#C5A059]" id="icon-exec" />;
    case 'SafetyOfficer':
      return <Shield className="w-4 h-4 text-[#B71C1C]" id="icon-safe" />;
  }
};

export const RoleViewSelector: React.FC<RoleViewSelectorProps> = ({ currentRole, onRoleChange }) => {
  const activeProfile = USER_PROFILES.find(p => p.role === currentRole) || USER_PROFILES[0];

  return (
    <div className="bg-white border border-[#D1CEC6] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full shadow-sm" id="role-view-selector">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={activeProfile.avatar}
            alt={activeProfile.name}
            className="w-14 h-14 rounded-full border border-[#D1CEC6] p-0.5 object-cover"
            id="active-user-avatar"
          />
          <div className="absolute -bottom-1 -right-1 bg-white border border-[#D1CEC6] rounded-full p-1 shadow-sm">
            {getRoleIcon(activeProfile.role)}
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[#1A1A1A] font-sans font-bold text-lg" id="active-user-name">{activeProfile.name}</h4>
            <span className="text-[9px] bg-[#E5E2D9] text-[#1A1A1A] border border-[#D1CEC6] rounded-sm px-2 py-0.5 uppercase font-sans tracking-widest font-bold">
              {activeProfile.role.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
          <p className="text-[#7A756C] font-sans text-xs mt-0.5">{activeProfile.title} • <span className="text-[#C5A059] font-bold">{activeProfile.department}</span></p>
          <p className="text-[#8B8B8B] text-[11px] italic mt-1 font-sans hidden sm:block">Focus: {activeProfile.focus}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-[10px] text-[#7A756C] font-bold uppercase tracking-[0.2em] font-sans">Simulate Stakeholder View:</span>
        <div className="flex flex-wrap gap-1 bg-[#F4F1EA] p-1 border border-[#D1CEC6]">
          {USER_PROFILES.map(profile => {
            const isActive = profile.role === currentRole;
            return (
              <button
                key={profile.role}
                onClick={() => onRoleChange(profile.role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-sans uppercase tracking-wider font-bold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white shadow-sm'
                    : 'text-[#7A756C] hover:text-[#1A1A1A] hover:bg-white/50'
                }`}
                id={`btn-role-${profile.role.toLowerCase()}`}
              >
                {getRoleIcon(profile.role)}
                <span>{profile.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
