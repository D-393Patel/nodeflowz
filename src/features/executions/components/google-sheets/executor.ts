import Handlebars from "handlebars";
import ky from "ky";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { googleSheetsChannel } from "@/inngest/channels/google-sheets";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { createGoogleAccessTokenRequestBody } from "@/lib/google-service-account";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

type GoogleSheetsData = {
  variableName?: string;
  credentialId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  columns?: string;
  rowsJson?: string;
  valueInputOption?: "RAW" | "USER_ENTERED";
};

function normalizeRows(rows: unknown, columns: string[]) {
  if (!Array.isArray(rows)) {
    throw new Error("Rows JSON must resolve to an array");
  }

  if (rows.length === 0) {
    return [] as unknown[][];
  }

  if (Array.isArray(rows[0])) {
    return rows as unknown[][];
  }

  if (typeof rows[0] === "object" && rows[0] !== null) {
    if (columns.length === 0) {
      throw new Error("Columns are required when rowsJson resolves to an array of objects");
    }

    return (rows as Record<string, unknown>[]).map((row) =>
      columns.map((column) => row[column] ?? ""),
    );
  }

  throw new Error("Rows JSON must be an array of arrays or array of objects");
}

export const googleSheetsExecutor: NodeExecutor<GoogleSheetsData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    googleSheetsChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  if (!data.variableName) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Variable name is required");
  }

  if (!data.credentialId) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Credential is required");
  }

  if (!data.spreadsheetId || !data.sheetName) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Spreadsheet ID and sheet name are required");
  }

  if (!data.rowsJson) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Rows JSON is required");
  }

  const credential = await step.run("get-google-sheets-credential", () => {
    return prisma.credential.findUnique({
      where: {
        id: data.credentialId,
        userId,
      },
    });
  });

  if (!credential) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Credential not found");
  }

  const compiledRowsJson = Handlebars.compile(data.rowsJson)(context);
  const parsedRows = JSON.parse(compiledRowsJson) as unknown;
  const columns = (data.columns || "")
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean);

  let values: unknown[][];

  try {
    values = normalizeRows(parsedRows, columns);
  } catch (error) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      error instanceof Error ? error.message : "Google Sheets node: Invalid rowsJson",
    );
  }

  const inputOption = data.valueInputOption || "USER_ENTERED";

  try {
    const appendResult = await step.run("google-sheets-append", async () => {
      const tokenRequest = createGoogleAccessTokenRequestBody(decrypt(credential.value));

      const tokenResponse = await ky
        .post(tokenRequest.tokenUri, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: tokenRequest.body,
        })
        .json<{ access_token: string }>();

      const range = `${data.sheetName}!A1`;
      const encodedRange = encodeURIComponent(range);

      return ky
        .post(
          `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/${encodedRange}:append`,
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
              "Content-Type": "application/json",
            },
            searchParams: {
              valueInputOption: inputOption,
            },
            json: {
              values,
            },
          },
        )
        .json<{
          spreadsheetId: string;
          tableRange?: string;
          updates?: {
            updatedRange?: string;
            updatedRows?: number;
            updatedColumns?: number;
            updatedCells?: number;
          };
        }>();
    });

    await publish(googleSheetsChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: {
        spreadsheetId: appendResult.spreadsheetId,
        tableRange: appendResult.tableRange,
        updatedRange: appendResult.updates?.updatedRange,
        updatedRows: appendResult.updates?.updatedRows,
        updatedColumns: appendResult.updates?.updatedColumns,
        updatedCells: appendResult.updates?.updatedCells,
      },
    };
  } catch (error) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
