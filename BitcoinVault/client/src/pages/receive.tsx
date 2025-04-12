import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AddressDisplay from "@/components/address-display";

export default function Receive() {
  const { data: wallet } = useQuery({
    queryKey: ["/api/wallet/1"],
  });

  if (!wallet) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive Bitcoin</CardTitle>
        <CardDescription>
          Share this address to receive Bitcoin. A new address will be generated for each transaction for privacy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AddressDisplay address={wallet.currentAddress} />
      </CardContent>
    </Card>
  );
}
