// Lightning Network utilities for Nodeless integration
const SATS_PER_BTC = 100_000_000;

export async function createInvoice(amount: number, memo: string): Promise<{
  paymentHash: string;
  paymentRequest: string;
}> {
  try {
    const response = await fetch("/api/wallet/1/lightning/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        memo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create invoice");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw new Error("Failed to create Lightning invoice");
  }
}

export async function sendPayment(paymentRequest: string): Promise<{
  paymentHash: string;
  preimage: string;
  status: string;
}> {
  try {
    const response = await fetch("/api/wallet/1/lightning/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentRequest,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending payment:", error);
    throw new Error("Failed to send Lightning payment");
  }
}

// Utility functions for amount conversion
export function satoshisToBTC(sats: number): string {
  return (sats / SATS_PER_BTC).toFixed(8);
}

export function btcToSatoshis(btc: string): number {
  return Math.floor(parseFloat(btc) * SATS_PER_BTC);
}

// Validation utilities
export function validatePaymentRequest(paymentRequest: string): boolean {
  return /^lnbc[0-9a-zA-Z]*$/.test(paymentRequest);
}