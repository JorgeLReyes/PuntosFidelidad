import React, { useState, useEffect } from 'react';
import { X, Search, DollarSign, Award, Ticket, UserCheck, ShoppingBag } from 'lucide-react';
import { ClienteData, ConfiguracionPuntos } from '../types';

interface AddCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: ClienteData[];
  config: ConfiguracionPuntos;
  onConfirmCompra: (clienteId: string, monto: number, ticketNo: string, puntosGanados: number) => Promise<void>;
}

export function AddCompraModal({
  isOpen,
  onClose,
  clientes,
  config,
  onConfirmCompra
}: AddCompraModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null);
  const [monto, setMonto] = useState<string>('');
  const [ticketNo, setTicketNo] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState(false);

  // Clear states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCliente(null);
      setMonto('');
      setTicketNo('');
      setErrorMsg('');
      setSuccessMsg('');
      setConfirmAction(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Search clients
  const filteredClientes = clientes.filter(c => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
  });

  // Calculate dynamic points
  const pesosPorPunto = config?.pesosPorPunto || 10;
  const numMonto = parseFloat(monto) || 0;
  const puntosGanados = Math.floor(numMonto / pesosPorPunto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!confirmAction) {
      setErrorMsg('Por favor confirma la acción antes de continuar.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedCliente) {
      setErrorMsg('Por favor selecciona un cliente de la lista.');
      return;
    }

    if (numMonto <= 0) {
      setErrorMsg('Por favor ingresa un monto válido mayor a 0 pesos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmCompra(selectedCliente.id, numMonto, ticketNo, puntosGanados);
      setSuccessMsg(`¡Compra registrada con éxito! Se sumaron ${puntosGanados} puntos a ${selectedCliente.nombre}.`);
      
      // Auto-close modal after brief confirmation
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la compra.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl animate-fadeIn border border-slate-100 my-8">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Añadir Compra
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Step 1: Select / Search Client */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Buscar y Seleccionar Cliente *
            </label>
            
            {selectedCliente ? (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-950 text-white flex items-center justify-center font-bold text-xs">
                    {selectedCliente.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedCliente.nombre}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Tel: {selectedCliente.telefono || 'Sin celular'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCliente(null)}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-rose-600 transition"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Escribe nombre o teléfono para buscar..."
                    className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                    autoFocus
                  />
                </div>

                {/* Found clients list */}
                <div className="border border-slate-100 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-50 bg-slate-50/50">
                  {filteredClientes.length === 0 ? (
                    <div className="p-3 text-center text-[10px] text-slate-400 font-medium">
                      No se encontraron resultados
                    </div>
                  ) : (
                    filteredClientes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCliente(c);
                          setSearchQuery('');
                        }}
                        className="w-full p-2.5 flex items-center justify-between text-left hover:bg-slate-100 transition"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-900">{c.nombre}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">{c.telefono}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                          {c.clasificacion === 'doctor' ? 'Doc' : c.clasificacion === 'estudiante' ? 'Estud' : 'Norm'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ticket/Purchase Number and Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
            {/* Purchase / Ticket reference number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Folio / Ticket de compra
              </label>
              <div className="relative">
                <Ticket className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketNo}
                  onChange={(e) => setTicketNo(e.target.value)}
                  placeholder="Ej. T-1052"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Monto de la compra */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Monto de la Compra *
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <input
                  type="number"
                  step="any"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej. 150"
                  className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dinamical Calculation Notice box */}
          {numMonto > 0 && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-150 space-y-1.5 animate-fadeIn">
              <p className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 leading-none">
                <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                Por esta compra de ${numMonto.toFixed(2)} ganará {puntosGanados} puntos
              </p>
              <p className="text-[9px] font-semibold text-emerald-600/90 font-mono">
                Referencia: 1 punto por cada ${pesosPorPunto.toFixed(2)} pesos gastados.
              </p>
            </div>
          )}

          {/* Confirmation Checkbox */}
          {selectedCliente && numMonto > 0 && !successMsg && (
            <div className="p-0.5 animate-fadeIn">
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={confirmAction}
                  onChange={(e) => setConfirmAction(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 mt-0.5 rounded text-slate-950 border-slate-300 focus:ring-slate-950 accent-slate-950 cursor-pointer disabled:opacity-50"
                />
                <span className="text-[11px] font-bold text-slate-700 leading-snug">
                  Confirmo que deseo registrar esta compra de ${numMonto.toFixed(2)} y sumar +{puntosGanados} pts a {selectedCliente.nombre}
                </span>
              </label>
            </div>
          )}

          {/* Messaging alerts */}
          {errorMsg && (
            <p className="text-rose-600 text-[11px] font-bold leading-tight">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-emerald-700 text-[11px] font-bold leading-tight bg-emerald-50 p-2.5 rounded-lg">{successMsg}</p>
          )}

          {/* Action trigger row */}
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
              disabled={isSubmitting || !selectedCliente || numMonto <= 0 || !confirmAction}
              className="px-4 py-2 bg-gray-950 hover:bg-gray-850 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Compra'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
