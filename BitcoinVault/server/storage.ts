import { type Wallet, type InsertWallet, type Transaction, type InsertTransaction, type LightningChannel, type InsertLightningChannel, type LightningPayment, type InsertLightningPayment } from "@shared/schema";

export interface IStorage {
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWallet(id: number): Promise<Wallet | undefined>;
  updateWallet(id: number, wallet: Partial<Wallet>): Promise<Wallet>;
  getTransactions(walletId: number): Promise<Transaction[]>;
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createLightningChannel(channel: InsertLightningChannel): Promise<LightningChannel>;
  getLightningChannels(walletId: number): Promise<LightningChannel[]>;
  updateLightningChannel(id: number, channel: Partial<LightningChannel>): Promise<LightningChannel>;
  createLightningPayment(payment: InsertLightningPayment): Promise<LightningPayment>;
  getLightningPayments(walletId: number): Promise<LightningPayment[]>;
  clear(): void;
}

export class MemStorage implements IStorage {
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private lightningChannels: Map<number, LightningChannel>;
  private lightningPayments: Map<number, LightningPayment>;
  private currentWalletId: number;
  private currentTxId: number;
  private currentChannelId: number;
  private currentPaymentId: number;

  constructor() {
    this.wallets = new Map();
    this.transactions = new Map();
    this.lightningChannels = new Map();
    this.lightningPayments = new Map();
    this.currentWalletId = 1;
    this.currentTxId = 1;
    this.currentChannelId = 1;
    this.currentPaymentId = 1;
  }

  clear() {
    this.wallets.clear();
    this.transactions.clear();
    this.lightningChannels.clear();
    this.lightningPayments.clear();
    this.currentWalletId = 1;
    this.currentTxId = 1;
    this.currentChannelId = 1;
    this.currentPaymentId = 1;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const id = 1;  // Always use ID 1 for single wallet
    const newWallet: Wallet = { 
      id,
      mnemonic: wallet.mnemonic,
      currentAddress: wallet.currentAddress,
      addresses: wallet.addresses,
      balance: wallet.balance ?? 0,
      lightningEnabled: wallet.lightningEnabled ?? false,
      lightningBalance: wallet.lightningBalance ?? 0
    };
    this.wallets.set(id, newWallet);
    return newWallet;
  }

  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async updateWallet(id: number, update: Partial<Wallet>): Promise<Wallet> {
    const wallet = await this.getWallet(id);
    if (!wallet) throw new Error("Wallet not found");

    const updated = { ...wallet, ...update };
    this.wallets.set(id, updated);
    return updated;
  }

  async getTransactions(walletId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(tx => tx.walletId === walletId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const id = this.currentTxId++;
    const newTx: Transaction = { 
      ...tx, 
      id,
      timestamp: tx.timestamp ?? new Date()
    };
    this.transactions.set(id, newTx);
    return newTx;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createLightningChannel(channel: InsertLightningChannel): Promise<LightningChannel> {
    const id = this.currentChannelId++;
    const newChannel: LightningChannel = {
      ...channel,
      id,
      createdAt: new Date()
    };
    this.lightningChannels.set(id, newChannel);
    return newChannel;
  }

  async getLightningChannels(walletId: number): Promise<LightningChannel[]> {
    return Array.from(this.lightningChannels.values())
      .filter(channel => channel.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateLightningChannel(id: number, update: Partial<LightningChannel>): Promise<LightningChannel> {
    const channel = this.lightningChannels.get(id);
    if (!channel) throw new Error("Channel not found");

    const updated = { ...channel, ...update };
    this.lightningChannels.set(id, updated);
    return updated;
  }

  async createLightningPayment(payment: InsertLightningPayment): Promise<LightningPayment> {
    const id = this.currentPaymentId++;
    const newPayment: LightningPayment = {
      ...payment,
      id,
      timestamp: new Date()
    };
    this.lightningPayments.set(id, newPayment);
    return newPayment;
  }

  async getLightningPayments(walletId: number): Promise<LightningPayment[]> {
    return Array.from(this.lightningPayments.values())
      .filter(payment => payment.walletId === walletId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();