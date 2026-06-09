import { ClienteData, UniversidadData, MovimientoData } from './types';

export const MOCK_UNIVERSIDADES: UniversidadData[] = [
  { id: 'uni-1', nombre: 'Universidad Nacional Autónoma de México (UNAM)' },
  { id: 'uni-2', nombre: 'Instituto Politécnico Nacional (IPN)' },
  { id: 'uni-3', nombre: 'Tecnológico de Monterrey (ITESM)' },
  { id: 'uni-4', nombre: 'Universidad de Guadalajara (UDG)' }
];

export const MOCK_CLIENTES: ClienteData[] = [
  {
    id: 'cli-1',
    nombre: 'Jorge Reyes',
    telefono: '5561234567',
    clasificacion: 'normal',
    comprasTotal: 12,
    comprasMes: 3,
    puntos: 1200,
    fechaRegistro: '2026-01-15T12:00:00Z'
  },
  {
    id: 'cli-2',
    nombre: 'Dra. Sofía Alarcón',
    telefono: '5549876543',
    clasificacion: 'doctor',
    comprasTotal: 25,
    comprasMes: 5,
    puntos: 3500,
    fechaRegistro: '2026-02-28T09:30:00Z'
  },
  {
    id: 'cli-3',
    nombre: 'Carlos Mendoza',
    telefono: '5511223344',
    clasificacion: 'estudiante',
    universidad: 'Universidad Nacional Autónoma de México (UNAM)',
    comprasTotal: 4,
    comprasMes: 2,
    puntos: 400,
    fechaRegistro: '2026-03-10T11:00:00Z'
  },
  {
    id: 'cli-4',
    nombre: 'Laura González Torres',
    telefono: '5577889900',
    clasificacion: 'estudiante',
    universidad: 'Tecnológico de Monterrey (ITESM)',
    comprasTotal: 1,
    comprasMes: 1,
    puntos: 100,
    fechaRegistro: '2026-05-20T16:45:00Z'
  }
];

export const MOCK_MOVIMIENTOS: MovimientoData[] = [
  {
    id: 'mov-1',
    clienteId: 'cli-1',
    tipo: 'compra',
    puntos: 500,
    fecha: '2026-06-01T10:30:00Z',
    monto: 5000,
    ticketNo: 'T-1001'
  },
  {
    id: 'mov-2',
    clienteId: 'cli-1',
    tipo: 'compra',
    puntos: 700,
    fecha: '2026-06-02T14:20:00Z',
    monto: 7000,
    ticketNo: 'T-1025'
  },
  {
    id: 'mov-3',
    clienteId: 'cli-2',
    tipo: 'compra',
    puntos: 4000,
    fecha: '2026-05-15T09:00:00Z',
    monto: 40000,
    ticketNo: 'T-0988'
  },
  {
    id: 'mov-4',
    clienteId: 'cli-2',
    tipo: 'canje',
    puntos: -500,
    fecha: '2026-05-28T18:15:00Z',
    concepto: 'Descuento por canje de puntos regulares'
  },
  {
    id: 'mov-5',
    clienteId: 'cli-3',
    tipo: 'compra',
    puntos: 300,
    fecha: '2026-06-05T12:00:00Z',
    monto: 3000,
    ticketNo: 'T-1152'
  },
  {
    id: 'mov-6',
    clienteId: 'cli-3',
    tipo: 'ajuste',
    puntos: 100,
    fecha: '2026-06-06T15:00:00Z',
    concepto: 'Bono de bienvenida estudiantil'
  },
  {
    id: 'mov-7',
    clienteId: 'cli-4',
    tipo: 'compra',
    puntos: 100,
    fecha: '2026-06-07T11:10:00Z',
    monto: 1000,
    ticketNo: 'T-1200'
  }
];
