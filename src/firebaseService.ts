import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { FirebaseConfigInput, ClienteData, UniversidadData, ConfiguracionPuntos, MovimientoData } from './types';

let currentApp: FirebaseApp | null = null;
let currentDb: Firestore | null = null;
let lastInitializedConfig: string | null = null;

/**
 * Initializes a Firebase connection using the provided credentials
 */
export function initializeFirebase(config: Omit<FirebaseConfigInput, 'collectionName' | 'searchField'>): Firestore {
  const configStr = JSON.stringify({
    apiKey: config.apiKey || '',
    authDomain: config.authDomain || '',
    projectId: config.projectId || '',
    storageBucket: config.storageBucket || '',
    messagingSenderId: config.messagingSenderId || '',
    appId: config.appId || ''
  });

  if (currentDb && lastInitializedConfig === configStr) {
    return currentDb;
  }

  const apps = getApps();
  
  if (apps.length > 0) {
    for (const app of apps) {
      try {
        deleteApp(app);
      } catch (err) {
        console.error('Error deleting previous Firebase app instance:', err);
      }
    }
  }

  currentApp = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  });

  currentDb = getFirestore(currentApp);
  lastInitializedConfig = configStr;
  return currentDb;
}

/**
 * Return currently active Firestore instance
 */
export function getActiveFirestore(): Firestore | null {
  return currentDb;
}

/**
 * Fetch all clients on collection 'clientes'
 */
export async function getClientes(db: Firestore): Promise<ClienteData[]> {
  const colRef = collection(db, 'clientes');
  const snapshot = await getDocs(colRef);
  const results: ClienteData[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      nombre: data.nombre || '',
      telefono: data.telefono || '',
      clasificacion: data.clasificacion || 'normal',
      universidad: data.universidad || data.escuela || '',
      comprasTotal: typeof data.comprasTotal === 'number' ? data.comprasTotal : 0,
      comprasMes: typeof data.comprasMes === 'number' ? data.comprasMes : 0,
      puntos: typeof data.puntos === 'number' ? data.puntos : 0,
      fechaRegistro: data.fechaRegistro || new Date().toISOString()
    });
  });
  return results;
}

/**
 * Adds a new client to Firestore
 */
export async function addCliente(
  db: Firestore, 
  clienteData: Omit<ClienteData, 'id'>
): Promise<string> {
  const colRef = collection(db, 'clientes');
  const docRef = await addDoc(colRef, {
    nombre: clienteData.nombre,
    telefono: clienteData.telefono,
    clasificacion: clienteData.clasificacion,
    universidad: clienteData.universidad || '',
    comprasTotal: clienteData.comprasTotal || 0,
    comprasMes: clienteData.comprasMes || 0,
    puntos: clienteData.puntos || 0,
    fechaRegistro: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Updates client fields in Firestore
 */
export async function updateCliente(
  db: Firestore,
  clienteId: string,
  updates: Partial<ClienteData>
): Promise<void> {
  const docRef = doc(db, 'clientes', clienteId);
  const firestoreUpdates: any = { ...updates };
  // Keep backward compatibility or rewrite
  if (updates.universidad !== undefined) {
    firestoreUpdates.universidad = updates.universidad;
  }
  await updateDoc(docRef, firestoreUpdates);
}

/**
 * Deletes a client from Firestore
 */
export async function deleteCliente(
  db: Firestore,
  clienteId: string
): Promise<void> {
  const docRef = doc(db, 'clientes', clienteId);
  await deleteDoc(docRef);
}

/**
 * Fetch all registered schools/unis on collection 'universidades'
 */
export async function getUniversidades(db: Firestore): Promise<UniversidadData[]> {
  const colRef = collection(db, 'universidades');
  const snapshot = await getDocs(colRef);
  const results: UniversidadData[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      nombre: data.nombre || ''
    });
  });
  return results;
}

/**
 * Adds a new university to Firestore
 */
export async function addUniversidad(
  db: Firestore, 
  name: string
): Promise<string> {
  const colRef = collection(db, 'universidades');
  const docRef = await addDoc(colRef, {
    nombre: name,
    fechaRegistro: new Date().toISOString()
  });
  return docRef.id;
}

/**
 * Updates a university name in Firestore
 */
export async function updateUniversidad(
  db: Firestore,
  id: string,
  nombre: string
): Promise<void> {
  const docRef = doc(db, 'universidades', id);
  await updateDoc(docRef, { nombre });
}

/**
 * Deletes a university from Firestore
 */
export async function deleteUniversidad(
  db: Firestore,
  id: string
): Promise<void> {
  const docRef = doc(db, 'universidades', id);
  await deleteDoc(docRef);
}

/**
 * Fetch point configurations from Firestore (document 'configuracion/puntos')
 */
export async function getConfiguracion(db: Firestore): Promise<ConfiguracionPuntos> {
  const docRef = doc(db, 'configuracion', 'puntos');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      pesosPorPunto: typeof data.pesosPorPunto === 'number' ? data.pesosPorPunto : 10,
      valorPuntoEnPesos: typeof data.valorPuntoEnPesos === 'number' ? data.valorPuntoEnPesos : 0.1
    };
  }
  // Default values
  return {
    pesosPorPunto: 10,
    valorPuntoEnPesos: 0.1
  };
}

/**
 * Save points configuration to Firestore
 */
export async function saveConfiguracion(
  db: Firestore,
  config: ConfiguracionPuntos
): Promise<void> {
  const docRef = doc(db, 'configuracion', 'puntos');
  await setDoc(docRef, config);
}

/**
 * Fetch all transaction/reward movements from Firestore collection 'movimientos'
 */
export async function getMovimientos(db: Firestore): Promise<MovimientoData[]> {
  const colRef = collection(db, 'movimientos');
  const snapshot = await getDocs(colRef);
  const results: MovimientoData[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    results.push({
      id: doc.id,
      clienteId: data.clienteId || '',
      tipo: data.tipo || 'ajuste',
      puntos: typeof data.puntos === 'number' ? data.puntos : 0,
      fecha: data.fecha || new Date().toISOString(),
      monto: typeof data.monto === 'number' ? data.monto : undefined,
      ticketNo: data.ticketNo || undefined,
      concepto: data.concepto || undefined,
      anteriorPuntos: typeof data.anteriorPuntos === 'number' ? data.anteriorPuntos : undefined
    });
  });
  return results;
}

/**
 * Adds a new movement transaction and returns its ID
 */
export async function addMovimiento(db: Firestore, mov: Omit<MovimientoData, 'id'>): Promise<string> {
  const colRef = collection(db, 'movimientos');
  const docRef = await addDoc(colRef, {
    clienteId: mov.clienteId,
    tipo: mov.tipo,
    puntos: mov.puntos,
    fecha: mov.fecha || new Date().toISOString(),
    monto: mov.monto !== undefined ? mov.monto : null,
    ticketNo: mov.ticketNo !== undefined ? mov.ticketNo : null,
    concepto: mov.concepto !== undefined ? mov.concepto : null,
    anteriorPuntos: mov.anteriorPuntos !== undefined ? mov.anteriorPuntos : null
  });
  return docRef.id;
}

/**
 * Modifies an existing movement's fields
 */
export async function updateMovimiento(db: Firestore, id: string, updates: Partial<MovimientoData>): Promise<void> {
  const docRef = doc(db, 'movimientos', id);
  const data: any = {};
  if (updates.tipo !== undefined) data.tipo = updates.tipo;
  if (updates.puntos !== undefined) data.puntos = updates.puntos;
  if (updates.monto !== undefined) data.monto = updates.monto;
  if (updates.ticketNo !== undefined) data.ticketNo = updates.ticketNo;
  if (updates.concepto !== undefined) data.concepto = updates.concepto;
  if (updates.fecha !== undefined) data.fecha = updates.fecha;
  await updateDoc(docRef, data);
}

/**
 * Deletes a movement from Firestore
 */
export async function deleteMovimiento(db: Firestore, id: string): Promise<void> {
  const docRef = doc(db, 'movimientos', id);
  await deleteDoc(docRef);
}
