import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { restoreWalletSchema } from "@shared/schema";
import type { z } from "zod";

type RestoreFormData = z.infer<typeof restoreWalletSchema>;

export default function Restore() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<RestoreFormData>({
    resolver: zodResolver(restoreWalletSchema),
    defaultValues: {
      mnemonic: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: RestoreFormData) => {
      return apiRequest("POST", "/api/wallet/restore", values);
    },
    onSuccess: () => {
      // First invalidate queries to trigger a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1/transactions"] });

      // Ensure queries are enabled
      queryClient.setQueryDefaults(["/api/wallet/1"], { enabled: true });
      queryClient.setQueryDefaults(["/api/wallet/1/transactions"], { enabled: true });

      toast({
        title: "Wallet restored",
        description: "Your wallet has been successfully restored.",
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

  const onSubmit = (values: RestoreFormData) => {
    mutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restore Wallet</CardTitle>
        <CardDescription>
          Enter your 12-word recovery phrase to restore your wallet. Make sure each word is spelled correctly and in the right order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mnemonic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recovery Phrase</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter your 12 words separated by spaces"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Restoring..." : "Restore Wallet"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}