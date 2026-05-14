import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { BrandingConfig } from '../branding.service';

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
  private static fallbackLogoBase64: string;

  /**
   * Load bundled logo as fallback base64 data URI (cached after first read)
   */
  private static getFallbackLogoBase64(): string {
    if (!this.fallbackLogoBase64) {
      const logoPath = path.join(__dirname, '..', 'templates', 'logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      this.fallbackLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    return this.fallbackLogoBase64;
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
   * Render an email template with data and optional branding.
   * Branding vars are prefixed with `brand_` in templates.
   */
  public static renderTemplate(
    templateName: string,
    data: EmailTemplateData,
    branding?: BrandingConfig,
  ): string {
    const contentTemplate = this.loadTemplate(templateName);
    const contentHtml = contentTemplate(data);
    const baseTemplate = this.getBaseTemplate();

    const fullData = {
      ...data,
      body: contentHtml,
      year: new Date().getFullYear(),
      // Branding vars — fall back to bundled logo if no BRAND_LOGO_BASE64 set
      brand_app_name: branding?.appName ?? 'MyApp',
      brand_support_email: branding?.supportEmail ?? '',
      brand_logo: branding?.logoBase64 || this.getFallbackLogoBase64(),
      brand_color: branding?.brandColor ?? '#1976D2',
      brand_color_dark: branding?.brandColorDark ?? '#1256A0',
      brand_website_url: branding?.websiteUrl ?? '#',
      brand_privacy_url: branding?.privacyPolicyUrl ?? '#',
      brand_terms_url: branding?.termsUrl ?? '#',
      brand_footer_tagline: branding?.footerTagline ?? '',
    };

    return baseTemplate(fullData);
  }

  public static renderForgotPasswordEmail(data: {
    toEmail: string; userName: string; otp: string; expiryMinutes?: number;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('forgot-password', {
      subject: 'Reset Your Password', headerTitle: 'Password Reset Request',
      toEmail: data.toEmail, userName: data.userName, otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    }, branding);
  }

  public static renderEmailVerificationEmail(data: {
    toEmail: string; userName: string; otp: string; expiryMinutes?: number;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('email-verification', {
      subject: 'Verify Your Email Address', headerTitle: 'Email Verification',
      toEmail: data.toEmail, userName: data.userName, otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    }, branding);
  }

  public static render2FAEmail(data: {
    toEmail: string; userName: string; otp: string; expiryMinutes?: number;
    loginTime?: string; loginLocation?: string; loginDevice?: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('login-2fa', {
      subject: 'Two-Factor Authentication Code', headerTitle: 'Login Verification',
      toEmail: data.toEmail, userName: data.userName, otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
      loginTime: data.loginTime || new Date().toLocaleString(),
      loginLocation: data.loginLocation || 'Unknown',
      loginDevice: data.loginDevice || 'Unknown',
    }, branding);
  }

  public static render2FASetupEmail(data: {
    toEmail: string; userName: string; otp: string; expiryMinutes?: number;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('2fa-setup', {
      subject: 'Enable Two-Factor Authentication', headerTitle: '2FA Setup',
      toEmail: data.toEmail, userName: data.userName, otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    }, branding);
  }

  public static renderWelcomeEmail(data: {
    toEmail: string; userName: string; userEmail: string; userRole: string; dashboardUrl?: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('welcome', {
      subject: `Welcome to ${branding?.appName ?? 'MyApp'}!`,
      headerTitle: 'Welcome Aboard!',
      toEmail: data.toEmail, userName: data.userName,
      userEmail: data.userEmail, userRole: data.userRole,
      dashboardUrl: data.dashboardUrl || '#',
      createdDate: new Date().toLocaleDateString(),
    }, branding);
  }

  public static renderNotificationEmail(data: {
    toEmail: string; userName: string; title: string; body: string;
    actionUrl?: string; actionLabel?: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('notification', {
      subject: data.title, headerTitle: data.title,
      toEmail: data.toEmail, userName: data.userName,
      title: data.title, body: data.body,
      actionUrl: data.actionUrl, actionLabel: data.actionLabel || 'Open App',
    }, branding);
  }

  public static renderDeviceUnenrollOtpEmail(data: {
    toEmail: string; userName: string; otp: string; expiryMinutes?: number;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('device-unenroll', {
      subject: 'Device Unenroll Confirmation OTP', headerTitle: 'Device Unenroll Confirmation',
      toEmail: data.toEmail, userName: data.userName, otp: data.otp,
      expiryMinutes: data.expiryMinutes || 10,
    }, branding);
  }

  public static renderAccountLockedEmail(data: {
    toEmail: string; userName: string; lockReason: string; lockedAt: string; unlocksAt: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('account-locked', {
      subject: 'Your Account Has Been Temporarily Locked', headerTitle: 'Security Alert',
      toEmail: data.toEmail, userName: data.userName,
      lockReason: data.lockReason, lockedAt: data.lockedAt, unlocksAt: data.unlocksAt,
    }, branding);
  }

  public static renderAccountSuspendedEmail(data: {
    toEmail: string; userName: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('account-suspended', {
      subject: 'Your Account Has Been Suspended', headerTitle: 'Account Suspended',
      toEmail: data.toEmail, userName: data.userName,
    }, branding);
  }

  public static renderSuspiciousLoginEmail(data: {
    toEmail: string; userName: string; loginTime: string; loginLocation: string;
    loginDevice: string; ipAddress: string;
  }, branding?: BrandingConfig): string {
    return this.renderTemplate('suspicious-login', {
      subject: 'New Login Detected from a Different Location',
      headerTitle: 'Security Alert',
      toEmail: data.toEmail, userName: data.userName,
      loginTime: data.loginTime, loginLocation: data.loginLocation,
      loginDevice: data.loginDevice, ipAddress: data.ipAddress,
    }, branding);
  }

  /**
   * Clear the template cache (useful for development)
   */
  public static clearCache(): void {
    this.templateCache.clear();
    this.baseTemplate = null as any;
  }
}
