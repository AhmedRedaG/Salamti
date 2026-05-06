import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BrevoMailOptions,
  CreateEmergencyMailData,
} from '../../../types/email-options.types';

@Injectable()
export class EmergencyAlertMail {
  constructor(private configService: ConfigService) {}

  createMail(mailData: CreateEmergencyMailData): BrevoMailOptions {
    const senderEmail = this.configService.get<string>('email.senderEmail')!;
    const supportEmail = this.configService.get<string>('email.supportEmail')!;
    const companyName = this.configService.get<string>('company.name')!;

    const statusTitle =
      mailData.accidentStatus === 'CONFIRMED'
        ? 'EMERGENCY: Accident Confirmed'
        : 'UPDATE: Accident Resolved';

    return {
      sender: {
        email: senderEmail,
        name: companyName,
      },
      to: [{ email: mailData.contactEmail, name: mailData.contactName }],
      subject: `${statusTitle} - ${mailData.driverName}`,
      textContent: this.generatePlainTextContent(
        supportEmail,
        companyName,
        mailData,
      ),
      htmlContent: this.generateHtmlContent(
        supportEmail,
        companyName,
        mailData,
      ),
    };
  }

  private generatePlainTextContent(
    supportEmail: string,
    companyName: string,
    data: CreateEmergencyMailData,
  ) {
    const statusText =
      data.accidentStatus === 'CONFIRMED'
        ? `This is an automated emergency alert. An accident involving ${data.driverName} has been CONFIRMED by the system.`
        : `This is an automated update. The accident response for ${data.driverName} has been COMPLETED by emergency services.`;

    const locationText = data.location
      ? `https://maps.google.com/?q=${data.location.lat},${data.location.lng}`
      : 'Location unavailable';

    let content = `
Hi ${data.contactName},

${statusText}

Driver Details:
- Name: ${data.driverName}
- Phone: ${data.driverPhone}

Accident Details:
- Time: ${data.accidentTime.toLocaleString()}
- Severity Level: ${data.accidentLevel}
- Location: ${locationText}
`;

    if (data.accidentStatus === 'COMPLETED') {
      content += `
Response Details:
- Patient Status: ${data.patientStatus || 'N/A'}
- Transporting To: ${data.transportingToHospital || 'N/A'}
- Observations: ${data.paramedicObservations || 'N/A'}
`;
    }

    content += `
Thanks,
The ${companyName} Team

Need help? Contact us at ${supportEmail}`;

    return content;
  }

  private generateHtmlContent(
    supportEmail: string,
    companyName: string,
    data: CreateEmergencyMailData,
  ) {
    const isConfirmed = data.accidentStatus === 'CONFIRMED';
    const headerColor = isConfirmed ? '#f44336' : '#4CAF50';
    const statusTitle = isConfirmed ? 'EMERGENCY ALERT' : 'ACCIDENT UPDATE';

    const statusText = isConfirmed
      ? `This is an automated emergency alert. An accident involving <strong>${data.driverName}</strong> has been CONFIRMED by the system.`
      : `This is an automated update. The accident response for <strong>${data.driverName}</strong> has been COMPLETED by emergency services.`;

    const locationHtml = data.location
      ? `<a href="https://maps.google.com/?q=${data.location.lat},${data.location.lng}" style="color: #2196F3;">View on Google Maps</a>`
      : 'Location unavailable';

    let completedHtml = '';
    if (!isConfirmed) {
      completedHtml = `
      <h3 style="color: #333; margin-top: 20px;">Response Details</h3>
      <ul style="color: #555; line-height: 1.6;">
        <li><strong>Patient Status:</strong> ${data.patientStatus || 'N/A'}</li>
        <li><strong>Transporting To:</strong> ${data.transportingToHospital || 'N/A'}</li>
        <li><strong>Observations:</strong> ${data.paramedicObservations || 'N/A'}</li>
      </ul>`;
    }

    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
  <h2 style="text-align: center; color: ${headerColor};">${statusTitle}</h2>
  
  <p style="font-size: 16px; color: #555;">
    Hi <strong>${data.contactName}</strong>,
  </p>
  
  <p style="font-size: 16px; color: #555;">
    ${statusText}
  </p>
  
  <h3 style="color: #333; margin-top: 20px;">Driver Details</h3>
  <ul style="color: #555; line-height: 1.6;">
    <li><strong>Name:</strong> ${data.driverName}</li>
    <li><strong>Phone:</strong> ${data.driverPhone}</li>
  </ul>

  <h3 style="color: #333; margin-top: 20px;">Accident Details</h3>
  <ul style="color: #555; line-height: 1.6;">
    <li><strong>Time:</strong> ${data.accidentTime.toLocaleString()}</li>
    <li><strong>Severity Level:</strong> ${data.accidentLevel}</li>
    <li><strong>Location:</strong> ${locationHtml}</li>
  </ul>

  ${completedHtml}

  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #aaa; text-align: center;">
    © ${new Date().getFullYear()} ${companyName}. All rights reserved.<br>
    Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #888;">${supportEmail}</a>
  </p>
</div>`;
  }
}
