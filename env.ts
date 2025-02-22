import { Env } from "@adonisjs/env";

export default await Env.create(new URL(import.meta.url), {
  NUXT_SESSION_PASSWORD: Env.schema.string(),
  DATABASE_URL: Env.schema.string(),
  ENABLE_REGISTRATION: Env.schema.boolean(),

  /*
  |----------------------------------------------------------
  | Variables to be able to use Unsplash API
  |----------------------------------------------------------
  */
  UNSPLASH_SECRET_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for mailer
  |----------------------------------------------------------
  */
  SMTP_HOST: Env.schema.string.optional({ format: "host" }),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_SECURE: Env.schema.boolean.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
});
