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

const tinyFishPresets = [
  {
    label: "Hacker News Top 10",
    values: {
      variableName: "tinyFishRun",
      url: "https://news.ycombinator.com",
      goal:
        'Extract the top 10 stories. For each return a JSON object with exactly these keys: title, url, points, comment_count. Return the result as a JSON object with a single key "stories" containing the array.',
    },
  },
  {
    label: "Generic JSON Extract",
    values: {
      variableName: "tinyFishRun",
      url: "https://example.com",
      goal:
        'Open the page, extract the main structured information, and return only valid JSON. Use a single top-level key called "items" that contains an array of objects with consistent keys.',
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
  credentialId: z.string().min(1, "TinyFish credential is required"),
  url: z.string().url("A valid URL is required"),
  goal: z.string().min(1, "Goal is required"),
});

export type TinyFishFormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TinyFishFormValues) => void;
  defaultValues?: Partial<TinyFishFormValues>;
}

export const TinyFishDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  const {
    data: credentials,
    isLoading: isLoadingCredentials,
  } = useCredentialsByType(CredentialType.TINYFISH);

  const form = useForm<TinyFishFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      variableName: defaultValues.variableName || "",
      credentialId: defaultValues.credentialId || "",
      url: defaultValues.url || "",
      goal: defaultValues.goal || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues.variableName || "",
        credentialId: defaultValues.credentialId || "",
        url: defaultValues.url || "",
        goal: defaultValues.goal || "",
      });
    }
  }, [open, defaultValues, form]);

  const watchVariableName = form.watch("variableName") || "tinyFishRun";

  const handleSubmit = (values: TinyFishFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const applyPreset = (preset: (typeof tinyFishPresets)[number]["values"]) => {
    form.setValue("variableName", preset.variableName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("url", preset.url, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("goal", preset.goal, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>TinyFish Web Agent</DialogTitle>
          <DialogDescription>
            Configure a TinyFish browser automation run for a target page.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-4 space-y-8"
          >
            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Quick Start Presets</p>
                <p className="text-sm text-muted-foreground">
                  Use a preset to populate a working TinyFish example, then
                  customize the URL or goal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tinyFishPresets.map((preset) => (
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
                    <Input placeholder="tinyFishRun" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use this name in later nodes, for example{" "}
                    {`{{${watchVariableName}.result}}`}.
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
                  <FormLabel>TinyFish Credential</FormLabel>
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
                              src="/logos/tinyfish.svg"
                              alt="TinyFish"
                              width={16}
                              height={16}
                            />
                            {credential.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://news.ycombinator.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The page TinyFish should open in its remote browser.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Extract the top 10 stories. For each return a JSON object with exactly these keys: title, url, points, comment_count. Return the result as a JSON object with a single key "stories" containing the array.`}
                      className="min-h-[160px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe exactly what TinyFish should do and what JSON shape
                    it must return. You can use {"{{variables}}"} from earlier nodes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
