// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://37584b883be8f8007e3d416f09ec0515@o4510755041509376.ingest.us.sentry.io/4510755061235712",

  integrations: [
    //Add the VEcel Ai SDK integrations to sentry.server.config.ts
    Sentry.vercelAIIntegration({
      recordInputs:true,
      recordOutputs:true,
    }),
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  sendDefaultPii:true,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
