import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  mnemonic: text("mnemonic").notNull(),
  currentAddress: text("current_address").notNull(),
  balance: integer("balance").notNull().default(0), // Satoshis
  addresses: text("addresses").array().notNull(),
  lightningEnabled: boolean("lightning_enabled").notNull().default(false),
  lightningBalance: integer("lightning_balance").notNull().default(0), // Satoshis
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: text("type", { enum: ["send", "receive"] }).notNull(),
  address: text("address").notNull(),
  amount: integer("amount").notNull(), // Satoshis
  fee: integer("fee").notNull(), // Satoshis
  status: text("status", { enum: ["pending", "confirmed"] }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const lightningChannels = pgTable("lightning_channels", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  remoteNodeId: text("remote_node_id").notNull(),
  capacity: integer("capacity").notNull(), // Satoshis
  localBalance: integer("local_balance").notNull(), // Satoshis
  status: text("status", { enum: ["opening", "active", "closing", "closed"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lightningPayments = pgTable("lightning_payments", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: text("type", { enum: ["send", "receive"] }).notNull(),
  amount: integer("amount").notNull(), // Satoshis
  fee: integer("fee").notNull(), // Satoshis
  paymentHash: text("payment_hash").notNull(),
  paymentRequest: text("payment_request").notNull(),
  status: text("status", { enum: ["pending", "succeeded", "failed"] }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertLightningChannelSchema = createInsertSchema(lightningChannels).omit({ id: true });
export const insertLightningPaymentSchema = createInsertSchema(lightningPayments).omit({ id: true });

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertLightningChannel = z.infer<typeof insertLightningChannelSchema>;
export type InsertLightningPayment = z.infer<typeof insertLightningPaymentSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type LightningChannel = typeof lightningChannels.$inferSelect;
export type LightningPayment = typeof lightningPayments.$inferSelect;

export const restoreWalletSchema = z.object({
  mnemonic: z.string().min(1),
});