import { createId } from "@paralleldrive/cuid2";
import { type Edge, type Node } from "@xyflow/react";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { sendWorkflowExecution } from "@/inngest/utils";
import { PAGINATION } from "@/config/constants";
import { NodeType } from "@/generated/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";

const FREE_WORKFLOW_LIMIT = 10;
const workflowTemplateSchema = z.enum(["tinyfish_hn_to_sheets"]);

const createWorkflowTemplate = (template: z.infer<typeof workflowTemplateSchema>) => {
  switch (template) {
    case "tinyfish_hn_to_sheets": {
      const triggerId = createId();
      const tinyFishId = createId();
      const sheetsId = createId();

      return {
        name: "hacker-news-to-google-sheets",
        nodes: [
          {
            id: triggerId,
            type: NodeType.MANUAL_TRIGGER,
            name: NodeType.MANUAL_TRIGGER,
            position: { x: -420, y: 0 },
            data: {},
          },
          {
            id: tinyFishId,
            type: NodeType.TINYFISH,
            name: NodeType.TINYFISH,
            position: { x: -80, y: 0 },
            data: {
              variableName: "tinyFishRun",
              url: "https://news.ycombinator.com",
              goal:
                'Extract the top 10 stories. For each return a JSON object with exactly these keys: title, url, points, comment_count. Return the result as a JSON object with a single key "stories" containing the array.',
            },
          },
          {
            id: sheetsId,
            type: NodeType.GOOGLE_SHEETS,
            name: NodeType.GOOGLE_SHEETS,
            position: { x: 300, y: 0 },
            data: {
              variableName: "googleSheets",
              sheetName: "Sheet1",
              columns: "title,url,points,comment_count",
              rowsJson: "{{json tinyFishRun.result.stories}}",
              valueInputOption: "USER_ENTERED",
            },
          },
        ],
        edges: [
          {
            fromNodeId: triggerId,
            toNodeId: tinyFishId,
            fromOutput: "main",
            toInput: "main",
          },
          {
            fromNodeId: tinyFishId,
            toNodeId: sheetsId,
            fromOutput: "main",
            toInput: "main",
          },
        ],
      };
    }
  }
};

export const workflowRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });

      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return workflow;
    }),

  create: protectedProcedure
    .input(
      z
        .object({
          template: workflowTemplateSchema.optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
      const workflowCount = await prisma.workflow.count({
        where: {
          userId: ctx.auth.user.id,
        },
      });

      if (workflowCount >= FREE_WORKFLOW_LIMIT) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Free plan supports up to 10 workflows. Upgrade to Pro to create more.",
        });
      }

      if (!input?.template) {
        return prisma.workflow.create({
          data: {
            name: generateSlug(3),
            userId: ctx.auth.user.id,
            nodes: {
              create: {
                type: NodeType.INITIAL,
                position: { x: 0, y: 0 },
                name: NodeType.INITIAL,
              },
            },
          },
        });
      }

      const template = createWorkflowTemplate(input.template);

      return prisma.$transaction(async (tx) => {
        const workflow = await tx.workflow.create({
          data: {
            name: template.name,
            userId: ctx.auth.user.id,
          },
        });

        await tx.node.createMany({
          data: template.nodes.map((node) => ({
            ...node,
            workflowId: workflow.id,
          })),
        });

        await tx.connection.createMany({
          data: template.edges.map((edge) => ({
            ...edge,
            workflowId: workflow.id,
          })),
        });

        return workflow;
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
      });

      return await prisma.$transaction(async (tx) => {
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {},
          })),
        });

        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return workflow;
      });
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
