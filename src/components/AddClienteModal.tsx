import React, { useState } from 'react';
import { X, GraduationCap, Plus } from 'lucide-react';
import { ClassType, ClienteData, UniversidadData } from '../types';

interface AddClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newCliente: Omit<ClienteData, 'id'>) => Promise<void>;
  universidades: UniversidadData[];
  onAddUniversidad: (name: string) => Promise<string>;
}

export function AddClienteModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  universidades, 
  onAddUniversidad 
}: AddClienteModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clasificacion, setClasificacion] = useState<ClassType>('normal');
  const [selectedUniversidad, setSelectedUniversidad] = useState('');
  const [isAddingNewUni, setIsAddingNewUni] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      setErrorMsg('El nombre es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalUniversidad = '';

      // Handle student details
      if (clasificacion === 'estudiante') {
        if (isAddingNewUni) {
          const trimmedUni = newUniName.trim();
          if (!trimmedUni) {
            throw new Error('Debes ingresar el nombre de la nueva universidad.');
          }
          // Request add to Firestore immediately
          await onAddUniversidad(trimmedUni);
          finalUniversidad = trimmedUni;
        } else {
          if (!selectedUniversidad) {
            throw new Error('Por favor selecciona una universidad o agrega una nueva.');
          }
          finalUniversidad = selectedUniversidad;
        }
      }

      const clientObj: Omit<ClienteData, 'id'> = {
        nombre: trimmedNombre,
        telefono: telefono.trim(),
        clasificacion,
        universidad: clasificacion === 'estudiante' ? finalUniversidad : undefined,
        comprasTotal: 0,
        comprasMes: 0,
        puntos: 0
      };

      await onAdd(clientObj);
      
      // Clean form fields
      setNombre('');
      setTelefono('');
      setClasificacion('normal');
      setSelectedUniversidad('');
      setNewUniName('');
      setIsAddingNewUni(false);
      
      // Close Modal
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      
      {/* Absolute backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-fadeIn border border-slate-100">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Nuevo Cliente
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Nombre input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Jorge Reyes"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              required
              autoFocus
            />
          </div>

          {/* Teléfono input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Teléfono
            </label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 5561234567"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Clasificación Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Clasificación *
            </label>
            <select
              value={clasificacion}
              onChange={(e) => {
                const val = e.target.value as ClassType;
                setClasificacion(val);
                if (val === 'estudiante' && universidades.length > 0 && !selectedUniversidad) {
                  setSelectedUniversidad(universidades[0].nombre);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            >
              <option value="normal">Cliente Normal</option>
              <option value="doctor">Doctor</option>
              <option value="estudiante">Estudiante</option>
            </select>
          </div>

          {/* Universities list for students */}
          {clasificacion === 'estudiante' && (
            <div className="bg-violet-50/60 p-3.5 rounded-xl border border-violet-100 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-violet-700 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                  Universidad
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewUni(!isAddingNewUni);
                    setNewUniName('');
                  }}
                  className="text-[9px] font-bold text-violet-700 hover:underline"
                >
                  {isAddingNewUni ? 'Ver registradas' : '+ Agregar Universidad'}
                </button>
              </div>

              {isAddingNewUni ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-violet-600 block">
                    Nombre Universidad *
                  </label>
                  <input
                    type="text"
                    value={newUniName}
                    onChange={(e) => setNewUniName(e.target.value)}
                    placeholder="Ej. UNAM, Valle de México, etc."
                    className="w-full px-3 py-1.5 bg-white border border-violet-200 rounded-lg text-xs font-semibold text-gray-800 outline-none"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-violet-600 block">
                    Selecciona una *
                  </label>
                  {universidades.length === 0 ? (
                    <div className="text-xs text-violet-600 font-semibold bg-white p-2.5 border border-dashed border-violet-200 rounded-lg flex items-center justify-between">
                      <span>No hay cargadas aún.</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewUni(true)}
                        className="text-[9px] uppercase font-bold text-violet-850 bg-violet-100 px-1.5 py-0.5 rounded"
                      >
                        Crear nueva
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedUniversidad}
                      onChange={(e) => setSelectedUniversidad(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-violet-200 rounded-lg text-xs font-semibold text-gray-800 outline-none"
                    >
                      <option value="">-- Selecciona --</option>
                      {universidades.map((uni) => (
                        <option key={uni.id} value={uni.nombre}>
                          {uni.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <p className="text-rose-600 text-[11px] font-bold leading-tight">{errorMsg}</p>
          )}

          {/* Controls */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-950 hover:bg-gray-850 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              {isSubmitting ? 'Registrando...' : 'Agregar'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
