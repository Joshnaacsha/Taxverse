"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const schemas_1 = require("./api/schemas");
const graph_1 = require("./graph/graph");
const executiveSummary_1 = require("./modules/india/executiveSummary");
const qaAgent_1 = require("./agents/qaAgent");
const payslipParser_1 = require("./modules/india/payslipParser");
const salaryEngine_1 = require("./modules/india/salaryEngine");
const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";
async function main() {
    const app = (0, fastify_1.default)({ logger: true, bodyLimit: 10 * 1024 * 1024 });
    await app.register(cors_1.default, {
        origin: true,
        methods: ["GET", "POST", "OPTIONS"],
    });
    app.get("/health", async () => ({ ok: true }));
    app.post("/payslip/parse", async (req, reply) => {
        const parsed = schemas_1.PayslipParseRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        try {
            const r = await (0, payslipParser_1.parsePayslipPdf)(parsed.data);
            return reply.send(r);
        }
        catch (err) {
            req.log.error({ err }, "Payslip parse failed");
            return reply.status(500).send({
                error: "Payslip parse failed",
                message: "Could not parse payslip. Please use manual entry.",
            });
        }
    });
    app.post("/salary/analyze", async (req, reply) => {
        const parsed = schemas_1.IndiaSalaryAnalyzeRequestSchema.safeParse(req.body);
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
            currency: "INR",
        };
        const salaryBreakdown = (0, salaryEngine_1.buildIndiaSalaryBreakdown)(salaryInput);
        const derivedTaxInput = (0, salaryEngine_1.deriveIndiaTaxInputFromSalary)(salaryInput);
        const analysis = await graph_1.taxGraph.invoke({
            country: "IN",
            userInput: derivedTaxInput,
            options: {
                includeAi: true,
                projectionYears: 3,
                projectionGrowthRatePct: 10,
                scenarioCount: 8,
            },
        });
        const executiveSummary = (0, executiveSummary_1.buildExecutiveSummary)(analysis);
        const report = analysis.report;
        const tdsPlan = report
            ? (0, salaryEngine_1.buildIndiaTdsPlan)({
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
        const parsed = schemas_1.AnalyzeRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { country, input, options } = parsed.data;
        const result = await graph_1.taxGraph.invoke({
            country,
            userInput: input,
            options: {
                includeAi: options?.includeAi ?? true,
                projectionYears: options?.projectionYears ?? 3,
                projectionGrowthRatePct: options?.projectionGrowthRatePct ?? 10,
                scenarioCount: options?.scenarioCount ?? 8,
            },
        });
        const executiveSummary = (0, executiveSummary_1.buildExecutiveSummary)(result);
        return reply.send({ ...result, executiveSummary });
    });
    app.post("/qa", async (req, reply) => {
        const parsed = schemas_1.QaRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { context, question, history } = parsed.data;
        // Prevent huge prompts in hackathon demos
        const contextSize = JSON.stringify(context).length;
        if (contextSize > 60000) {
            return reply.status(413).send({ error: "Context too large" });
        }
        const answer = await (0, qaAgent_1.answerWithContext)({ context, question, history });
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
