import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { btcToSatoshis, estimateFee, validateAddress } from "@/lib/bitcoin";

const sendSchema = z.object({
  address: z.string().refine(validateAddress, "Invalid Bitcoin address"),
  amount: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Amount must be greater than 0"
  ),
});

type SendFormData = z.infer<typeof sendSchema>;

export default function Send() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [fee, setFee] = useState(0);

  const form = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      address: "",
      amount: "",
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["/api/wallet/1"],
  });

  const mutation = useMutation({
    mutationFn: async (values: SendFormData) => {
      const satoshis = btcToSatoshis(values.amount);
      return apiRequest("POST", "/api/wallet/1/send", {
        address: values.address,
        amount: satoshis,
        fee,
        type: "send",
      });
    },
    onSuccess: () => {
      toast({
        title: "Transaction sent",
        description: "Your transaction has been broadcast to the network.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SendFormData) => {
    mutation.mutate(values);
  };

  const updateFee = (amount: string) => {
    if (!isNaN(parseFloat(amount))) {
      setFee(estimateFee(btcToSatoshis(amount)));
    } else {
      setFee(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Bitcoin</CardTitle>
        <CardDescription>
          Send Bitcoin to any address. Transaction fees will be calculated automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter Bitcoin address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                      onChange={(e) => {
                        field.onChange(e);
                        updateFee(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>{fee} satoshis</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Sending..." : "Send Bitcoin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
