import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertWalletSchema, insertTransactionSchema, restoreWalletSchema, insertLightningChannelSchema, insertLightningPaymentSchema } from "@shared/schema";
import { generateMnemonic, validateMnemonic, generateAddress } from "@/lib/bitcoin";
import { createInvoice, sendPayment } from "./breez";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  app.post("/api/wallet", async (req, res) => {
    try {
      storage.clear();
      const mnemonic = generateMnemonic();
      const wallet = await storage.createWallet({
        mnemonic,
        currentAddress: generateAddress(),
        addresses: [generateAddress()],
        balance: 0
      });
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });

  app.post("/api/wallet/restore", async (req, res) => {
    try {
      const data = restoreWalletSchema.parse(req.body);
      const existingWallet = await storage.getWallet(1);
      if (existingWallet) {
        return res.status(400).json({ message: "Wallet already exists. Please logout first." });
      }
      if (!validateMnemonic(data.mnemonic)) {
        return res.status(400).json({ message: "Invalid recovery phrase. Please check your words and try again." });
      }
      const wallet = await storage.createWallet({
        mnemonic: data.mnemonic,
        currentAddress: generateAddress(),
        addresses: [generateAddress()],
        balance: 0
      });
      res.json(wallet);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid request" });
      }
    }
  });

  app.get("/api/wallet/:id", async (req, res) => {
    try {
      const wallet = await storage.getWallet(parseInt(req.params.id));
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });

  app.get("/api/wallet/:id/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions(parseInt(req.params.id));
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/wallet/:id/send", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const tx = insertTransactionSchema.parse({
        ...req.body,
        walletId,
        status: "pending",
        timestamp: new Date()
      });
      const wallet = await storage.getWallet(walletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      if (wallet.balance < (tx.amount + tx.fee)) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const transaction = await storage.createTransaction(tx);
      await storage.updateWallet(walletId, {
        balance: wallet.balance - (tx.amount + tx.fee)
      });
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction" });
    }
  });

  // Lightning Network Routes
  app.post("/api/wallet/:id/lightning/toggle", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const { enabled } = req.body;
      const wallet = await storage.getWallet(walletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      const updated = await storage.updateWallet(walletId, {
        lightningEnabled: enabled
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle Lightning Network" });
    }
  });

  app.post("/api/wallet/:id/lightning/invoice", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const { amount, memo } = req.body;

      console.log("Creating Lightning invoice:", { amount, memo });

      const wallet = await storage.getWallet(walletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      if (!wallet.lightningEnabled) {
        return res.status(400).json({ message: "Lightning Network is not enabled" });
      }

      const { paymentHash, paymentRequest } = await createInvoice(amount, memo);

      const payment = await storage.createLightningPayment({
        walletId,
        type: "receive",
        amount,
        fee: 0,
        paymentHash,
        paymentRequest,
        status: "pending"
      });

      res.json({
        paymentHash: payment.paymentHash,
        paymentRequest: payment.paymentRequest
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(400).json({ message: "Failed to create invoice: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  app.post("/api/wallet/:id/lightning/pay", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const { paymentRequest } = req.body;

      const wallet = await storage.getWallet(walletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      if (!wallet.lightningEnabled) {
        return res.status(400).json({ message: "Lightning Network is not enabled" });
      }

      const result = await sendPayment(paymentRequest);

      if (result.status === "complete") {
        const payment = await storage.createLightningPayment({
          walletId,
          type: "send",
          amount: 0, // Will be updated from decoded invoice
          fee: 0,    // Will be updated from payment result
          paymentHash: result.paymentHash,
          paymentRequest,
          status: "succeeded"
        });

        await storage.updateWallet(walletId, {
          lightningBalance: wallet.lightningBalance! - (payment.amount + payment.fee)
        });

        res.json(payment);
      } else {
        // Include more detailed error information
        const errorMsg = result.error || "Payment failed with unknown error";
        
        if (errorMsg.includes("private node") || errorMsg.includes("route hints")) {
          return res.status(400).json({ 
            message: "Payment failed: Invoice was created by a private node that cannot be reached. This is a limitation with the Lightning Network, not your wallet. The invoice creator needs to include route hints.",
            error: errorMsg
          });
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("Error sending payment:", error);
      res.status(400).json({ message: "Failed to send payment: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

  app.get("/api/wallet/:id/lightning/channels", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const channels = await storage.getLightningChannels(walletId);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Lightning channels" });
    }
  });

  app.post("/api/wallet/:id/lightning/channels", async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const channel = insertLightningChannelSchema.parse({
        ...req.body,
        walletId,
        remoteNodeId: generateNodeId(),
        status: "opening"
      });
      const wallet = await storage.getWallet(walletId);
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      if (wallet.balance < channel.capacity) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const newChannel = await storage.createLightningChannel(channel);
      await storage.updateWallet(walletId, {
        balance: wallet.balance - channel.capacity,
        lightningBalance: (wallet.lightningBalance ?? 0) + channel.localBalance
      });
      res.json(newChannel);
    } catch (error) {
      res.status(400).json({ message: "Invalid channel request" });
    }
  });


  return httpServer;
}

function generateNodeId() {
  // Replace with your actual node ID generation logic
  return "testNodeId";
}