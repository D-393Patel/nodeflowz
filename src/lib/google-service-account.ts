import { createSign } from "crypto";

type GoogleServiceAccountCredential = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function base64UrlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function parseGoogleServiceAccountCredential(rawCredential: string) {
  const parsed = JSON.parse(rawCredential) as GoogleServiceAccountCredential;

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Google Sheets credential must include client_email and private_key");
  }

  return {
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
    tokenUri: parsed.token_uri || "https://oauth2.googleapis.com/token",
  };
}

export function createGoogleAccessTokenRequestBody(rawCredential: string) {
  const credential = parseGoogleServiceAccountCredential(rawCredential);
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: credential.clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: credential.tokenUri,
    exp: expiresAt,
    iat: issuedAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer
    .sign(credential.privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return {
    tokenUri: credential.tokenUri,
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  };
}
