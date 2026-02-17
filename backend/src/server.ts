import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  AnalyzeRequestSchema,
  IndiaSalaryAnalyzeRequestSchema,
  PayslipParseRequestSchema,
  QaRequestSchema,
} from "./api/schemas";
import { taxGraph } from "./graph/graph";
import { buildExecutiveSummary } from "./modules/india/executiveSummary";
import { answerWithContext } from "./agents/qaAgent";
import { parsePayslipPdf } from "./modules/india/payslipParser";
import { buildIndiaSalaryBreakdown, buildIndiaTdsPlan, deriveIndiaTaxInputFromSalary } from "./modules/india/salaryEngine";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

async function main() {
  const app = Fastify({ logger: true, bodyLimit: 10 * 1024 * 1024 });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  app.get("/health", async () => ({ ok: true }));

  app.post("/payslip/parse", async (req, reply) => {
    const parsed = PayslipParseRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    try {
      const r = await parsePayslipPdf(parsed.data);
      return reply.send(r);
    } catch (err) {
      req.log.error({ err }, "Payslip parse failed");
      return reply.status(500).send({
        error: "Payslip parse failed",
        message: "Could not parse payslip. Please use manual entry.",
      });
    }
  });

  app.post("/salary/analyze", async (req, reply) => {
    const parsed = IndiaSalaryAnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const input = parsed.data;
    const salaryInput = {
      mode: input.mode,
      componentsMonthly: input.componentsMonthly,
      deductionsMonthly: input.deductionsMonthly,
      otherIncomeAnnual: input.otherIncomeAnnual,
      investments80CAnnual: input.investments80CAnnual,
      npsAnnual: input.npsAnnual,
      homeLoanInterestAnnual: input.homeLoanInterestAnnual,
      tdsPaidYtd: input.tdsPaidYtd,
      monthsRemaining: input.monthsRemaining,
      currency: "INR" as const,
    };

    const salaryBreakdown = buildIndiaSalaryBreakdown(salaryInput);
    const derivedTaxInput = deriveIndiaTaxInputFromSalary(salaryInput);

    const analysis = await taxGraph.invoke({
      country: "IN",
      userInput: derivedTaxInput,
      options: {
        includeAi: true,
        projectionYears: 3,
        projectionGrowthRatePct: 10,
        scenarioCount: 8,
      },
    });

    const executiveSummary = buildExecutiveSummary(analysis);
    const report = analysis.report;
    const tdsPlan = report
      ? buildIndiaTdsPlan({
          report,
          tdsPaidYtd: input.tdsPaidYtd,
          monthsRemaining: input.monthsRemaining,
        })
      : undefined;

    return reply.send({
      salary: {
        input: salaryInput,
        breakdown: salaryBreakdown,
        derivedTaxInput,
        tdsPlan,
      },
      analysis: { ...analysis, executiveSummary },
    });
  });

  app.post("/analyze", async (req, reply) => {
    const parsed = AnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { country, input, options } = parsed.data;

    const result = await taxGraph.invoke({
      country,
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
