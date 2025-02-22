import { type Transporter, createTransport } from "nodemailer";
import mjml2html from "mjml";
import type { MJMLParseResults } from "mjml-core";
import { readFileSync } from "fs";
import { convert as html2text } from "html-to-text";
import env from "~/env";

type MailTemplateParams = {
  board_invitation: {
    user: string;
    boardName: string;
    role: string;
    permissions: string;
    invitationId: string;
  };
};

const MailTemplateSubject = {
  board_invitation: "{{user}} invited to join {{boardName}} on BoardStack",
} as { [key: string]: string };

export default class Mailer {
  private readonly _transporter: Transporter;
  private readonly _recipient: string;
  readonly from: string = `BoardStack <${env.get("SMTP_USER")}>`;

  constructor(recipient: string) {
    this._recipient = recipient;
    this._transporter = createTransport({
      host: env.get("SMTP_HOST"),
      port: env.get("SMTP_PORT"),
      secure: env.get("SMTP_SECURE"),
      auth: {
        user: env.get("SMTP_USER"),
        pass: env.get("SMTP_PASSWORD"),
      },
    });
  }

  private getMessageTemplate<T extends keyof MailTemplateParams>(
    template: T,
    params: MailTemplateParams[T] & { host: string },
  ): MJMLParseResults & { subject: string; text: string } {
    const file = readFileSync(`mails/${template}.mjml`, {
      encoding: "utf-8",
    });

    const compiledTemplate = Object.entries(params).reduce(
      (template, [key, value]) =>
        template.replace(new RegExp(`{{${key}}}`, "g"), value),
      file,
    );

    const subject = Object.entries(params).reduce(
      (subj, [key, value]) =>
        subj.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
      MailTemplateSubject[template as string] || "",
    );

    return {
      ...mjml2html(compiledTemplate),
      text: html2text(compiledTemplate),
      subject,
    };
  }

  public async sendMessage<T extends keyof MailTemplateParams>(
    template: T,
    params: MailTemplateParams[T] & { host: string },
    destroyAfter: boolean = false,
  ) {
    const messageData = this.getMessageTemplate(template, params);

    await this._transporter.sendMail({
      from: this.from,
      to: this._recipient,
      subject: messageData.subject,
      html: messageData.html,
      text: messageData.text,
    });

    if (destroyAfter) this.destroy();
  }

  public destroy() {
    this._transporter.close();
  }
}
