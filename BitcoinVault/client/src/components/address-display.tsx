import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddressDisplayProps {
  address: string;
}

export default function AddressDisplay({ address }: AddressDisplayProps) {
  const { toast } = useToast();
  
  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    toast({
      title: "Address copied",
      description: "The Bitcoin address has been copied to your clipboard.",
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCode value={address} size={200} />
          </div>
          
          <div className="flex items-center space-x-2">
            <code className="bg-muted px-2 py-1 rounded text-sm">
              {address}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
