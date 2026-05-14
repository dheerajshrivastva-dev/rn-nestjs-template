import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { Client } from '../../client/entities/client.entity';
import type { EmiPayment } from '../../client/entities/emi-payment.entity';

export interface EmailTemplateData {
  subject: string;
  headerTitle: string;
  toEmail: string;
  userName?: string;
  otp?: string;
  expiryMinutes?: number;
  dashboardUrl?: string;
  userEmail?: string;
  userRole?: string;
  createdDate?: string;
  loginTime?: string;
  loginLocation?: string;
  loginDevice?: string;
  [key: string]: any;
}

export class EmailTemplateUtil {
  private static templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  private static baseTemplate: HandlebarsTemplateDelegate;
  private static logoBase64: string;

  /**
   * Load logo as base64 data URI (cached after first read)
   */
  private static getLogoBase64(): string {
    if (!this.logoBase64) {
      const logoPath = path.join(__dirname, '..', 'templates', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    return this.logoBase64;
  }

  /**
   * Load and compile a Handlebars template
   */
  private static loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      `${templateName}.hbs`
    );

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);

    this.templateCache.set(templateName, compiledTemplate);
    return compiledTemplate;
  }

  /**
   * Load the base template
   */
  private static getBaseTemplate(): HandlebarsTemplateDelegate {
    if (!this.baseTemplate) {
      this.baseTemplate = this.loadTemplate('base');
    }
    return this.baseTemplate;
  }

  /**
   * Render an email template with data
   */
  public static renderTemplate(
    templateName: string,
    data: EmailTemplateData
  ): string {
    // Load the content template
    const contentTemplate = this.loadTemplate(templateName);

    // Render the content
    const contentHtml = contentTemplate(data);

    // Load the base template
    const baseTemplate = this.getBaseTemplate();

    // Merge content into base template
    const fullData = {
      ...data,
      body: contentHtml,
      year: new Date().getFullYear(),
    };

    return baseTemplate(fullData);
  }

  /**
   * Render forgot password email
   */
  public static renderForgotPasswordEmail(data: {
    toEmail: string;
    userName: string;
    otp: string;
    expiryMinutes?: number;
  }): string {
    return this.renderTemplate('forgot-password', {
      subject: 'Reset Your Password',
      headerTitle: 'Password Reset Request',
      toEmail: data.toEmail,
      userName: data.userName,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    });
  }

  /**
   * Render email verification email
   */
  public static renderEmailVerificationEmail(data: {
    toEmail: string;
    userName: string;
    otp: string;
    expiryMinutes?: number;
  }): string {
    return this.renderTemplate('email-verification', {
      subject: 'Verify Your Email Address',
      headerTitle: 'Email Verification',
      toEmail: data.toEmail,
      userName: data.userName,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    });
  }

  /**
   * Render 2FA login email (sent during login when 2FA is already enabled)
   */
  public static render2FAEmail(data: {
    toEmail: string;
    userName: string;
    otp: string;
    expiryMinutes?: number;
    loginTime?: string;
    loginLocation?: string;
    loginDevice?: string;
  }): string {
    return this.renderTemplate('login-2fa', {
      subject: 'Two-Factor Authentication Code',
      headerTitle: 'Login Verification',
      toEmail: data.toEmail,
      userName: data.userName,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
      loginTime: data.loginTime || new Date().toLocaleString(),
      loginLocation: data.loginLocation || 'Unknown',
      loginDevice: data.loginDevice || 'Unknown',
    });
  }

  /**
   * Render 2FA setup email (sent when the user is enabling 2FA for the first time)
   */
  public static render2FASetupEmail(data: {
    toEmail: string;
    userName: string;
    otp: string;
    expiryMinutes?: number;
  }): string {
    return this.renderTemplate('2fa-setup', {
      subject: 'Enable Two-Factor Authentication',
      headerTitle: '2FA Setup',
      toEmail: data.toEmail,
      userName: data.userName,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    });
  }

  /**
   * Render welcome email
   */
  public static renderWelcomeEmail(data: {
    toEmail: string;
    userName: string;
    userEmail: string;
    userRole: string;
    dashboardUrl?: string;
  }): string {
    return this.renderTemplate('welcome', {
      subject: 'Welcome to Demigod!',
      headerTitle: 'Welcome Aboard!',
      toEmail: data.toEmail,
      userName: data.userName,
      userEmail: data.userEmail,
      userRole: data.userRole,
      dashboardUrl: data.dashboardUrl || '#',
      createdDate: new Date().toLocaleDateString(),
    });
  }

  /**
   * Render a generic notification email.
   * Used as the fallback template for all business event notifications
   * (order approved, key transfer, payment reminder, etc.)
   */
  public static renderNotificationEmail(data: {
    toEmail: string;
    userName: string;
    title: string;
    body: string;
    actionUrl?: string;
    actionLabel?: string;
  }): string {
    return this.renderTemplate('notification', {
      subject: data.title,
      headerTitle: data.title,
      toEmail: data.toEmail,
      userName: data.userName,
      title: data.title,
      body: data.body,
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel || 'Open App',
    });
  }

  /**
   * Render device unenroll OTP email (sent to retailer before unenrolling a device)
   */
  public static renderDeviceUnenrollOtpEmail(data: {
    toEmail: string;
    userName: string;
    otp: string;
    expiryMinutes?: number;
    client?: Client;
    emiRecords?: EmiPayment[];
  }): string {
    const c = data.client;
    const emis = data.emiRecords ?? [];
    const paidEmis = emis.filter((e) => e.status === 'paid').length;
    const missedEmis = emis.filter((e) => e.status === 'missed').length;
    const upcomingEmis = emis.filter((e) => e.status === 'upcoming').length;
    const totalPaid = emis
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const remaining = emis
      .filter((e) => e.status !== 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return this.renderTemplate('device-unenroll', {
      subject: 'Device Unenroll Confirmation OTP',
      headerTitle: 'Device Unenroll Confirmation',
      toEmail: data.toEmail,
      userName: data.userName,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
      // Client info
      hasClient: !!c,
      clientName: c?.clientName,
      clientEmail: c?.clientEmail,
      clientPhone: c?.clientPhone1,
      imei1: c?.actualImei1 ?? c?.imei1,
      imei2: c?.actualImei2 ?? c?.imei2,
      deviceModel: c?.deviceModel ?? c?.modelName,
      deviceBrand: c?.deviceManufacturer ?? c?.brand,
      clientAddress: c?.address
        ? [c.address.street, c.address.city, c.address.state, c.address.postalCode]
            .filter(Boolean)
            .join(', ')
        : null,
      // EMI summary
      hasEmi: emis.length > 0,
      totalEmis: emis.length,
      paidEmis,
      missedEmis,
      upcomingEmis,
      emiAmount: c?.emiAmount,
      totalAmount: c?.totalAmount,
      downPayment: c?.downPayment,
      totalPaid: totalPaid.toFixed(2),
      remainingAmount: remaining.toFixed(2),
    });
  }

  /**
   * Render account locked email (sent when login threshold is crossed)
   */
  public static renderAccountLockedEmail(data: {
    toEmail: string;
    userName: string;
    lockReason: string;
    lockedAt: string;
    unlocksAt: string;
  }): string {
    return this.renderTemplate('account-locked', {
      subject: 'Your Account Has Been Temporarily Locked',
      headerTitle: 'Security Alert',
      toEmail: data.toEmail,
      userName: data.userName,
      lockReason: data.lockReason,
      lockedAt: data.lockedAt,
      unlocksAt: data.unlocksAt,
    });
  }

  /**
   * Render account suspended email (sent when a suspended user tries to log in)
   */
  public static renderAccountSuspendedEmail(data: {
    toEmail: string;
    userName: string;
  }): string {
    return this.renderTemplate('account-suspended', {
      subject: 'Your Account Has Been Suspended',
      headerTitle: 'Account Suspended',
      toEmail: data.toEmail,
      userName: data.userName,
    });
  }

  /**
   * Render suspicious login alert email (sent when login from new location is detected)
   */
  public static renderSuspiciousLoginEmail(data: {
    toEmail: string;
    userName: string;
    loginTime: string;
    loginLocation: string;
    loginDevice: string;
    ipAddress: string;
  }): string {
    return this.renderTemplate('suspicious-login', {
      subject: 'New Login Detected from a Different Location',
      headerTitle: 'Security Alert',
      toEmail: data.toEmail,
      userName: data.userName,
      loginTime: data.loginTime,
      loginLocation: data.loginLocation,
      loginDevice: data.loginDevice,
      ipAddress: data.ipAddress,
    });
  }

  /**
   * Clear the template cache (useful for development)
   */
  public static clearCache(): void {
    this.templateCache.clear();
    this.baseTemplate = null as any;
  }
}
