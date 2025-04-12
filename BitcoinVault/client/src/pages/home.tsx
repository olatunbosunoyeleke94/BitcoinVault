import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TransactionList from "@/components/transaction-list";
import { satoshisToBTC } from "@/lib/bitcoin";
import { Link } from "wouter";
import { Bitcoin, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Wallet, Transaction } from "@shared/schema";

export default function Home() {
  const [showBalance, setShowBalance] = useState(true);
  const { toast } = useToast();

  const { data: wallet, isLoading: isLoadingWallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet/1"],
    retry: 0,
    staleTime: 0,
    enabled: true
  });

  const { data: transactions, isLoading: isLoadingTx } = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/1/transactions"],
    enabled: !!wallet,
    staleTime: 0
  });

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wallet", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/1"] });
      toast({
        title: "Wallet created",
        description: "Your Bitcoin wallet has been created successfully.",
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

  if (isLoadingWallet) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Bitcoin className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold">Welcome to Bitcoin Wallet</h2>
              <p className="text-muted-foreground mt-2">
                Create a new wallet to start sending and receiving Bitcoin.
              </p>
            </div>
            <Button 
              onClick={() => createWalletMutation.mutate()}
              disabled={createWalletMutation.isPending}
              className="w-full max-w-sm mx-auto"
            >
              {createWalletMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                "Create New Wallet"
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Or <Link href="/restore" className="text-primary hover:underline">restore an existing wallet</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bitcoin className="h-12 w-12 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">
                  {showBalance ? (
                    satoshisToBTC(wallet.balance)
                  ) : (
                    "••••••••"
                  )} BTC
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-6 flex space-x-4">
            <Link href="/send">
              <Button className="flex-1">Send</Button>
            </Link>
            <Link href="/receive">
              <Button className="flex-1" variant="outline">Receive</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {isLoadingTx ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        transactions && <TransactionList transactions={transactions} />
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Show Recovery Phrase
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recovery Phrase</AlertDialogTitle>
            <AlertDialogDescription>
              These 12 words are your wallet backup. Write them down and keep them safe.
              Never share them with anyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-4 rounded-lg">
            <code>{wallet.mnemonic}</code>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await navigator.clipboard.writeText(wallet.mnemonic);
              toast({
                description: "Recovery phrase copied to clipboard",
              });
            }}>
              Copy to Clipboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}