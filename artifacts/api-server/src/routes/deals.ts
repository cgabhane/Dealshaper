import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, dealsTable, inventoryItemsTable } from "@workspace/db";
import {
  CreateDealBody,
  UpdateDealBody,
  GetDealParams,
  UpdateDealParams,
  DeleteDealParams,
  GetDealInventoryParams,
  AddInventoryItemParams,
  AddInventoryItemBody,
  GetDealEstimateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeEstimate(
  totalVMs: number,
  totalPhysical: number,
  manualVM: number,
  workloadTypes: string[],
  businessGoal: string | null | undefined
) {
  const totalWorkloads = totalVMs + totalPhysical + manualVM;

  let complexityScore: "low" | "medium" | "high" = "low";
  const riskFlags: string[] = [];

  if (totalWorkloads > 500) {
    complexityScore = "high";
    riskFlags.push("Large-scale migration (>500 workloads) — phased approach recommended");
  } else if (totalWorkloads > 100) {
    complexityScore = "medium";
  }

  if (workloadTypes.includes("SAP/ERP")) {
    complexityScore = "high";
    riskFlags.push("SAP/ERP workloads require specialized migration expertise");
  }
  if (workloadTypes.includes("Legacy Monoliths")) {
    if (complexityScore !== "high") complexityScore = "medium";
    riskFlags.push("Legacy monoliths may require refactoring before migration");
  }
  if (workloadTypes.includes("AI/ML Workloads")) {
    if (complexityScore !== "high") complexityScore = "medium";
    riskFlags.push("AI/ML workloads require GPU-optimized cloud instances");
  }
  if (totalPhysical > 0) {
    riskFlags.push(`${totalPhysical} physical servers require lift-and-shift or P2V conversion`);
  }

  let suggestedStrategy = "Rehost (Lift & Shift)";
  if (businessGoal === "Modernization") {
    suggestedStrategy = "Refactor";
  } else if (businessGoal === "Cost Reduction") {
    suggestedStrategy = "Rehost + Optimize";
  } else if (businessGoal === "Scalability") {
    suggestedStrategy = "Re-platform";
  } else if (businessGoal === "Security/Compliance") {
    suggestedStrategy = "Rehost + Harden";
  } else if (businessGoal === "Operational Efficiency") {
    suggestedStrategy = "Re-platform + Automate";
  }

  const baseWeeksPerWorkload = complexityScore === "high" ? 0.5 : complexityScore === "medium" ? 0.3 : 0.15;
  const estimatedMigrationWeeks = Math.max(4, Math.ceil(totalWorkloads * baseWeeksPerWorkload));
  const estimatedEffortDays = Math.ceil(estimatedMigrationWeeks * 5 * 2);

  const costPerWorkloadMin = complexityScore === "high" ? 2000 : complexityScore === "medium" ? 1000 : 500;
  const costPerWorkloadMax = complexityScore === "high" ? 5000 : complexityScore === "medium" ? 2500 : 1500;
  const costIndicatorMin = totalWorkloads * costPerWorkloadMin;
  const costIndicatorMax = totalWorkloads * costPerWorkloadMax;

  return {
    totalWorkloads,
    estimatedMigrationWeeks,
    estimatedEffortDays,
    complexityScore,
    suggestedStrategy,
    riskFlags,
    costIndicatorMin,
    costIndicatorMax,
  };
}

router.get("/deals/summary", async (req, res): Promise<void> => {
  const deals = await db.select().from(dealsTable).orderBy(dealsTable.createdAt);

  const byStatus: Record<string, number> = {};
  let totalVMs = 0;
  let totalApplications = 0;

  for (const deal of deals) {
    byStatus[deal.status] = (byStatus[deal.status] ?? 0) + 1;
    totalVMs += (deal.totalVMs ?? 0) + (deal.totalPhysicalServers ?? 0) + (deal.manualVMCount ?? 0);
    totalApplications += deal.numberOfApplications ?? 0;
  }

  const recentDeals = deals.slice(-5).reverse();

  res.json({
    totalDeals: deals.length,
    byStatus,
    totalVMs,
    totalApplications,
    avgComplexity: "medium",
    recentDeals,
  });
});

router.get("/deals", async (_req, res): Promise<void> => {
  const deals = await db.select().from(dealsTable).orderBy(dealsTable.createdAt);
  res.json(deals);
});

router.post("/deals", async (req, res): Promise<void> => {
  const parsed = CreateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const estimate = computeEstimate(
    data.totalVMs ?? 0,
    data.totalPhysicalServers ?? 0,
    data.manualVMCount ?? 0,
    (data.workloadTypes ?? []) as string[],
    data.primaryBusinessGoal
  );

  const [deal] = await db
    .insert(dealsTable)
    .values({
      ...data,
      complexity: estimate.complexityScore,
      suggestedStrategy: estimate.suggestedStrategy,
      status: "draft",
    })
    .returning();

  res.status(201).json(deal);
});

router.get("/deals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  res.json(deal);
});

router.put("/deals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const parsed = UpdateDealBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const existing = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!existing[0]) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const estimate = computeEstimate(
    data.totalVMs ?? existing[0].totalVMs ?? 0,
    data.totalPhysicalServers ?? existing[0].totalPhysicalServers ?? 0,
    data.manualVMCount ?? existing[0].manualVMCount ?? 0,
    ((data.workloadTypes ?? existing[0].workloadTypes ?? []) as string[]),
    data.primaryBusinessGoal ?? existing[0].primaryBusinessGoal
  );

  const [deal] = await db
    .update(dealsTable)
    .set({
      ...data,
      complexity: estimate.complexityScore,
      suggestedStrategy: estimate.suggestedStrategy,
    })
    .where(eq(dealsTable.id, id))
    .returning();

  res.json(deal);
});

router.delete("/deals/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const [deal] = await db.delete(dealsTable).where(eq(dealsTable.id, id)).returning();
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/deals/:id/inventory", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const items = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.dealId, id));
  res.json(items);
});

router.post("/deals/:id/inventory", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const parsed = AddInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(inventoryItemsTable)
    .values({ ...parsed.data, dealId: id })
    .returning();

  const inventoryItems = await db.select().from(inventoryItemsTable).where(eq(inventoryItemsTable.dealId, id));
  const vmCount = inventoryItems.filter((i) => i.serverType === "vm" || i.serverType === "container").length;
  const physicalCount = inventoryItems.filter((i) => i.serverType === "physical").length;

  await db
    .update(dealsTable)
    .set({ totalVMs: vmCount, totalPhysicalServers: physicalCount })
    .where(eq(dealsTable.id, id));

  res.status(201).json(item);
});

router.get("/deals/:id/estimate", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid deal ID" });
    return;
  }

  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, id));
  if (!deal) {
    res.status(404).json({ error: "Deal not found" });
    return;
  }

  const estimate = computeEstimate(
    deal.totalVMs ?? 0,
    deal.totalPhysicalServers ?? 0,
    deal.manualVMCount ?? 0,
    (deal.workloadTypes ?? []) as string[],
    deal.primaryBusinessGoal
  );

  res.json({
    dealId: id,
    totalVMs: deal.totalVMs ?? 0,
    totalPhysicalServers: deal.totalPhysicalServers ?? 0,
    ...estimate,
  });
});

export default router;
