const { PrismaClient, ExecutionStatus } = require("../src/generated/prisma/client");

const prisma = new PrismaClient();

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatDurationMs(value) {
  if (value == null) return "n/a";

  const totalSeconds = Math.round(value / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

async function main() {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    runningExecutions,
    executionsLast7Days,
    executionsLast30Days,
    totalWorkflows,
    activeWorkflowsLast30Days,
    totalUsers,
    totalCredentials,
    completionDurations,
    topWorkflows,
  ] = await Promise.all([
    prisma.execution.count(),
    prisma.execution.count({ where: { status: ExecutionStatus.SUCCESS } }),
    prisma.execution.count({ where: { status: ExecutionStatus.FAILED } }),
    prisma.execution.count({ where: { status: ExecutionStatus.RUNNING } }),
    prisma.execution.count({ where: { startedAt: { gte: last7Days } } }),
    prisma.execution.count({ where: { startedAt: { gte: last30Days } } }),
    prisma.workflow.count(),
    prisma.workflow.count({
      where: {
        executions: {
          some: {
            startedAt: { gte: last30Days },
          },
        },
      },
    }),
    prisma.user.count(),
    prisma.credential.count(),
    prisma.execution.findMany({
      where: {
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
        completedAt: true,
      },
    }),
    prisma.workflow.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: {
        executions: {
          _count: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const completedExecutions = successfulExecutions + failedExecutions;
  const successRate = completedExecutions === 0 ? 0 : successfulExecutions / completedExecutions;
  const failureRate = completedExecutions === 0 ? 0 : failedExecutions / completedExecutions;

  const durationValues = completionDurations
    .map(({ startedAt, completedAt }) => completedAt.getTime() - startedAt.getTime())
    .filter((value) => value >= 0);

  const averageDurationMs =
    durationValues.length === 0
      ? null
      : durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length;

  const sortedDurations = [...durationValues].sort((a, b) => a - b);
  const p95DurationMs =
    sortedDurations.length === 0
      ? null
      : sortedDurations[Math.floor(sortedDurations.length * 0.95)];

  const report = {
    generatedAt: now.toISOString(),
    totals: {
      users: totalUsers,
      workflows: totalWorkflows,
      credentials: totalCredentials,
      executions: totalExecutions,
    },
    executionHealth: {
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      completedExecutions,
      successRate: formatPercent(successRate),
      failureRate: formatPercent(failureRate),
    },
    activity: {
      executionsLast7Days,
      executionsLast30Days,
      activeWorkflowsLast30Days,
    },
    duration: {
      averageCompletionTime: formatDurationMs(averageDurationMs),
      p95CompletionTime: formatDurationMs(p95DurationMs),
    },
    topWorkflows: topWorkflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      executions: workflow._count.executions,
    })),
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error("Failed to generate metrics report.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
