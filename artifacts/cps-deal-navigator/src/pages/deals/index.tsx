import { useListDeals, getListDealsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import { ComplexityBadge } from "@/components/deals/complexity-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilePlus2, Search } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DealList() {
  const { data: deals, isLoading, error } = useListDeals({
    query: { queryKey: getListDealsQueryKey() }
  });
  
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-9 w-64" />
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !deals) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load deals. Ensure the API server is running.
        </div>
      </div>
    );
  }

  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(search.toLowerCase()) || 
    deal.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track all CPS shaping deals.</p>
        </div>
        <Link href="/deals/new">
          <Button size="sm">
            <FilePlus2 className="w-4 h-4 mr-2" />
            New Deal
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2 w-full max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search deals..." 
            className="w-full pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Complexity</TableHead>
              <TableHead className="text-right">Workloads</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.length > 0 ? (
              filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    <Link href={`/deals/${deal.id}`}>
                      <span className="hover:underline cursor-pointer">{deal.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{deal.clientName}</TableCell>
                  <TableCell>
                    <DealStatusBadge status={deal.status} />
                  </TableCell>
                  <TableCell>
                    <ComplexityBadge complexity={deal.complexity} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {deal.totalVMs || 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(deal.updatedAt || deal.createdAt), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No deals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
