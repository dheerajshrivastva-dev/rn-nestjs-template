import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BrandingConfig {
  appName: string;
  supportEmail: string;
  logoBase64: string;       // full data URI: "data:image/png;base64,..."
  brandColor: string;       // hex: "#1976D2"
  brandColorDark: string;   // hex: "#1256A0" — used for gradient end
  websiteUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  footerTagline: string;
}

@Injectable()
export class BrandingService {
  private readonly config: BrandingConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      appName: this.configService.get('BRAND_APP_NAME') || 'MyApp',
      supportEmail: this.configService.get('BRAND_SUPPORT_EMAIL') || this.configService.get('SMTP_FROM_EMAIL') || 'support@example.com',
      logoBase64: this.configService.get('BRAND_LOGO_BASE64') || '',
      brandColor: this.configService.get('BRAND_COLOR') || '#1976D2',
      brandColorDark: this.configService.get('BRAND_COLOR_DARK') || '#1256A0',
      websiteUrl: this.configService.get('BRAND_WEBSITE_URL') || '#',
      privacyPolicyUrl: this.configService.get('BRAND_PRIVACY_URL') || '#',
      termsUrl: this.configService.get('BRAND_TERMS_URL') || '#',
      footerTagline: this.configService.get('BRAND_FOOTER_TAGLINE') || '',
    };
  }

  get(): BrandingConfig {
    return this.config;
  }
}
