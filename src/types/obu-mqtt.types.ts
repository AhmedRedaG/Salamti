export enum ObuMqttCommands {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  HEALTH = 'health',
  GPS = 'gps',
  HISTORY = 'history',
}

export type AccidentEvent =
  | 'AUTO_CRASH_DETECTED'
  | 'MANUAL_SOS_REQUEST'
  | 'ALARM_CANCELED_BY_DRIVER'
  | 'ACCIDENT_DATA_DUMP';

export type ObuDataDumpType =
  | 'PRE_CRASH_DATA'
  | 'POST_CRASH_DATA'
  | 'HISTORY_30_MIN';

export interface SensorReading {
  g: number; // accelForce (G-Force)
  x: number;
  y: number;
  lt: number;
  ln: number;
}

export interface ObuAccidentAlert {
  inst: string;
  event: AccidentEvent;
  peakG?: number;
  gyroX?: number;
  gyroY?: number;
  lat?: number;
  lng?: number;
}

export interface ObuDataDumpChunk {
  id?: string; // Request ID (if triggered via MQTT command)
  event?: 'ACCIDENT_DATA_DUMP'; // Auto sended after accident via MQTT
  inst: string;
  type: ObuDataDumpType;
  chunk: number;
  totalChunks: number;
  canceled: boolean;
  isDisposed: boolean;
  sensorsData: SensorReading[]; // Array of 10 sensor readings
}

// FEATURE PLAN
// export type ObuAutoResponse = ObuAccidentAlert | ObuDataDumpChunk;

export interface ObuHealthResponse {
  id: string;
  isDisposed: boolean;
  response: {
    status: 'HEALTH_OK';
    inst: string;
    state: number; // 0: INACTIVE, 1: ACTIVE, etc.
    version: string; // v1.0.0
    sim: string;
  };
}

export interface ObuGpsResponse {
  id: string;
  isDisposed: boolean;
  response: {
    status: 'GPS_LOC';
    inst: string;
    lat: number;
    lng: number;
  };
}
