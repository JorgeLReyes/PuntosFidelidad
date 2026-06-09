import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus,
  Search,
  Users,
  Settings,
  ShoppingBag,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { ClienteData, UniversidadData, ConfiguracionPuntos, MovimientoData } from './types';
import { AddClienteModal } from './components/AddClienteModal';
import { ResultCard } from './components/ResultCard';
import { ConfiguracionModal } from './components/ConfiguracionModal';
import { AddCompraModal } from './components/AddCompraModal';
import { ClienteDetailView } from './components/ClienteDetailView';
import { 
  initializeFirebase, 
  getActiveFirestore,
  getClientes,
  addCliente,
  updateCliente,
  deleteCliente,
  getUniversidades,
  addUniversidad,
  updateUniversidad,
  deleteUniversidad,
  getConfiguracion,
  saveConfiguracion,
  getMovimientos,
  addMovimiento,
  updateMovimiento,
  deleteMovimiento
} from './firebaseService';
import { MOCK_CLIENTES, MOCK_MOVIMIENTOS } from './mockData';
import { FIREBASE_DEFAULT_CONFIG } from './firebaseConfig';

export default function App() {
  const [isUsingMock, setIsUsingMock] = useState<boolean>(true);
  
  // Data lists
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [universidades, setUniversidades] = useState<UniversidadData[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoData[]>([]);
  
  // Global Point Rule setup
  const [config, setConfig] = useState<ConfiguracionPuntos>({
    pesosPorPunto: 10,
    valorPuntoEnPesos: 0.1
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Modals state managers
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isCompraModalOpen, setIsCompraModalOpen] = useState<boolean>(false);
  
  // Navigation active view ('list' or 'detail')
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [selectedCliente, setSelectedCliente] = useState<ClienteData | null>(null);

  // Progressive Loading limit state
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Initialize Connection on Mount directly from firebaseConfig.ts
  useEffect(() => {
    const initApp = async () => {
      const hasCredentials = 
        FIREBASE_DEFAULT_CONFIG.apiKey && 
        FIREBASE_DEFAULT_CONFIG.projectId &&
        !FIREBASE_DEFAULT_CONFIG.apiKey.includes('AIzaSy...');

      if (hasCredentials) {
        try {
          const db = initializeFirebase(FIREBASE_DEFAULT_CONFIG);
          setIsUsingMock(false);
          await loadAllData(db);
        } catch (err: any) {
          console.error('Error connecting with stored credentials:', err);
          loadMockFallbacks();
        }
      } else {
        loadMockFallbacks();
      }
    };

    initApp();
  }, []);

  // Fetch Firestore Data collections
  const loadAllData = async (db: any) => {
    setIsLoading(true);
    try {
      // 1. Load clients
      const dbClientes = await getClientes(db);
      setClientes(dbClientes);

      // 2. Load universities
      const dbUniversidades = await getUniversidades(db);
      setUniversidades(dbUniversidades);

      // 3. Load configurations
      const dbConfig = await getConfiguracion(db);
      setConfig(dbConfig);

      // 4. Load transaction history movements
      const dbMovimientos = await getMovimientos(db);
      setMovimientos(dbMovimientos);
    } catch (err: any) {
      console.error('Error fetching Firestore data:', err);
      loadMockFallbacks();
    } finally {
      setIsLoading(false);
    }
  };

  // Mock persistence helper
  const loadMockFallbacks = () => {
    setIsUsingMock(true);
    setClientes(MOCK_CLIENTES);
    setMovimientos(MOCK_MOVIMIENTOS);
    
    // Provide nice starter universities to test immediately
    setUniversidades([
      { id: 'uni-1', nombre: 'Universidad de Quintana Roo' },
      { id: 'uni-2', nombre: 'Instituto Tecnológico de Cancún' },
      { id: 'uni-3', nombre: 'Universidad del Valle de México' },
      { id: 'uni-4', text: 'Universidad La Salle de Cancún', nombre: 'Universidad La Salle de Cancún' }
    ]);

    const saved = localStorage.getItem('pts_mock_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {}
    }
  };

  // Search filtering logic (by Name or Telephone)
  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    const nombreMatch = (c.nombre || '').toLowerCase().includes(term);
    const telefonoMatch = (c.telefono || '').toLowerCase().includes(term);
    
    return nombreMatch || telefonoMatch;
  });

  // Calculate the progressive batch to render
  const visibleClientes = filteredClientes.slice(0, visibleCount);
  const hasMoreToLoad = filteredClientes.length > visibleCount;

  // Infinite Scroll scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Trigger scroll loading when the user is within 120px of the bottom of the visible document
      const threshold = 120;
      const reachedEnd = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - threshold);
      if (reachedEnd && hasMoreToLoad) {
        setVisibleCount(prev => Math.min(prev + 8, filteredClientes.length));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredClientes.length, visibleCount, hasMoreToLoad]);

  // Reset page counter whenever filter criteria changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  // Add Cliente Handler
  const handleAddCliente = async (newCliente: Omit<ClienteData, 'id'>) => {
    if (isUsingMock) {
      const tempId = `mock-${Date.now()}`;
      setClientes(prev => [{ id: tempId, ...newCliente }, ...prev]);
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await addCliente(db, newCliente);
        // Refresh client list
        const dbClientes = await getClientes(db);
        setClientes(dbClientes);
      } catch (err: any) {
        console.error('Error inserting client:', err);
        throw new Error('Error al registrar cliente: ' + err.message);
      }
    }
  };

  // Update Cliente Handler
  const handleUpdateCliente = async (id: string, updatedFields: Partial<ClienteData>) => {
    if (isUsingMock) {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await updateCliente(db, id, updatedFields);
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
      } catch (err: any) {
        console.error('Error updating client:', err);
        throw new Error('Error al actualizar: ' + err.message);
      }
    }
  };

  // Add Movimiento Handler
  const handleAddMovimiento = async (mov: Omit<MovimientoData, 'id'>) => {
    if (isUsingMock) {
      const tempId = `mov-${Date.now()}`;
      const newM = { id: tempId, ...mov };
      setMovimientos(prev => [newM, ...prev]);
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await addMovimiento(db, mov);
        // Refresh movements
        const dbMov = await getMovimientos(db);
        setMovimientos(dbMov);
      } catch (err: any) {
        console.error('Error recording movement:', err);
        throw new Error('Error asignando transacción: ' + err.message);
      }
    }
  };

  // Delete Movimiento Handler
  const handleDeleteMovimiento = async (id: string) => {
    if (isUsingMock) {
      setMovimientos(prev => prev.filter(m => m.id !== id));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await deleteMovimiento(db, id);
        // Refresh movements
        const dbMov = await getMovimientos(db);
        setMovimientos(dbMov);
      } catch (err: any) {
        console.error('Error deleting movement:', err);
        throw new Error('Error borrando transacción: ' + err.message);
      }
    }
  };

  // Update Movimiento Handler
  const handleUpdateMovimiento = async (id: string, updates: Partial<MovimientoData>) => {
    if (isUsingMock) {
      setMovimientos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await updateMovimiento(db, id, updates);
        // Refresh movements
        const dbMov = await getMovimientos(db);
        setMovimientos(dbMov);
      } catch (err: any) {
        console.error('Error modifying movement:', err);
        throw new Error('Error al modificar movimiento: ' + err.message);
      }
    }
  };

  // Delete Cliente Handler
  const handleDeleteCliente = async (id: string) => {
    if (isUsingMock) {
      setClientes(prev => prev.filter(c => c.id !== id));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      setIsLoading(true);
      try {
        await deleteCliente(db, id);
        setClientes(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        console.error('Error deleting client:', err);
        alert('Error al borrar cliente: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Register New University instantly
  const handleAddUniversidad = async (name: string): Promise<string> => {
    const trimmed = name.trim();
    if (isUsingMock) {
      const tempId = `mock-uni-${Date.now()}`;
      setUniversidades(prev => [...prev, { id: tempId, nombre: trimmed }]);
      return tempId;
    } else {
      const db = getActiveFirestore();
      if (!db) throw new Error('Base de datos no inicializada.');
      try {
        const id = await addUniversidad(db, trimmed);
        setUniversidades(prev => [...prev, { id, nombre: trimmed }]);
        return id;
      } catch (err: any) {
        console.error('Error saving university:', err);
        throw new Error('No se pudo guardar la universidad: ' + err.message);
      }
    }
  };

  // Edit University name
  const handleUpdateUniversidad = async (id: string, nombreName: string) => {
    if (isUsingMock) {
      setUniversidades(prev => prev.map(u => u.id === id ? { ...u, nombre: nombreName } : u));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await updateUniversidad(db, id, nombreName);
        setUniversidades(prev => prev.map(u => u.id === id ? { ...u, nombre: nombreName } : u));
      } catch (err: any) {
        throw new Error('No se pudo actualizar universidad: ' + err.message);
      }
    }
  };

  // Delete University from directory
  const handleDeleteUniversidad = async (id: string) => {
    if (isUsingMock) {
      setUniversidades(prev => prev.filter(u => u.id !== id));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await deleteUniversidad(db, id);
        setUniversidades(prev => prev.filter(u => u.id !== id));
      } catch (err: any) {
        throw new Error('No se pudo eliminar la universidad: ' + err.message);
      }
    }
  };

  // Point System Config saving
  const handleSavePointsConfig = async (newConfig: ConfiguracionPuntos) => {
    setConfig(newConfig);
    if (isUsingMock) {
      localStorage.setItem('pts_mock_config', JSON.stringify(newConfig));
    } else {
      const db = getActiveFirestore();
      if (!db) return;
      try {
        await saveConfiguracion(db, newConfig);
      } catch (err: any) {
        console.error('Error saving config document:', err);
        throw new Error('No se pudo guardar la configuración: ' + err.message);
      }
    }
  };

  // Record transaction & update points count for client
  const handleConfirmCompra = async (clienteId: string, monto: number, ticketNo: string, puntosGanados: number) => {
    const target = clientes.find(c => c.id === clienteId);
    if (!target) return;

    try {
      const originalPoints = target.puntos || 0;
      const originalTotal = target.comprasTotal || 0;
      const originalMes = target.comprasMes || 0;

      const newMov: Omit<MovimientoData, 'id'> = {
        clienteId,
        tipo: 'compra',
        puntos: puntosGanados,
        fecha: new Date().toISOString(),
        monto,
        ticketNo: ticketNo.trim() || undefined,
        anteriorPuntos: originalPoints
      };

      // 1. Add movement
      await handleAddMovimiento(newMov);

      // 2. Adjust client metrics
      await handleUpdateCliente(clienteId, {
        puntos: originalPoints + puntosGanados,
        comprasTotal: originalTotal + 1,
        comprasMes: originalMes + 1
      });
    } catch (err: any) {
      console.error('Error recording purchase:', err);
      throw new Error('No se pudo registrar la compra: ' + err.message);
    }
  };

  const handleOpenDetails = (person: ClienteData) => {
    setSelectedCliente(person);
    setActiveView('detail');
  };

  // Tab view: 'directorio' vs 'analisis'
  const [activeTab, setActiveTab] = useState<'directorio' | 'analisis'>('directorio');

  // Year-month filters defaulting to current month ("YYYY-MM")
  const [analisisDesde, setAnalisisDesde] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [analisisHasta, setAnalisisHasta] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  // Calculate purchase stats grouped by client for the filtered period
  const purchaseAnalysis = React.useMemo(() => {
    const startPeriod = analisisDesde;
    const endPeriod = analisisHasta;

    // Filter only movements of tipo 'compra'
    const periodCompras = movimientos.filter(mov => {
      if (mov.tipo !== 'compra') return false;
      const movPeriod = (mov.fecha || '').substring(0, 7); // First 7 chars: "YYYY-MM"
      if (!movPeriod) return false;
      return movPeriod >= startPeriod && movPeriod <= endPeriod;
    });

    // Group by customer
    const clientMap = new Map<string, { totalMonto: number; totalPuntos: number; count: number }>();
    periodCompras.forEach(mov => {
      const cid = mov.clienteId;
      const stats = clientMap.get(cid) || { totalMonto: 0, totalPuntos: 0, count: 0 };
      stats.totalMonto += (mov.monto || 0);
      stats.totalPuntos += (mov.puntos || 0);
      stats.count += 1;
      clientMap.set(cid, stats);
    });

    // Map to full records
    const results = Array.from(clientMap.entries()).map(([cid, stats]) => {
      const cli = clientes.find(c => c.id === cid);
      return {
        id: cid,
        nombre: cli ? cli.nombre : 'Cliente Eliminado',
        telefono: cli ? cli.telefono : '',
        clasificacion: cli ? cli.clasificacion : 'normal',
        puntosActuales: cli ? cli.puntos : 0,
        comprasCount: stats.count,
        comprasSumPesos: stats.totalMonto,
        puntosGanados: stats.totalPuntos,
        clienteObj: cli
      };
    });

    // Sort descending by total pesos purchased
    results.sort((a, b) => b.comprasSumPesos - a.comprasSumPesos);

    const totalPeriodMonto = periodCompras.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const totalPeriodPuntos = periodCompras.reduce((acc, curr) => acc + (curr.puntos || 0), 0);
    const totalPeriodCount = periodCompras.length;

    return {
      items: results,
      totalMonto: totalPeriodMonto,
      totalPuntos: totalPeriodPuntos,
      totalCount: totalPeriodCount
    };
  }, [movimientos, clientes, analisisDesde, analisisHasta]);

  const freshSelectedCliente = selectedCliente ? clientes.find(c => c.id === selectedCliente.id) || selectedCliente : null;

  return (
    <div className="min-h-screen bg-[#FBFBFD] pb-32 font-sans text-slate-800 antialiased font-sans">
      
      {/* Super simple centered layout container */}
      <main className="max-w-2xl mx-auto px-5 pt-12 space-y-6">
        
        {activeView === 'detail' && freshSelectedCliente ? (
          <ClienteDetailView
            cliente={freshSelectedCliente}
            universidades={universidades}
            config={config}
            movimientos={movimientos}
            onBack={() => {
              setActiveView('list');
              setSelectedCliente(null);
            }}
            onUpdateClienteInfo={handleUpdateCliente}
            onAddMovimiento={handleAddMovimiento}
            onDeleteMovimiento={handleDeleteMovimiento}
            onUpdateMovimiento={handleUpdateMovimiento}
          />
        ) : (
          <>
            {/* Header Row: Clientes, Config button, Add button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-slate-900" />
                <h1 className="text-sm font-black text-slate-950 uppercase tracking-tight font-sans">
                  Puntaje y Fidelidad
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Quick Settings Configuration button */}
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-200/80 rounded-xl transition-all duration-150 shadow-sm active:scale-95 cursor-pointer"
                  title="Configuración de Puntos y Escuelas"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Agregar Cliente button */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-850 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Tab Toggles */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('directorio')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                  activeTab === 'directorio'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Directorio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analisis')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                  activeTab === 'analisis'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ranking clientes
              </button>
            </div>

            {activeTab === 'directorio' ? (
              <>
                {/* Search Input block */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-450 transition-all font-sans placeholder:text-slate-400"
                  />
                </div>

                {/* Directory Card List */}
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
                        Cargando clientes...
                      </p>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence mode="popLayout">
                        {visibleClientes.length > 0 ? (
                          visibleClientes.map(person => (
                            <motion.div
                              key={person.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                            >
                              <ResultCard
                                person={person}
                                onClick={() => handleOpenDetails(person)}
                              />
                            </motion.div>
                          ))
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-16 bg-white border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs"
                          >
                            No se encontraron clientes para mostrar.
                            <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold tracking-widest font-mono">
                              {searchTerm ? 'Escribe otra consulta en el buscador' : 'Presiona "Agregar" para registrar un nuevo cliente'}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Progressive loading visual indicators and helpers */}
                      {hasMoreToLoad && (
                        <div className="p-4 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center gap-1.5 animate-pulse mt-4">
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Desplázate hacia abajo para cargar más clientes progresivamente</span>
                          <span className="text-slate-300">({visibleClientes.length} de {filteredClientes.length})</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              // Análisis y Resumen de Compras segment
              <div className="space-y-4 animate-fadeIn">
                
                {/* Period Selectors */}
                <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block pb-1 border-b">
                    Filtrar Período de Compras
                  </span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-500 uppercase block">Desde Mes</label>
                      <input
                        type="month"
                        value={analisisDesde}
                        onChange={(e) => {
                          if (e.target.value) setAnalisisDesde(e.target.value);
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 border rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer transition-colors"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold text-slate-500 uppercase block">Hasta Mes</label>
                      <input
                        type="month"
                        value={analisisHasta}
                        onChange={(e) => {
                          if (e.target.value) setAnalisisHasta(e.target.value);
                        }}
                        className="w-full bg-slate-50 hover:bg-slate-100 border rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer transition-colors"
                        min={analisisDesde}
                      />
                    </div>
                  </div>
                </div>

                {/* KPI Summary Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-white border rounded-2xl text-center shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block leading-tight">Compras</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">{purchaseAnalysis.totalCount}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-center shadow-sm">
                    <span className="text-[9px] font-extrabold text-emerald-600 uppercase block leading-tight">Total Facturado</span>
                    <span className="text-sm font-black text-emerald-800 block mt-0.5">${purchaseAnalysis.totalMonto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="p-3 bg-slate-950 text-white border border-slate-900 rounded-2xl text-center shadow-sm">
                    <span className="text-[9px] font-extrabold text-slate-300 uppercase block leading-tight">Ptos Otorgados</span>
                    <span className="text-sm font-black text-emerald-400 block mt-0.5">+{purchaseAnalysis.totalPuntos}</span>
                  </div>
                </div>

                {/* Grouped Clients List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                      Clientes que compraron en el período ({purchaseAnalysis.items.length})
                    </p>
                    <p className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                      Filtrado por Volumen de Compra
                    </p>
                  </div>

                  {purchaseAnalysis.items.length === 0 ? (
                    <div className="py-16 bg-white border border-dashed rounded-2xl text-center text-slate-400 text-xs">
                      No se registraron compras durante este período seleccionado.
                      <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold tracking-widest font-mono">
                        Cambia las fechas o añade una nueva compra para acumular.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {purchaseAnalysis.items.map((item, index) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (item.clienteObj) handleOpenDetails(item.clienteObj);
                          }}
                          className="bg-white border border-slate-100 hover:border-slate-350 p-4 rounded-2xl flex items-center justify-between hover:shadow-md transition-all duration-150 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Position Badge in Top list */}
                            <div className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 ${
                              index === 0 ? 'bg-amber-100 text-amber-800' :
                              index === 1 ? 'bg-slate-150 text-slate-700' :
                              index === 2 ? 'bg-orange-100 text-orange-850' : 'bg-slate-50 text-slate-400'
                            }`}>
                              #{index + 1}
                            </div>
                            
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-slate-950 truncate">
                                {item.nombre}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-mono">
                                <span className="bg-slate-50 px-1 py-0.2 ml-0.2 rounded font-bold">{item.comprasCount} {item.comprasCount === 1 ? 'compra' : 'compras'}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-bold">{item.telefono || 'Sin celular'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-black text-slate-900 block">
                              ${item.comprasSumPesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 block leading-none">
                              +{item.puntosGanados} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        )}

      </main>

      {/* Persistent floating action panel at the bottom center of the page (hidden during profile view) */}
      {activeView === 'list' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setIsCompraModalOpen(true)}
            className="px-6 py-3.5 bg-black border border-black text-white rounded-full text-xs font-[900] uppercase tracking-wider flex items-center gap-2 shadow-2xl active:scale-95 transition-all duration-250 ring-4 ring-slate-955/10 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Añadir Compra</span>
          </button>
        </div>
      )}

      {/* Add Cliente Modal Popup */}
      <AddClienteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCliente}
        universidades={universidades}
        onAddUniversidad={handleAddUniversidad}
      />

      {/* Configuration Settings Modal popup */}
      <ConfiguracionModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={handleSavePointsConfig}
        universidades={universidades}
        onAddUniversidad={handleAddUniversidad}
        onUpdateUniversidad={handleUpdateUniversidad}
        onDeleteUniversidad={handleDeleteUniversidad}
      />

      {/* Add Compra/Ticket Modal Pop up */}
      <AddCompraModal
        isOpen={isCompraModalOpen}
        onClose={() => setIsCompraModalOpen(false)}
        clientes={clientes}
        config={config}
        onConfirmCompra={handleConfirmCompra}
      />

    </div>
  );
}
