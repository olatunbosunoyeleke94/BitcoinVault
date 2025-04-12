import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bitcoin, Send, Wallet, Upload, LogOut, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleLogout = () => {
    // First disable all queries
    queryClient.setDefaultOptions({
      queries: {
        enabled: false,
      },
    });

    // Clear all data
    queryClient.clear();

    // Explicitly set wallet data to null
    queryClient.setQueryData(["/api/wallet/1"], null);
    queryClient.setQueryData(["/api/wallet/1/transactions"], null);

    // Navigate to home and show toast
    navigate("/");
    toast({
      title: "Logged out",
      description: "Your wallet has been securely disconnected.",
    });
  };

  const wallet = queryClient.getQueryData(["/api/wallet/1"]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <Bitcoin className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Bitcoin Wallet</span>
              </div>
            </Link>
            {wallet !== null && wallet !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {wallet !== null && wallet !== undefined && (
            <aside className="col-span-12 lg:col-span-3">
              <Card className="p-4">
                <nav className="space-y-2">
                  <Link href="/">
                    <Button
                      variant={location === "/" ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Overview
                    </Button>
                  </Link>
                  <Link href="/send">
                    <Button
                      variant={location === "/send" ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </Link>
                  <Link href="/receive">
                    <Button
                      variant={location === "/receive" ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Receive
                    </Button>
                  </Link>
                  <Link href="/lightning">
                    <Button
                      variant={location === "/lightning" ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Lightning
                    </Button>
                  </Link>
                </nav>
              </Card>
            </aside>
          )}

          <main className={wallet !== null && wallet !== undefined ? "col-span-12 lg:col-span-9" : "col-span-12"}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}