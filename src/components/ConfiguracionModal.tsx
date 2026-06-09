import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Trash2, Check, Settings2, Plus, AlertCircle } from 'lucide-react';
import { ConfiguracionPuntos, UniversidadData } from '../types';

interface ConfiguracionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguracionPuntos;
  onSaveConfig: (newConfig: ConfiguracionPuntos) => Promise<void>;
  universidades: UniversidadData[];
  onAddUniversidad: (nombre: string) => Promise<string>;
  onUpdateUniversidad: (id: string, nombre: string) => Promise<void>;
  onDeleteUniversidad: (id: string) => Promise<void>;
}

export function ConfiguracionModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  universidades,
  onAddUniversidad,
  onUpdateUniversidad,
  onDeleteUniversidad
}: ConfiguracionModalProps) {
  // Config state
  const [pesosPorPunto, setPesosPorPunto] = useState<string>('10');
  const [valorPuntoEnPesos, setValorPuntoEnPesos] = useState<string>('0.1');

  // University CRUD states
  const [editingUniId, setEditingUniId] = useState<string | null>(null);
  const [editingUniName, setEditingUniName] = useState<string>('');
  const [newUniName, setNewUniName] = useState<string>('');
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isAddingUni, setIsAddingUni] = useState(false);
  
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (config) {
      setPesosPorPunto(config.pesosPorPunto.toString());
      setValorPuntoEnPesos(config.valorPuntoEnPesos.toString());
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSavePointsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const numPesos = Math.max(1, parseFloat(pesosPorPunto) || 1);
      const numValor = Math.max(0, parseFloat(valorPuntoEnPesos) || 0);
      
      await onSaveConfig({
        pesosPorPunto: numPesos,
        valorPuntoEnPesos: numValor
      });
      showMsg('Configuración de puntos guardada correctamente.', 'success');
    } catch (err: any) {
      showMsg('Error al guardar configuración: ' + err.message, 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAddUni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim()) return;
    setIsAddingUni(true);
    try {
      await onAddUniversidad(newUniName.trim());
      setNewUniName('');
      showMsg('Universidad agregada.');
    } catch (err: any) {
      showMsg('Error al agregar universidad: ' + err.message, 'error');
    } finally {
      setIsAddingUni(false);
    }
  };

  const handleStartEditUni = (uni: UniversidadData) => {
    setEditingUniId(uni.id);
    setEditingUniName(uni.nombre);
  };

  const handleSaveEditUni = async (id: string) => {
    if (!editingUniName.trim()) return;
    try {
      await onUpdateUniversidad(id, editingUniName.trim());
      setEditingUniId(null);
      showMsg('Nombre de universidad actualizado.');
    } catch (err: any) {
      showMsg('Error al actualizar: ' + err.message, 'error');
    }
  };

  const handleDeleteUni = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar "${name}"? Los estudiantes registrados bajo esta universidad no se verán afectados directamente, pero no tendrán esta opción en la lista.`)) {
      try {
        await onDeleteUniversidad(id);
        showMsg('Universidad eliminada.');
      } catch (err: any) {
        showMsg('Error al eliminar: ' + err.message, 'error');
      }
    }
  };

  // Live conversions for example text
  const currentPesos = parseFloat(pesosPorPunto) || 10;
  const currentValor = parseFloat(valorPuntoEnPesos) || 0.1;

  const examplePointsEarned = Math.round(100 / currentPesos);
  const examplePointsValue = (100 * currentValor).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white rounded-2xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-fadeIn border border-slate-100 my-8">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Configuración del Sistema
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Status Message alert */}
          {message && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' : 'bg-rose-50 text-rose-800 border border-rose-100'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Points Rules form */}
          <form onSubmit={handleSavePointsConfig} className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-900 border-b border-slate-100 pb-1.5">
              Reglas de Puntos y Equivalencia
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Pesos por punto */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1 Punto por cada:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                  <input
                    type="number"
                    step="any"
                    value={pesosPorPunto}
                    onChange={(e) => setPesosPorPunto(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                    placeholder="Ej. 10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">gastados</span>
                </div>
                <p className="text-[10px] text-slate-450 italic pt-0.5 leading-snug">
                  Ejemplo: Por cada compra de $100 pesos, el cliente ganará <strong className="text-slate-900 font-extrabold">{examplePointsEarned} puntos</strong>.
                </p>
              </div>

              {/* Valor del punto en pesos */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  1 Punto equivale a:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={valorPuntoEnPesos}
                    onChange={(e) => setValorPuntoEnPesos(e.target.value)}
                    className="w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                    placeholder="Ej. 0.10"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">pesos MN</span>
                </div>
                <p className="text-[10px] text-slate-450 italic pt-0.5 leading-snug">
                  Ejemplo: Un acumulado de 100 puntos equivale a <strong className="text-slate-900 font-extrabold">${examplePointsValue} pesos</strong> de descuento.
                </p>
              </div>

            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingConfig ? 'Guardando...' : 'Guardar Reglas'}</span>
              </button>
            </div>
          </form>

          {/* Manage Universities (Universidades CRUD) */}
          <div className="space-y-3.5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-gray-900 border-b border-slate-100 pb-1.5">
              Administrar Universidades
            </h3>

            {/* Quick Add University Name Form */}
            <form onSubmit={handleAddUni} className="flex gap-2">
              <input
                type="text"
                value={newUniName}
                onChange={(e) => setNewUniName(e.target.value)}
                placeholder="Nombre de la nueva universidad..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
              />
              <button
                type="submit"
                disabled={isAddingUni || !newUniName.trim()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </form>

            {/* Universities list scroll */}
            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-50 bg-slate-50/50">
              {universidades.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No hay universidades registradas. Puedes agregar una arriba.
                </div>
              ) : (
                universidades.map((uni) => (
                  <div key={uni.id} className="p-2.5 flex items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition">
                    {editingUniId === uni.id ? (
                      <div className="flex-1 flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={editingUniName}
                          onChange={(e) => setEditingUniName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditUni(uni.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUniId(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-slate-800 truncate">{uni.nombre}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditUni(uni)}
                            className="p-1 hover:bg-slate-100 text-slate-450 hover:text-slate-800 rounded-lg transition"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUni(uni.id, uni.nombre)}
                            className="p-1 hover:bg-rose-50 text-slate-440 hover:text-rose-600 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
