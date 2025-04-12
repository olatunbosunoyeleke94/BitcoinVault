import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Wallet } from "@shared/schema";
import { Loader2, Zap } from "lucide-react";
import { satoshisToBTC, btcToSatoshis } from "@/lib/bitcoin";
import QRCode from "react-qr-code";

const invoiceSchema = z.object({
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be greater than 0"
  ),
  memo: z.string().optional(),
});

const paymentSchema = z.object({
  invoice: z.string().min(1, "Payment request is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function Lightning() {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<{ paymentRequest: string; paymentHash: string } | null>(null);

  const { data: wallet, isLoading: isLoadingWallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet/1"],
  });

  const toggleLightningMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wallet/1/lightning/toggle", {
        enabled: !wallet?.lightningEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
      toast({
        title: wallet?.lightningEnabled ? "Lightning disabled" : "Lightning enabled",
        description: wallet?.lightningEnabled 
          ? "Lightning Network features have been disabled." 
          : "Lightning Network features are now available.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: InvoiceFormData) => {
      const response = await apiRequest("POST", "/api/wallet/1/lightning/invoice", {
        amount: btcToSatoshis(values.amount),
        memo: values.memo || "Payment to Bitcoin Wallet",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setInvoice(data);
      toast({
        title: "Invoice created",
        description: "Share this invoice to receive payment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async (values: PaymentFormData) => {
      return apiRequest("POST", "/api/wallet/1/lightning/pay", {
        paymentRequest: values.invoice,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
      toast({
        title: "Payment sent",
        description: "Lightning payment has been sent successfully.",
      });
      paymentForm.reset();
    },
    onError: (error) => {
      // Check for private node error message
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('private node') || errorMessage.includes('route hints')) {
        toast({
          title: "Payment Failed - Private Node Issue",
          description: "This invoice was created by a private Lightning node that cannot be reached. The invoice creator needs to include route hints. This is a limitation with the Lightning Network protocol, not your wallet.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      amount: "",
      memo: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice: "",
    },
  });

  if (isLoadingWallet) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Not Found</CardTitle>
            <CardDescription>
              You need to create or restore a wallet first before accessing Lightning Network features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = "/"}>
              Go to Home Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lightning Network</CardTitle>
          <CardDescription>
            Enable Lightning Network for instant, low-fee Bitcoin transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Enable Lightning Network</h4>
              <p className="text-sm text-muted-foreground">
                Activate Lightning Network features for this wallet
              </p>
            </div>
            <Switch
              checked={wallet.lightningEnabled}
              onCheckedChange={() => toggleLightningMutation.mutate()}
              disabled={toggleLightningMutation.isPending}
            />
          </div>

          {wallet.lightningEnabled && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-4">
                <Zap className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Lightning Balance</p>
                  <p className="text-2xl font-bold">
                    {satoshisToBTC(wallet.lightningBalance)} BTC
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {wallet.lightningEnabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Receive Payment</CardTitle>
              <CardDescription>
                Create a Lightning invoice to receive payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 border border-amber-400 bg-amber-50 rounded-md text-amber-800">
                <p className="text-sm font-medium">⚠️ Important Notice</p>
                <p className="text-sm mt-1">
                  Generated invoices may not be payable by some Lightning wallets. This is due to a technical limitation with private Lightning nodes. For details, please check the README.
                </p>
              </div>
              
              <Form {...invoiceForm}>
                <form onSubmit={invoiceForm.handleSubmit((values) => createInvoiceMutation.mutate(values))} className="space-y-4">
                  <FormField
                    control={invoiceForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (BTC)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.00000001"
                            placeholder="0.00000000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={invoiceForm.control}
                    name="memo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Payment description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createInvoiceMutation.isPending}
                  >
                    {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                  </Button>
                </form>
              </Form>

              {invoice && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCode value={invoice.paymentRequest} size={200} />
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg break-all">
                    <p className="text-xs font-mono">{invoice.paymentRequest}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Payment</CardTitle>
              <CardDescription>
                Pay a Lightning invoice using your Lightning balance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit((values) => payInvoiceMutation.mutate(values))} className="space-y-4">
                  <FormField
                    control={paymentForm.control}
                    name="invoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Request</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="lnbc..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={payInvoiceMutation.isPending}
                  >
                    {payInvoiceMutation.isPending ? "Sending..." : "Send Payment"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}