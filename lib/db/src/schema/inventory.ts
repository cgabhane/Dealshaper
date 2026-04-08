import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dealsTable } from "./deals";

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => dealsTable.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("manual"),
  serverName: text("server_name"),
  serverType: text("server_type").notNull().default("unknown"),
  os: text("os"),
  cpuCores: integer("cpu_cores"),
  ramGB: real("ram_gb"),
  diskGB: real("disk_gb"),
  environment: text("environment"),
  application: text("application"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
