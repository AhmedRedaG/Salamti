export interface BrevoMailOptions {
  sender: {
    email: string;
    name: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface CreateResetMailData {
  fullName: string;
  email: string;
  code: number;
}

export interface CreateVerifyMailData {
  fullName: string;
  email: string;
  verificationToken: string;
}

export interface CreateEmergencyMailData {
  contactName: string;
  contactEmail: string;
  driverName: string;
  driverPhone: string;
  accidentTime: Date;
  accidentLevel: string;
  accidentStatus: 'CONFIRMED' | 'COMPLETED';
  location: {
    lat: number;
    lng: number;
  } | null;
  // if completed
  paramedicObservations?: string | null;
  patientStatus?: string | null;
  transportingToHospital?: string | null;
}
