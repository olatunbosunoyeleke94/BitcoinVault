import { nanoid } from 'nanoid';
import fetch from 'node-fetch';

// LNBits API configuration
const LNBITS_ENDPOINT = process.env.LNBITS_ENDPOINT || "https://legend.lnbits.com";
const LNBITS_API_KEY = process.env.LNBITS_API_KEY || "";
const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY || "";

if (!LNBITS_API_KEY || !LNBITS_ADMIN_KEY) {
  throw new Error("LNBits configuration missing in environment variables");
}

// Helper for common API request options
const getRequestOptions = (method: string, key: string, body?: unknown) => ({
  method,
  headers: {
    "Content-Type": "application/json",
    "X-Api-Key": key,
  },
  body: body ? JSON.stringify(body) : undefined
});

export async function createInvoice(amount: number, memo: string): Promise<{
  paymentHash: string;
  paymentRequest: string;
}> {
  try {
    console.log("Creating LNBits invoice:", { amount, memo });

    const response = await fetch(`${LNBITS_ENDPOINT}/api/v1/payments`, 
      getRequestOptions("POST", LNBITS_ADMIN_KEY, {
        out: false,
        amount: amount,
        memo: memo,
        unit: "sat"
      })
    );

    console.log("LNBits API response status:", response.status);
    const responseText = await response.text();
    console.log("LNBits API raw response:", responseText);

    if (!response.ok) {
      throw new Error(`LNBits API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log("Parsed LNBits API response:", data);

    if (!data.payment_hash || !data.payment_request) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response format from LNBits API");
    }

    return {
      paymentHash: data.payment_hash,
      paymentRequest: data.payment_request
    };
  } catch (error) {
    console.error("Error creating LNBits invoice:", error);
    throw error;
  }
}

export async function sendPayment(paymentRequest: string): Promise<{
  paymentHash: string;
  preimage: string;
  status: string;
  error?: string;
}> {
  try {
    console.log("Sending payment via LNBits:", { paymentRequest });

    const response = await fetch(`${LNBITS_ENDPOINT}/api/v1/payments`,
      getRequestOptions("POST", LNBITS_ADMIN_KEY, {
        out: true,
        bolt11: paymentRequest
      })
    );

    console.log("LNBits payment API response status:", response.status);
    const responseText = await response.text();
    console.log("LNBits payment API raw response:", responseText);

    if (!response.ok) {
      // Try to parse the error message
      let errorMsg = `LNBits API error: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.detail) {
          errorMsg = errorData.detail;
        }
      } catch (e) {
        errorMsg = `${errorMsg} - ${responseText}`;
      }
      
      return {
        paymentHash: "",
        preimage: "",
        status: "failed",
        error: errorMsg
      };
    }

    const data = JSON.parse(responseText);
    console.log("Parsed LNBits payment response:", data);

    // Check for specific error conditions in success response
    if (data.error) {
      return {
        paymentHash: data.payment_hash || "",
        preimage: data.payment_preimage || "",
        status: "failed",
        error: data.error
      };
    }

    return {
      paymentHash: data.payment_hash,
      preimage: data.payment_preimage || "",
      status: data.paid ? "complete" : "failed"
    };
  } catch (error) {
    console.error("Error sending payment via LNBits:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      paymentHash: "",
      preimage: "",
      status: "failed",
      error: errorMessage
    };
  }
}

export async function checkPaymentStatus(paymentHash: string): Promise<boolean> {
  try {
    console.log("Checking payment status:", { paymentHash });

    const response = await fetch(
      `${LNBITS_ENDPOINT}/api/v1/payments/${paymentHash}`,
      getRequestOptions("GET", LNBITS_API_KEY)
    );

    console.log("Status check response status:", response.status);
    const responseText = await response.text();
    console.log("Status check raw response:", responseText);

    if (!response.ok) {
      throw new Error(`LNBits API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log("Parsed status check response:", data);

    return data.paid === true;
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
}