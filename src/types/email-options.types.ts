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
