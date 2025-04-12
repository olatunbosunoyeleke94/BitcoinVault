import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@shared/schema";
import { satoshisToBTC } from "@/lib/bitcoin";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No transactions yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center space-x-4">
                {tx.type === "send" ? (
                  <ArrowUpRight className="h-8 w-8 text-destructive" />
                ) : (
                  <ArrowDownLeft className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">
                    {tx.type === "send" ? "Sent" : "Received"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(tx.timestamp), "PPp")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-medium">
                  {tx.type === "send" ? "-" : "+"}
                  {satoshisToBTC(tx.amount)} BTC
                </p>
                {tx.type === "send" && (
                  <p className="text-sm text-muted-foreground">
                    Fee: {satoshisToBTC(tx.fee)} BTC
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
