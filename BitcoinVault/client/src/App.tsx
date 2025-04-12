import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout";
import Home from "@/pages/home";
import Send from "@/pages/send";
import Receive from "@/pages/receive";
import Restore from "@/pages/restore";
import Lightning from "@/pages/lightning";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/send" component={Send} />
        <Route path="/receive" component={Receive} />
        <Route path="/restore" component={Restore} />
        <Route path="/lightning" component={Lightning} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;