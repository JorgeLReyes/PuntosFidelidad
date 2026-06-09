/**
 * ARCHIVO DE CONFIGURACIÓN CENTRALIZADA DE FIREBASE
 * 
 * Modifica las credenciales de abajo para conectar tu aplicación React
 * directamente con tu base de datos Firestore de producción.
 * Cuando exportes este proyecto, este archivo será el único punto de configuración.
 */
import { FirebaseConfigInput } from './types';

export const FIREBASE_DEFAULT_CONFIG: FirebaseConfigInput = {
  // CONFIGURACIÓN DE TU CONSOLA DE FIREBASE:
  apiKey: "AIzaSyAqqPc4KleUC1vordxmWSQ9_xc63Ss-p2M",
  authDomain: "puntos-4087c.firebaseapp.com",
  projectId: "puntos-4087c",
  storageBucket: "puntos-4087c.firebasestorage.app",
  messagingSenderId: "165270561370",
  appId: "1:165270561370:web:2da47611a9b637f9812e63",

  // DE CONFIGURACIÓN DE COLECCIÓN (FIRESTORE)
  collectionName: "personas_todo", // Nombre de colección por defecto
  searchField: "nombre"             // Campo por el cual realizar la consulta
};
