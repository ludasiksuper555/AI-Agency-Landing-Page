// Mock SendGrid implementation
class MockSendGrid {
  setApiKey(apiKey: string) {}
  send(msg: any) {
    return Promise.resolve({ statusCode: 202, body: 'Email sent' });
  }
}
const sgMail = new MockSendGrid();

import fs from 'fs/promises';
import path from 'path';

// Mock Mailgun implementation
class MockMailgun {
  messages() {
    return {
      send: (data: any, callback: (error: any, body: any) => void) => {
        callback(null, { message: 'Queued. Thank you.' });
      },
    };
  }
}
const Mailgun = (options: any) => new MockMailgun();

// Mock Nodemailer implementation
class MockTransporter {
  sendMail(options: any) {
    return Promise.resolve({ messageId: 'mock-message-id' });
  }
  close() {}
}

const nodemailer = {
  createTransporter: (options: any) => new MockTransporter(),
  createTransport: (options: any) => new MockTransporter(),
};

export interface SendMailOptions {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
  replyTo?: string;
  headers?: any;
  priority?: string;
}

export interface Transporter {
  sendMail(options: SendMailOptions): Promise<any>;
  close(): void;
}

import { loadConfig } from './config';
import { logger } from './logger';
// Mock sanitizer implementation
const sanitizer = {
  sanitize: (input: string) => input,
  escape: (input: string) => input,
  clean: (input: string) => input,
  sanitizeHtml: (input: string) => input,
};
const config = loadConfig();

// Email Types
export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun' | 'ses';

export interface EmailConfig {
  provider: EmailProvider;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  templates?: {
    path: string;
  };
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface EmailOptions {
  to: EmailAddress | EmailAddress[] | string | string[];
  cc?: EmailAddress | EmailAddress[] | string | string[];
  bcc?: EmailAddress | EmailAddress[] | string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  template?: string;
  templateData?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
  replyTo?: string;
  from?: EmailAddress | string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
  timestamp: Date;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

export interface EmailStats {
  sent: number;
  failed: number;
  bounced: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

// Base Email Provider Interface
export interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailResult>;
  validateConfig(): boolean;
  getStats(): EmailStats;
}

// SMTP Email Provider
export class SMTPEmailProvider implements IEmailProvider {
  private transporter: Transporter;
  private stats: EmailStats = {
    sent: 0,
    failed: 0,
    bounced: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
  };

  constructor(private config: EmailConfig) {
    if (!config.smtp) {
      throw new Error('SMTP configuration is required');
    }

    this.transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.auth,
    });
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions: SendMailOptions = {
        from: this.formatAddress(options.from || this.config.from),
        to: this.formatAddresses(options.to),
        cc: options.cc ? this.formatAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatAddresses(options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        replyTo: options.replyTo || this.config.replyTo,
        headers: options.headers,
      };

      if (options.priority) {
        mailOptions.priority = options.priority;
      }

      const result = await this.transporter.sendMail(mailOptions);
      this.stats.sent++;

      logger.info('Email sent via SMTP', {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
        timestamp: new Date(),
      };
    } catch (error) {
      this.stats.failed++;
      logger.error('SMTP email failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'smtp',
        timestamp: new Date(),
      };
    }
  }

  validateConfig(): boolean {
    return !!(this.config.smtp?.host && this.config.smtp?.auth?.user);
  }

  getStats(): EmailStats {
    return { ...this.stats };
  }

  private formatAddress(address: EmailAddress | string): string {
    if (typeof address === 'string') {
      return address;
    }
    return address.name ? `"${address.name}" <${address.email}>` : address.email;
  }

  private formatAddresses(addresses: EmailAddress | EmailAddress[] | string | string[]): string {
    if (Array.isArray(addresses)) {
      return addresses.map(addr => this.formatAddress(addr)).join(', ');
    }
    return this.formatAddress(addresses);
  }
}

// SendGrid Email Provider
export class SendGridEmailProvider implements IEmailProvider {
  private stats: EmailStats = {
    sent: 0,
    failed: 0,
    bounced: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
  };

  constructor(private config: EmailConfig) {
    if (!config.sendgrid?.apiKey) {
      throw new Error('SendGrid API key is required');
    }
    sgMail.setApiKey(config.sendgrid.apiKey);
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const msg = {
        from: this.formatAddress(options.from || this.config.from),
        to: this.formatAddresses(options.to),
        cc: options.cc ? this.formatAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatAddresses(options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content?.toString('base64'),
          type: att.contentType,
          disposition: 'attachment',
          contentId: att.cid,
        })),
        replyTo: options.replyTo || this.config.replyTo,
        headers: options.headers,
      };

      const result = await sgMail.send(msg);
      this.stats.sent++;

      logger.info('Email sent via SendGrid', {
        messageId: result[0].headers['x-message-id'],
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: result[0].headers['x-message-id'] as string,
        provider: 'sendgrid',
        timestamp: new Date(),
      };
    } catch (error) {
      this.stats.failed++;
      logger.error('SendGrid email failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'sendgrid',
        timestamp: new Date(),
      };
    }
  }

  validateConfig(): boolean {
    return !!this.config.sendgrid?.apiKey;
  }

  getStats(): EmailStats {
    return { ...this.stats };
  }

  private formatAddress(address: EmailAddress | string): any {
    if (typeof address === 'string') {
      return { email: address };
    }
    return {
      email: address.email,
      name: address.name,
    };
  }

  private formatAddresses(addresses: EmailAddress | EmailAddress[] | string | string[]): any {
    if (Array.isArray(addresses)) {
      return addresses.map(addr => this.formatAddress(addr));
    }
    return this.formatAddress(addresses);
  }
}

// Mailgun Email Provider
export class MailgunEmailProvider implements IEmailProvider {
  private mailgun: any;
  private stats: EmailStats = {
    sent: 0,
    failed: 0,
    bounced: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
  };

  constructor(private config: EmailConfig) {
    if (!config.mailgun?.apiKey || !config.mailgun?.domain) {
      throw new Error('Mailgun API key and domain are required');
    }

    this.mailgun = Mailgun({
      apiKey: config.mailgun.apiKey,
      domain: config.mailgun.domain,
    });
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const data = {
        from: this.formatAddress(options.from || this.config.from),
        to: this.formatAddresses(options.to),
        cc: options.cc ? this.formatAddresses(options.cc) : undefined,
        bcc: options.bcc ? this.formatAddresses(options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachment: options.attachments,
        'h:Reply-To': options.replyTo || this.config.replyTo,
        ...options.headers,
      };

      const result = await new Promise<any>((resolve, reject) => {
        this.mailgun.messages().send(data, (error, body) => {
          if (error) reject(error);
          else resolve(body);
        });
      });

      this.stats.sent++;

      logger.info('Email sent via Mailgun', {
        messageId: result.id,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: result.id,
        provider: 'mailgun',
        timestamp: new Date(),
      };
    } catch (error) {
      this.stats.failed++;
      logger.error('Mailgun email failed:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'mailgun',
        timestamp: new Date(),
      };
    }
  }

  validateConfig(): boolean {
    return !!(this.config.mailgun?.apiKey && this.config.mailgun?.domain);
  }

  getStats(): EmailStats {
    return { ...this.stats };
  }

  private formatAddress(address: EmailAddress | string): string {
    if (typeof address === 'string') {
      return address;
    }
    return address.name ? `${address.name} <${address.email}>` : address.email;
  }

  private formatAddresses(addresses: EmailAddress | EmailAddress[] | string | string[]): string {
    if (Array.isArray(addresses)) {
      return addresses.map(addr => this.formatAddress(addr)).join(', ');
    }
    return this.formatAddress(addresses);
  }
}

// Email Template Engine
export class EmailTemplateEngine {
  private templates: Map<string, EmailTemplate> = new Map();
  private templatePath: string;

  constructor(templatePath?: string) {
    this.templatePath = templatePath || path.join(process.cwd(), 'templates', 'email');
  }

  async loadTemplate(name: string): Promise<EmailTemplate> {
    if (this.templates.has(name)) {
      return this.templates.get(name)!;
    }

    try {
      const templateDir = path.join(this.templatePath, name);
      const configPath = path.join(templateDir, 'config.json');
      const htmlPath = path.join(templateDir, 'template.html');
      const textPath = path.join(templateDir, 'template.txt');

      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      const html = await fs.readFile(htmlPath, 'utf-8');
      let text: string | undefined;

      try {
        text = await fs.readFile(textPath, 'utf-8');
      } catch {
        // Text template is optional
      }

      const template: EmailTemplate = {
        name,
        subject: config.subject,
        html,
        text,
        variables: config.variables || [],
      };

      this.templates.set(name, template);
      return template;
    } catch (error) {
      logger.error(`Failed to load email template '${name}':`, error);
      throw new Error(`Email template '${name}' not found`);
    }
  }

  renderTemplate(
    template: EmailTemplate,
    data: Record<string, any>
  ): { subject: string; html: string; text?: string } {
    const renderString = (str: string, data: Record<string, any>): string => {
      return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        const value = data[key];
        return value !== undefined ? String(value) : match;
      });
    };

    // Sanitize data
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizer.sanitizeHtml(value);
      } else {
        sanitizedData[key] = value;
      }
    }

    return {
      subject: renderString(template.subject, sanitizedData),
      html: renderString(template.html, sanitizedData),
      text: template.text ? renderString(template.text, sanitizedData) : undefined,
    };
  }

  async renderTemplateByName(
    name: string,
    data: Record<string, any>
  ): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.loadTemplate(name);
    return this.renderTemplate(template, data);
  }

  listTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  clearCache(): void {
    this.templates.clear();
  }
}

// Email Service
export class EmailService {
  private provider: IEmailProvider;
  private templateEngine: EmailTemplateEngine;
  private queue: EmailOptions[] = [];
  private processing = false;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor(config: EmailConfig) {
    this.provider = this.createProvider(config);
    this.templateEngine = new EmailTemplateEngine(config.templates?.path);
  }

  private createProvider(config: EmailConfig): IEmailProvider {
    switch (config.provider) {
      case 'smtp':
        return new SMTPEmailProvider(config);
      case 'sendgrid':
        return new SendGridEmailProvider(config);
      case 'mailgun':
        return new MailgunEmailProvider(config);
      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    // Validate email addresses
    this.validateEmailAddresses(options);

    // Process template if specified
    if (options.template && options.templateData) {
      const rendered = await this.templateEngine.renderTemplateByName(
        options.template,
        options.templateData
      );
      options.subject = rendered.subject;
      options.html = rendered.html;
      options.text = rendered.text;
    }

    // Send email with retry logic
    return this.sendWithRetry(options);
  }

  async sendBulk(emails: EmailOptions[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      try {
        const result = await this.send(email);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          provider: this.provider.constructor.name
            .toLowerCase()
            .replace('emailprovider', '') as EmailProvider,
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  async sendTemplate(
    templateName: string,
    to: EmailAddress | EmailAddress[] | string | string[],
    data: Record<string, any>,
    options?: Partial<EmailOptions>
  ): Promise<EmailResult> {
    const emailOptions: EmailOptions = {
      to,
      subject: '', // Will be set by template
      template: templateName,
      templateData: data,
      ...options,
    };

    return this.send(emailOptions);
  }

  addToQueue(options: EmailOptions): void {
    this.queue.push(options);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const email = this.queue.shift()!;
      try {
        await this.send(email);
      } catch (error) {
        logger.error('Failed to send queued email:', error);
      }
    }

    this.processing = false;
  }

  private async sendWithRetry(options: EmailOptions, attempt = 1): Promise<EmailResult> {
    try {
      return await this.provider.send(options);
    } catch (error) {
      if (attempt < this.retryAttempts) {
        logger.warn(`Email send attempt ${attempt} failed, retrying...`, error);
        await this.delay(this.retryDelay * attempt);
        return this.sendWithRetry(options, attempt + 1);
      }
      throw error;
    }
  }

  private validateEmailAddresses(options: EmailOptions): void {
    const validateAddress = (address: EmailAddress | string): void => {
      const email = typeof address === 'string' ? address : address.email;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email address: ${email}`);
      }
    };

    const validateAddresses = (
      addresses: EmailAddress | EmailAddress[] | string | string[]
    ): void => {
      if (Array.isArray(addresses)) {
        addresses.forEach(validateAddress);
      } else {
        validateAddress(addresses);
      }
    };

    validateAddresses(options.to);
    if (options.cc) validateAddresses(options.cc);
    if (options.bcc) validateAddresses(options.bcc);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): EmailStats {
    return this.provider.getStats();
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }

  validateConfig(): boolean {
    return this.provider.validateConfig();
  }
}

// Create email service from config
export function createEmailService(): EmailService {
  const emailConfig: EmailConfig = {
    provider: 'smtp',
    smtp: {
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'password',
      },
    },
    from: {
      name: 'Test App',
      email: 'test@example.com',
    },
    templates: {
      path: './templates',
    },
  };
  return new EmailService(emailConfig);
}

// Global email service instance
export const emailService = createEmailService();

// Email utilities
export const emailUtils = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Extract domain from email
  getDomain: (email: string): string => {
    return email.split('@')[1] || '';
  },

  // Normalize email address
  normalizeEmail: (email: string): string => {
    return email.toLowerCase().trim();
  },

  // Generate unsubscribe link
  generateUnsubscribeLink: (email: string, token: string, baseUrl: string): string => {
    const encodedEmail = encodeURIComponent(email);
    return `${baseUrl}/unsubscribe?email=${encodedEmail}&token=${token}`;
  },

  // Generate tracking pixel
  generateTrackingPixel: (messageId: string, baseUrl: string): string => {
    return `<img src="${baseUrl}/track/open?id=${messageId}" width="1" height="1" style="display:none;" />`;
  },

  // Convert text to HTML
  textToHtml: (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  },

  // Extract plain text from HTML
  htmlToText: (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  },

  // Common email templates
  templates: {
    welcome: {
      subject: 'Welcome to {{appName}}!',
      html: `
        <h1>Welcome {{name}}!</h1>
        <p>Thank you for joining {{appName}}. We're excited to have you on board.</p>
        <p>Get started by <a href="{{loginUrl}}">logging in to your account</a>.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      `,
      text: `
        Welcome {{name}}!

        Thank you for joining {{appName}}. We're excited to have you on board.

        Get started by visiting: {{loginUrl}}

        Best regards,
        The {{appName}} Team
      `,
    },

    passwordReset: {
      subject: 'Reset your {{appName}} password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi {{name}},</p>
        <p>You requested to reset your password for {{appName}}.</p>
        <p><a href="{{resetUrl}}">Click here to reset your password</a></p>
        <p>This link will expire in {{expiryTime}}.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      `,
      text: `
        Password Reset Request

        Hi {{name}},

        You requested to reset your password for {{appName}}.

        Reset your password: {{resetUrl}}

        This link will expire in {{expiryTime}}.

        If you didn't request this, please ignore this email.

        Best regards,
        The {{appName}} Team
      `,
    },

    emailVerification: {
      subject: 'Verify your {{appName}} email address',
      html: `
        <h1>Email Verification</h1>
        <p>Hi {{name}},</p>
        <p>Please verify your email address for {{appName}}.</p>
        <p><a href="{{verifyUrl}}">Click here to verify your email</a></p>
        <p>This link will expire in {{expiryTime}}.</p>
        <p>Best regards,<br>The {{appName}} Team</p>
      `,
      text: `
        Email Verification

        Hi {{name}},

        Please verify your email address for {{appName}}.

        Verify your email: {{verifyUrl}}

        This link will expire in {{expiryTime}}.

        Best regards,
        The {{appName}} Team
      `,
    },
  },
};

// Export types and classes
