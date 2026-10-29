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

  /** Sends a membership invitation without logging or exposing its token. */
  async sendOrganizationInvitation(
    email: string,
    organizationName: string,
    invitedByName: string,
    invitationUrl: string,
    ttlHours: number,
  ) {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `加入 ${organizationName} 的 ibase 团队`,
      text: `${invitedByName} 邀请你以成员身份加入 ${organizationName}。此邀请将在 ${ttlHours} 小时后失效：${invitationUrl}\n\n如果你没有预期收到此邀请，请忽略此邮件。`,
    });
  }
}
