# Section 12: DevOps & Tooling

This section explains the development and production tooling around Nodeflowz,
including Biome, mprocs, Sentry, CI/CD, Docker, and worker autoscaling.

## 75. What does `biome.json` configure? How does Biome compare to ESLint and Prettier?

Biome is the repository's combined formatting, linting, and import-organization
tool.

The Nodeflowz `biome.json` enables Git-aware file selection:

```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

Biome respects Git ignore rules and excludes generated or dependency
directories:

```json
{
  "files": {
    "ignoreUnknown": true,
    "includes": [
      "**",
      "!node_modules",
      "!.next",
      "!dist",
      "!build"
    ]
  }
}
```

Formatting uses two-space indentation:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

Linting uses recommended rules and framework-aware domains:

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noUnknownAtRules": "off"
      }
    },
    "domains": {
      "next": "recommended",
      "react": "recommended"
    }
  }
}
```

Import organization is enabled:

```json
{
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

The package scripts expose:

```json
{
  "lint": "biome check",
  "format": "biome format --write"
}
```

### Biome vs ESLint and Prettier

Traditionally, JavaScript projects use:

- ESLint for linting.
- Prettier for formatting.
- Additional plugins for import ordering.

Biome provides these capabilities through one tool.

```mermaid
flowchart TD
    Traditional["Traditional Toolchain"] --> ESLint["ESLint: Linting"]
    Traditional --> Prettier["Prettier: Formatting"]
    Traditional --> Imports["Import plugin"]

    Biome["Biome"] --> Lint["Linting"]
    Biome --> Format["Formatting"]
    Biome --> Organize["Organize imports"]
```

| Area | Biome | ESLint + Prettier |
|---|---|---|
| Configuration | One main configuration | Multiple tools/configurations |
| Performance | Fast native implementation | Usually slower |
| Formatting | Built in | Prettier |
| Linting | Built in | ESLint |
| Plugin ecosystem | Smaller | Very large |
| Framework-specific custom rules | Growing | Mature |

### Why Disable `noUnknownAtRules`?

Tailwind CSS and modern CSS tooling may use at-rules that a generic CSS parser
does not recognize. Disabling this rule avoids false-positive lint failures.

### CI Usage

Check code without modifying it:

```bash
npm run lint
```

Format locally:

```bash
npm run format
```

### Interview Answer

> `biome.json` configures formatting, recommended lint rules, Next.js and React
> lint domains, Git-aware file selection, exclusions, and import organization.
> Biome replaces much of the ESLint plus Prettier toolchain with one fast tool.
> ESLint still has a larger plugin ecosystem, but Biome reduces configuration
> and tooling overhead for this project.

## 76. What is `mprocs`, and what does `mprocs.yaml` define?

`mprocs` is a local-development process manager. It runs and monitors several
long-running commands from one terminal interface.

Nodeflowz development needs multiple processes:

1. Next.js development server.
2. Inngest local development server.
3. ngrok tunnel for external webhook testing.

The repository defines:

```yaml
procs:
  ngrok:
    cmd: ["cmd", "/c", "npm run ngrok:dev"]

  next:
    cmd: ["cmd", "/c", "npm run dev"]

  inngest:
    cmd: ["cmd", "/c", "npm run inngest:dev"]
```

The related package scripts are:

```json
{
  "dev": "next dev --turbopack",
  "ngrok:dev": "dotenv -- cross-var ngrok http --url=$NGROK_URL 3000",
  "inngest:dev": "inngest-cli dev",
  "dev:all": "dotenv -- mprocs"
}
```

```mermaid
flowchart TD
    Command["npm run dev:all"] --> Dotenv["Load environment variables"]
    Dotenv --> Mprocs["mprocs"]
    Mprocs --> Next["Next.js dev server"]
    Mprocs --> Inngest["Inngest dev server"]
    Mprocs --> Ngrok["ngrok tunnel"]
```

### Why These Processes Are Needed

#### Next.js

Runs the web application:

```text
http://localhost:3000
```

#### Inngest Dev Server

Runs and inspects local background workflow functions.

#### ngrok

Creates a public URL that forwards to the local application. This allows
external providers such as Stripe or Google Forms to call local webhook routes.

```mermaid
flowchart LR
    Stripe["External Provider"] --> Ngrok["Public ngrok URL"]
    Ngrok --> Next["localhost:3000 webhook route"]
    Next --> Inngest["Local Inngest execution"]
```

### Benefits

- One command starts the complete local environment.
- Developers can view each process independently.
- Failed processes are visible.
- Logs remain separated.
- Individual processes can be restarted.

### Interview Answer

> `mprocs` is a development process manager. Nodeflowz uses it because local
> development requires Next.js, the Inngest dev server, and an ngrok webhook
> tunnel to run together. `mprocs.yaml` defines those commands so the full
> development environment starts with `npm run dev:all`.

## 77. What is Sentry used for? How do edge and server configurations differ?

Sentry provides production observability:

- Error and exception reporting.
- Performance tracing.
- Console log capture.
- Source-map-backed stack traces.
- AI SDK telemetry.
- Release and deployment visibility.

Nodeflowz wraps the Next.js configuration with Sentry:

```ts
export default withSentryConfig(nextConfig, {
  org: "psit-wi",
  project: "nodebase",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
```

### Important Build Configuration

`widenClientFileUpload` uploads more source maps to improve stack traces:

```ts
widenClientFileUpload: true
```

`tunnelRoute` routes browser reporting through the application:

```ts
tunnelRoute: "/monitoring"
```

This can reduce blocking by browser extensions, but it adds application traffic.

### Server Configuration

The server configuration runs in the Node.js server runtime:

```ts
Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.vercelAIIntegration({
      recordInputs: true,
      recordOutputs: true,
    }),
    Sentry.consoleLoggingIntegration({
      levels: ["log", "warn", "error"],
    }),
  ],
  tracesSampleRate: 1,
  sendDefaultPii: true,
  enableLogs: true,
  debug: false,
});
```

It includes Vercel AI SDK instrumentation because AI calls execute on the
server.

### Edge Configuration

The edge configuration applies to edge runtime features:

```ts
Sentry.init({
  dsn: "...",
  integrations: [
    Sentry.consoleLoggingIntegration({
      levels: ["log", "warn", "error"],
    }),
  ],
  tracesSampleRate: 1,
  enableLogs: true,
  debug: false,
});
```

The edge runtime has a smaller runtime API and cannot use every Node.js
integration.

```mermaid
flowchart TD
    Next["Next.js Application"] --> Server["Node.js Server Runtime"]
    Next --> Edge["Edge Runtime"]
    Server --> ServerConfig["sentry.server.config.ts"]
    Edge --> EdgeConfig["sentry.edge.config.ts"]
```

### Production Security and Cost Considerations

The current server configuration records AI inputs, AI outputs, and default
personally identifiable information:

```ts
recordInputs: true
recordOutputs: true
sendDefaultPii: true
```

Before production, review this carefully because prompts and outputs may contain
sensitive customer data.

Also, `tracesSampleRate: 1` samples every trace. At high traffic, this can
increase cost and overhead. A production sampler may be more appropriate:

```ts
Sentry.init({
  tracesSampler(context) {
    if (context.name.includes("execute-workflow")) {
      return 0.25;
    }

    return 0.05;
  },
});
```

### Interview Answer

> Sentry captures production exceptions, logs, traces, and source-mapped stack
> traces. The server config runs in the Node.js runtime and can instrument
> server-side AI SDK calls. The edge config is for middleware and edge routes,
> where only edge-compatible integrations can run. In production, I would
> carefully review PII and AI input/output capture and reduce the full trace
> sampling rate.

## 78. How would you build a CI/CD pipeline?

A Nodeflowz pipeline should validate code before deployment and apply database
migrations safely during deployment.

### Pipeline Stages

```mermaid
flowchart TD
    Push["Pull request or push"] --> Install["npm ci"]
    Install --> Generate["prisma generate"]
    Generate --> Typecheck["TypeScript type-check"]
    Typecheck --> Lint["Biome lint/check"]
    Lint --> Test["Automated tests"]
    Test --> Build["Next.js production build"]
    Build --> Image["Build immutable artifact/image"]
    Image --> Migrate["Run prisma migrate deploy"]
    Migrate --> Deploy["Deploy application"]
    Deploy --> Verify["Health checks / smoke tests"]
```

### Package Scripts

The repository already has:

```json
{
  "build": "next build --turbopack",
  "lint": "biome check"
}
```

I would add:

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

### GitHub Actions Validation Job

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  validate:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: nodeflowz
          POSTGRES_PASSWORD: nodeflowz
          POSTGRES_DB: nodeflowz_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd="pg_isready"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    env:
      DATABASE_URL: postgresql://nodeflowz:nodeflowz@localhost:5432/nodeflowz_test
      ENCRYPTION_KEY: ${{ secrets.CI_ENCRYPTION_KEY }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Apply test migrations
        run: npx prisma migrate deploy

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

### Deployment Job

```yaml
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: validate
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npx prisma generate

      - name: Build container
        run: docker build -t nodeflowz:${{ github.sha }} .

      - name: Push immutable image
        run: ./scripts/push-image.sh nodeflowz:${{ github.sha }}

      - name: Run production migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.PRODUCTION_DATABASE_URL }}

      - name: Deploy immutable image
        run: ./scripts/deploy.sh nodeflowz:${{ github.sha }}

      - name: Smoke test
        run: ./scripts/smoke-test.sh
```

### Migration Strategy

Use:

```bash
npx prisma migrate deploy
```

Do not use:

```bash
npx prisma migrate dev
```

Production migrations should follow expand-and-contract rules so old and new
application instances remain compatible during rolling deployment.

### Deployment Safety

- Build once and deploy the same immutable artifact.
- Use protected production environments.
- Require migration review.
- Run health checks.
- Use rolling or blue-green deployments.
- Stop deployment if smoke tests fail.
- Keep rollback procedures.
- Monitor Sentry and metrics after release.

### Secrets

Use a secret manager or CI protected secrets. Never store production secrets in
the repository or Docker image.

### Interview Answer

> My CI pipeline installs dependencies, generates Prisma, applies migrations to
> a test database, type-checks, runs Biome, runs tests, and builds the
> application. The deployment pipeline builds an immutable artifact, runs
> reviewed `prisma migrate deploy` migrations as a release step, deploys with a
> rolling or blue-green strategy, and runs health checks and smoke tests before
> completing the release.

## 79. How would you containerize Nodeflowz with Docker?

A multi-stage Docker build separates dependency installation, compilation, and
the final runtime image.

```mermaid
flowchart LR
    Source["Source code"] --> Dependencies["Dependencies stage"]
    Dependencies --> Builder["Builder stage"]
    Builder --> Runtime["Small production runtime"]
```

### Next.js Standalone Output

Configure Next.js:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
};
```

Standalone output includes the minimum server files needed to run the
application.

### Multi-Stage Dockerfile

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

### `.dockerignore`

```dockerignore
node_modules
.next
.git
.env
.env.*
mprocs.log
docs
```

Do not copy local secrets into the image.

### Prisma Considerations

Generate the Prisma client during the build:

```dockerfile
RUN npx prisma generate
```

Provide `DATABASE_URL` only at runtime or during the migration release job.

Do not run migrations in every application container:

```dockerfile
# Avoid:
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

If several containers start simultaneously, they may all attempt migrations.

Instead:

```mermaid
flowchart TD
    Release["Deployment release step"] --> Migration["One-off migration job"]
    Migration --> Success{"Migration successful?"}
    Success -->|yes| Rollout["Start or update app containers"]
    Success -->|no| Stop["Stop deployment"]
```

### Separate Worker Image

If Nodeflowz later separates API and worker processes, both can use the same
base image with different commands:

```dockerfile
FROM builder AS worker
CMD ["node", "dist/worker.js"]
```

Or use one image and override the container command in ECS or Kubernetes.

### Container Security

- Run as a non-root user.
- Use a minimal base image.
- Scan dependencies and images.
- Pin image versions.
- Mount secrets at runtime.
- Use read-only filesystems where possible.
- Set CPU and memory limits.
- Add health endpoints.

### Interview Answer

> I would use a multi-stage Dockerfile with dependency, build, and runtime
> stages. The builder generates Prisma and builds Next.js standalone output.
> The final image contains only runtime files and runs as a non-root user.
> Production migrations run as a separate one-off release job before container
> rollout, not inside every application container.

## 80. How would you autoscale workers using ECS or Kubernetes?

Workflow workers should scale according to queue pressure, not only CPU.

Useful metrics:

- Queue depth.
- Age of the oldest queued job.
- Incoming jobs per second.
- Completion rate.
- Worker CPU and memory.
- Provider rate-limit rate.
- Database latency.
- Error and retry rates.

```mermaid
flowchart TD
    Queue["Workflow queue"] --> Metrics["Queue depth and oldest job age"]
    Metrics --> Autoscaler["Autoscaler"]
    Autoscaler --> Workers["Worker instances"]
    Workers --> Queue
```

### Why Queue Depth Alone Is Not Enough

A queue of 1,000 one-second jobs is different from a queue of 1,000 ten-minute
jobs. Oldest job age indicates whether users are waiting too long.

A useful estimate:

```text
desired workers =
  queued jobs * average job duration
  / target drain time
```

Example:

```text
500 queued jobs
30-second average duration
5-minute target drain time

500 * 30 / 300 = 50 workers
```

### AWS ECS Design

Use:

- ECS Service for worker tasks.
- CloudWatch custom metrics.
- Application Auto Scaling.
- Step scaling or target tracking.

```mermaid
flowchart LR
    Queue["Queue"] --> Publisher["Metric publisher"]
    Publisher --> CloudWatch["CloudWatch"]
    CloudWatch --> Autoscaling["ECS Service Auto Scaling"]
    Autoscaling --> Tasks["ECS Worker Tasks"]
```

Example scale policy concept:

```text
Queue depth > 500 or oldest job age > 120 seconds:
  scale out aggressively

Queue depth < 20 and oldest job age < 10 seconds for 10 minutes:
  scale in gradually
```

Terraform-style scalable target:

```hcl
resource "aws_appautoscaling_target" "workers" {
  service_namespace  = "ecs"
  resource_id        = "service/nodeflowz/nodeflowz-worker"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = 2
  max_capacity       = 100
}
```

### Kubernetes Design

Use:

- A worker `Deployment`.
- Kubernetes resource requests and limits.
- KEDA for event-driven autoscaling.
- Prometheus or direct queue metrics.

Worker deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodeflowz-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nodeflowz-worker
  template:
    metadata:
      labels:
        app: nodeflowz-worker
    spec:
      containers:
        - name: worker
          image: registry.example.com/nodeflowz:IMAGE_TAG
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "1"
              memory: 1Gi
          envFrom:
            - secretRef:
                name: nodeflowz-worker-secrets
```

KEDA `ScaledObject`:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: nodeflowz-worker
spec:
  scaleTargetRef:
    name: nodeflowz-worker
  minReplicaCount: 2
  maxReplicaCount: 100
  pollingInterval: 15
  cooldownPeriod: 300
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: nodeflowz_queue_depth
        threshold: "100"
        query: sum(nodeflowz_queue_depth)
    - type: prometheus
      metadata:
        serverAddress: http://prometheus:9090
        metricName: nodeflowz_oldest_job_age_seconds
        threshold: "60"
        query: max(nodeflowz_oldest_job_age_seconds)
```

### Protecting Downstream Systems

Autoscaling workers can overload:

- PostgreSQL.
- OpenAI and other providers.
- Google Sheets.
- Slack.
- Internal services.

Scaling must be combined with concurrency limits:

```ts
const providerConcurrency = {
  OPENAI: 10,
  ANTHROPIC: 10,
  GOOGLE_SHEETS: 5,
  SLACK: 20,
};
```

```mermaid
flowchart TD
    QueueHigh["Queue pressure high"] --> Scale["Add workers"]
    Scale --> Limits["Apply provider and DB concurrency limits"]
    Limits --> Healthy{"Downstream healthy?"}
    Healthy -->|yes| Process["Increase throughput"]
    Healthy -->|no| Hold["Stop scaling or reduce concurrency"]
```

### Scale-In Safety

When reducing workers:

- Stop claiming new jobs.
- Let current jobs finish.
- Extend leases for long jobs.
- Use termination grace periods.
- Make jobs idempotent in case termination interrupts them.

Kubernetes:

```yaml
spec:
  terminationGracePeriodSeconds: 120
```

Worker shutdown:

```ts
process.on("SIGTERM", async () => {
  stopClaimingNewJobs();
  await waitForActiveJobs();
  process.exit(0);
});
```

### Interview Answer

> I would autoscale workers based on queue depth and oldest job age. On ECS, I
> would publish queue metrics to CloudWatch and use ECS Service Auto Scaling. On
> Kubernetes, I would use KEDA with queue or Prometheus metrics. Scaling must be
> combined with database and provider-specific concurrency limits, and workers
> need graceful shutdown so scale-in does not interrupt jobs unnecessarily.
