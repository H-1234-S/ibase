import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

/** Sends registration codes using the configured QQ SMTP account. */
@Injectable()
export class EmailService {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.getOrThrow<string>('EMAIL_USER');
    this.from = config.get<string>('EMAIL_FROM') ?? user;
    this.transporter = nodemailer.createTransport({
      service: 'qq',
      auth: {
        user,
        pass: config.getOrThrow<string>('EMAIL_PASSWORD'),
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  /** Delivers a registration code without exposing it through API logs. */
  async sendRegistrationCode(email: string, code: string) {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'ibase 邮箱验证码',
      text: `你的注册验证码是 ${code}，有效期为 5 分钟。如非本人操作，请忽略此邮件。`,
    });
  }
}
