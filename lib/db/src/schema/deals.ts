import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dealsTable = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  industryVertical: text("industry_vertical"),
  currentInfrastructure: text("current_infrastructure"),
  numberOfApplications: integer("number_of_applications"),
  workloadTypes: text("workload_types").array(),
  primaryBusinessGoal: text("primary_business_goal"),
  customScope: text("custom_scope"),
  status: text("status").notNull().default("draft"),
  complexity: text("complexity"),
  suggestedStrategy: text("suggested_strategy"),
  totalVMs: integer("total_vms").default(0),
  totalPhysicalServers: integer("total_physical_servers").default(0),
  manualVMCount: integer("manual_vm_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDealSchema = createInsertSchema(dealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof dealsTable.$inferSelect;
