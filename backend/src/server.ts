import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { AnalyzeRequestSchema, QaRequestSchema } from "./api/schemas";
import { taxGraph } from "./graph/graph";
import { buildExecutiveSummary } from "./modules/india/executiveSummary";
import { answerWithContext } from "./agents/qaAgent";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/analyze", async (req, reply) => {
    const parsed = AnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { input, options } = parsed.data;

    const result = await taxGraph.invoke({
      userInput: input,
      options: {
        includeAi: options?.includeAi ?? true,
        projectionYears: options?.projectionYears ?? 3,
        projectionGrowthRatePct: options?.projectionGrowthRatePct ?? 10,
        scenarioCount: options?.scenarioCount ?? 8,
      },
    });

    const executiveSummary = buildExecutiveSummary(result);
    return reply.send({ ...result, executiveSummary });
  });

  app.post("/qa", async (req, reply) => {
    const parsed = QaRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { context, question, history } = parsed.data;

    // Prevent huge prompts in hackathon demos
    const contextSize = JSON.stringify(context).length;
    if (contextSize > 60_000) {
      return reply.status(413).send({ error: "Context too large" });
    }

    const answer = await answerWithContext({ context, question, history });
    if (answer.error === "missing_api_key") {
      return reply.status(400).send({
        error: "AI disabled",
        message: "Set GOOGLE_API_KEY in backend .env to enable Q&A.",
      });
    }

    return reply.send(answer);
  });

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
