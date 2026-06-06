"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const sheetsPresets = [
  {
    label: "TinyFish Stories",
    values: {
      variableName: "googleSheets",
      sheetName: "Sheet1",
      columns: "title,url,points,comment_count",
      rowsJson: "{{json tinyFishRun.result.stories}}",
      valueInputOption: "USER_ENTERED" as const,
    },
  },
  {
    label: "Array Of Arrays",
    values: {
      variableName: "googleSheets",
      sheetName: "Sheet1",
      columns: "",
      rowsJson: '[["Title","URL","Points"],["Example","https://example.com",42]]',
      valueInputOption: "RAW" as const,
    },
  },
] as const;

const formSchema = z.object({
  variableName: z
    .string()
    .min(1, { message: "Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message: "Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
    }),
  credentialId: z.string().min(1, "Google Sheets credential is required"),
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
  columns: z.string().optional(),
  rowsJson: z.string().min(1, "Rows JSON is required"),
  valueInputOption: z.enum(["RAW", "USER_ENTERED"]),
});

export type GoogleSheetsFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GoogleSheetsFormValues) => void;
  defaultValues?: Partial<GoogleSheetsFormValues>;
}

export const GoogleSheetsDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const {
    data: credentials,
    isLoading: isLoadingCredentials,
  } = useCredentialsByType(CredentialType.GOOGLE_SHEETS);

  const form = useForm<GoogleSheetsFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      spreadsheetId: defaultValues.spreadsheetId || "",
      sheetName: defaultValues.sheetName || "",
      columns: defaultValues.columns || "",
      rowsJson: defaultValues.rowsJson || "",
      valueInputOption: defaultValues.valueInputOption || "USER_ENTERED",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        spreadsheetId: defaultValues.spreadsheetId || "",
        sheetName: defaultValues.sheetName || "",
        columns: defaultValues.columns || "",
        rowsJson: defaultValues.rowsJson || "",
        valueInputOption: defaultValues.valueInputOption || "USER_ENTERED",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "googleSheets";

  const applyPreset = (preset: (typeof sheetsPresets)[number]["values"]) => {
    form.setValue("variableName", preset.variableName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("sheetName", preset.sheetName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("columns", preset.columns, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("rowsJson", preset.rowsJson, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("valueInputOption", preset.valueInputOption, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = (values: GoogleSheetsFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader>
          <div className="border-b px-6 pt-6 pb-4">
            <DialogTitle>Google Sheets</DialogTitle>
            <DialogDescription>
            Append rows to a Google Sheet using a service account credential.
            </DialogDescription>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex max-h-[calc(90vh-88px)] flex-col"
          >
            <div className="space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Quick Start Presets</p>
                  <p className="text-sm text-muted-foreground">
                    Start with a TinyFish-to-Sheets mapping or a generic array example.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sheetsPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset.values)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="variableName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variable Name</FormLabel>
                    <FormControl>
                      <Input placeholder="googleSheets" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use this in later nodes, for example{" "}
                      {`{{${watchVariableName}.updatedRange}}`}.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Sheets Credential</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingCredentials || !credentials?.length}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a credential" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {credentials?.map((credential) => (
                          <SelectItem key={credential.id} value={credential.id}>
                            <div className="flex items-center gap-2">
                              <Image
                                src="/logos/google-sheets.svg"
                                alt="Google Sheets"
                                width={16}
                                height={16}
                              />
                              {credential.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Share your spreadsheet with the service account email from this credential.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="spreadsheetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spreadsheet ID</FormLabel>
                      <FormControl>
                        <Input placeholder="1AbCDefGhI..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Copy this from the Google Sheets URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sheetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sheet Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sheet1" {...field} />
                      </FormControl>
                      <FormDescription>
                        The tab name where rows should be appended.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="columns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Columns (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="title,url,points,comment_count" {...field} />
                    </FormControl>
                    <FormDescription>
                      If `rowsJson` is an array of objects, columns control the order written to the sheet.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rowsJson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rows JSON</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{{json tinyFishRun.result.stories}}'
                        className="min-h-[120px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide an array of arrays or an array of objects. Use {"{{json variables}}"} to pass prior output safely.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueInputOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value Input Option</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER_ENTERED">USER_ENTERED</SelectItem>
                        <SelectItem value="RAW">RAW</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use `USER_ENTERED` for normal Sheets behavior, or `RAW` to write exact values.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
