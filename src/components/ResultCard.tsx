import React from 'react';
import { Phone, Award, ShoppingBag } from 'lucide-react';
import { ClienteData } from '../types';

interface ResultCardProps {
  person: ClienteData;
  onClick: () => void;
}

// Generate initials from name, max 2 letters (e.g. "Jorge Reyes" -> "JR")
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ResultCard({ person, onClick }: ResultCardProps) {
  // Tag configuration based on classification
  const getBadgeStyle = () => {
    switch (person.clasificacion) {
      case 'doctor':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'estudiante':
        return 'bg-violet-50 text-violet-700 border-violet-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-150';
    }
  };

  const getBadgeLabel = () => {
    switch (person.clasificacion) {
      case 'doctor':
        return 'Doctor(a)';
      case 'estudiante':
        return person.universidad ? `Estud. (${person.universidad})` : 'Estudiante';
      default:
        return 'Cliente Normal';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:shadow-md cursor-pointer transition-all duration-200 hover:border-slate-350 flex items-center justify-between gap-4"
      id={`cliente-card-${person.id}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-grow">
        {/* Initials circle */}
        <div className="w-10 h-10 rounded-xl bg-gray-950 text-white flex items-center justify-center font-extrabold text-xs tracking-wider shadow-inner shrink-0 leading-none">
          {getInitials(person.nombre || '')}
        </div>

        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3 className="font-sans font-extrabold text-xs sm:text-sm text-slate-950 truncate leading-none">
              {person.nombre || 'Sin nombre'}
            </h3>
            
            {/* Categorization Badge */}
            <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none ${getBadgeStyle()} max-w-[140px] truncate`}>
              {getBadgeLabel()}
            </span>
          </div>

          {/* Telephone, Purchases, Points info row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-1">
            {person.telefono && (
              <span className="font-semibold select-all font-mono text-slate-450 mr-1 flex items-center gap-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {person.telefono}
              </span>
            )}

            <span className="font-semibold text-slate-450 inline-flex items-center gap-0.5">
              <ShoppingBag className="w-3 h-3 text-slate-400" />
              <span>
                {person.comprasTotal} Compras
              </span>
            </span>

            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-100 flex items-center gap-0.5 leading-none text-[9px]">
              <Award className="w-3 h-3 text-emerald-500" />
              <span>{person.puntos} pts</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* Light chevron arrow on the right side */}
      <div className="text-slate-300 transition-colors pr-1 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
