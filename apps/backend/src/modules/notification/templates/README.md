# Email Templates

This directory contains Handlebars (.hbs) email templates for the Demigod application.

## Template Structure

### Base Template
- **base.hbs**: The main wrapper template with header, footer, and styling

### Auth Templates
- **forgot-password.hbs**: Password reset OTP email
- **email-verification.hbs**: Email verification OTP
- **login-2fa.hbs**: Two-factor authentication login code
- **welcome.hbs**: Welcome email after successful registration

## Usage

### Import the Utility

```typescript
import { EmailTemplateUtil } from './utils/email-template.util';
```

### Render Templates

#### Forgot Password Email
```typescript
const html = EmailTemplateUtil.renderForgotPasswordEmail({
  toEmail: 'user@example.com',
  userName: 'John Doe',
  otp: '123456',
  expiryMinutes: 10
});
```

#### Email Verification
```typescript
const html = EmailTemplateUtil.renderEmailVerificationEmail({
  toEmail: 'user@example.com',
  userName: 'John Doe',
  otp: '654321',
  expiryMinutes: 10
});
```

#### Two-Factor Authentication
```typescript
const html = EmailTemplateUtil.render2FAEmail({
  toEmail: 'user@example.com',
  userName: 'John Doe',
  otp: '789012',
  expiryMinutes: 5,
  loginTime: new Date().toLocaleString(),
  loginLocation: 'New York, USA',
  loginDevice: 'Chrome on Windows'
});
```

#### Welcome Email
```typescript
const html = EmailTemplateUtil.renderWelcomeEmail({
  toEmail: 'user@example.com',
  userName: 'John Doe',
  userEmail: 'user@example.com',
  userRole: 'User',
  dashboardUrl: 'https://app.demigod.com/dashboard'
});
```

### Using in Notification Service

```typescript
import { EmailTemplateUtil } from './utils/email-template.util';
import { EmailQueue } from './entities/email-queue.entity';

async sendPasswordResetEmail(userEmail: string, userName: string, otp: string) {
  const htmlContent = EmailTemplateUtil.renderForgotPasswordEmail({
    toEmail: userEmail,
    userName: userName,
    otp: otp,
    expiryMinutes: 10
  });

  const emailQueue = new EmailQueue();
  emailQueue.toEmail = userEmail;
  emailQueue.toName = userName;
  emailQueue.subject = 'Reset Your Password';
  emailQueue.bodyHtml = htmlContent;
  emailQueue.emailType = EmailType.PASSWORD_RESET;
  // ... set other properties

  await this.emailQueueRepository.save(emailQueue);
}
```

## Template Variables

### Common Variables (Available in all templates)
- `{{subject}}` - Email subject
- `{{headerTitle}}` - Title displayed in header
- `{{toEmail}}` - Recipient email address
- `{{userName}}` - Recipient's name
- `{{year}}` - Current year (auto-injected)

### Template-Specific Variables

#### Forgot Password / Email Verification / 2FA
- `{{otp}}` - One-time password code
- `{{expiryMinutes}}` - OTP expiry time in minutes

#### Login 2FA Only
- `{{loginTime}}` - Login attempt timestamp
- `{{loginLocation}}` - Geographic location
- `{{loginDevice}}` - Device/browser information

#### Welcome Email
- `{{userEmail}}` - User's email
- `{{userRole}}` - User's role (User, Admin, etc.)
- `{{dashboardUrl}}` - Link to dashboard
- `{{createdDate}}` - Account creation date

## Styling

All templates use the base template which includes:
- Responsive design (mobile-friendly)
- Professional gradient header
- Clean, modern layout
- Consistent branding
- Accessible color scheme

## Adding New Templates

1. Create a new `.hbs` file in the `templates/` directory
2. Add the content template (without header/footer)
3. Add a render method in `email-template.util.ts`:

```typescript
public static renderYourNewEmail(data: YourDataInterface): string {
  return this.renderTemplate('your-template-name', {
    subject: 'Your Subject',
    headerTitle: 'Your Header',
    ...data
  });
}
```

## Template Cache

Templates are cached in memory after first load. To clear the cache (useful in development):

```typescript
EmailTemplateUtil.clearCache();
```

## Testing Templates

You can test templates by rendering them and saving to an HTML file:

```typescript
const html = EmailTemplateUtil.renderForgotPasswordEmail({
  toEmail: 'test@example.com',
  userName: 'Test User',
  otp: '123456'
});

fs.writeFileSync('test-email.html', html);
```

Then open `test-email.html` in a browser to preview.

## Email Client Compatibility

These templates are tested and compatible with:
- Gmail
- Outlook
- Apple Mail
- Yahoo Mail
- Mobile email clients (iOS, Android)

The templates use inline styles and table-based layouts for maximum compatibility.
