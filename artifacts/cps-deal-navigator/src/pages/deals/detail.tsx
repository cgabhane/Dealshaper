import { useParams } from "wouter";
import { useState, memo } from "react";
import {
  useGetDeal,
  getGetDealQueryKey,
  useGetDealInventory,
  getGetDealInventoryQueryKey,
  useGetDealEstimate,
  getGetDealEstimateQueryKey,
  useAddInventoryItem,
  useUpdateDeal,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { DealStatusBadge } from "@/components/deals/deal-status-badge";
import { ComplexityBadge } from "@/components/deals/complexity-badge";
import { LiveInsightPanel } from "@/components/deals/live-insight-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Upload,
  Server,
  Briefcase,
  Sparkles,
  Loader2,
  Copy,
  CheckCheck,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const InventoryTable = memo(function InventoryTable({ inventory }: { inventory: any[] }) {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Server Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>OS</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs font-medium">
                {item.serverName || `srv-${item.id}`}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {item.serverType}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{item.os || "-"}</TableCell>
              <TableCell className="text-sm">{item.environment || "-"}</TableCell>
              <TableCell className="text-xs text-muted-foreground capitalize">{item.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

function DetailSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function AIProposalTab({ deal, estimate }: { deal: any; estimate: any }) {
  const [proposal, setProposal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProposal("");
    try {
      const res = await fetch(`${API_BASE}/api/ai/generate-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealData: {
            name: deal.name,
            clientName: deal.clientName,
            industryVertical: deal.industryVertical,
            primaryBusinessGoal: deal.primaryBusinessGoal,
            currentInfrastructure: deal.currentInfrastructure,
            workloadTypes: deal.workloadTypes,
            totalVMs: deal.totalVMs,
            totalPhysicalServers: deal.totalPhysicalServers,
            suggestedStrategy: deal.suggestedStrategy,
            complexity: deal.complexity,
            estimatedEffortDays: estimate?.estimatedEffortDays,
            estimatedMigrationWeeks: estimate?.estimatedMigrationWeeks,
            costIndicatorMin: estimate?.costIndicatorMin,
            costIndicatorMax: estimate?.costIndicatorMax,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      setProposal(data.proposal);
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message || "Check that Ollama is running with gemma4:e4b pulled.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Proposal Generator
          </CardTitle>
          <CardDescription>
            Generate an executive-level proposal summary using local Ollama (gemma4:e4b). No data leaves your machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm border rounded-md p-3 bg-muted/20">
            <div>
              <span className="text-muted-foreground">Client:</span>{" "}
              <span className="font-medium">{deal.clientName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Strategy:</span>{" "}
              <span className="font-medium">{deal.suggestedStrategy || "TBD"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Complexity:</span>{" "}
              <ComplexityBadge complexity={deal.complexity} />
            </div>
            <div>
              <span className="text-muted-foreground">Timeline:</span>{" "}
              <span className="font-medium">{estimate?.estimatedMigrationWeeks ?? "—"} weeks</span>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating via Ollama…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Executive Proposal
              </>
            )}
          </Button>

          {proposal && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Generated Proposal
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
                  {copied ? (
                    <><CheckCheck className="w-3.5 h-3.5 mr-1 text-green-600" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>
                  )}
                </Button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 border rounded-md bg-muted/10 max-h-[500px] overflow-y-auto">
                {proposal}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DealDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deal, isLoading: dealLoading } = useGetDeal(id, {
    query: { enabled: !!id, queryKey: getGetDealQueryKey(id) },
  });

  const { data: inventory, isLoading: invLoading } = useGetDealInventory(id, {
    query: { enabled: !!id, queryKey: getGetDealInventoryQueryKey(id) },
  });

  const { data: estimate, isLoading: estLoading } = useGetDealEstimate(id, {
    query: { enabled: !!id, queryKey: getGetDealEstimateQueryKey(id) },
  });

  const updateDeal = useUpdateDeal();
  const addInventoryItem = useAddInventoryItem();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDeal.mutateAsync({ id, data: { status: newStatus as any } });
      queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(id) });
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "csv" | "excel") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          toast({ title: "Processing CSV", description: `Found ${results.data.length} rows.` });
          let successCount = 0;
          for (const row of results.data as any[]) {
            try {
              await addInventoryItem.mutateAsync({
                id,
                data: {
                  source: "cmdb",
                  serverName: row.ServerName || row.name || row.Name,
                  serverType: row.Type?.toLowerCase() === "physical" ? "physical" : "vm",
                  os: row.OS || row.OperatingSystem,
                  environment: row.Environment || row.Env,
                  application: row.Application || row.App,
                },
              });
              successCount++;
            } catch (err) {
              console.error("Failed to add row", row, err);
            }
          }
          queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
          toast({ title: "Import complete", description: `Added ${successCount} items from CSV.` });
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        toast({ title: "Processing Excel", description: `Found ${data.length} rows.` });
        let successCount = 0;
        for (const row of data as any[]) {
          try {
            await addInventoryItem.mutateAsync({
              id,
              data: {
                source: "excel",
                serverName: row.ServerName || row.name || row.Name,
                serverType: row.Type?.toLowerCase() === "physical" ? "physical" : "vm",
                os: row.OS || row.OperatingSystem,
                environment: row.Environment || row.Env,
                application: row.Application || row.App,
              },
            });
            successCount++;
          } catch (err) {
            console.error("Failed to add row", row, err);
          }
        }
        queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
        toast({ title: "Import complete", description: `Added ${successCount} items from Excel.` });
      };
      reader.readAsBinaryString(file);
    }
  };

  const [manualForm, setManualForm] = useState({
    serverName: "",
    serverType: "vm",
    os: "",
    environment: "",
    application: "",
  });

  const handleManualAdd = async () => {
    if (!manualForm.serverName) return;
    try {
      await addInventoryItem.mutateAsync({
        id,
        data: { source: "manual", ...manualForm, serverType: manualForm.serverType as any },
      });
      queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
      setManualForm({ serverName: "", serverType: "vm", os: "", environment: "", application: "" });
      toast({ title: "Server added" });
    } catch {
      toast({ title: "Failed to add server", variant: "destructive" });
    }
  };

  if (dealLoading || estLoading) return <DetailSkeleton />;
  if (!deal) return <div className="p-8 text-destructive">Deal not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{deal.name}</h1>
            <DealStatusBadge status={deal.status} />
            <ComplexityBadge complexity={deal.complexity} />
          </div>
          <p className="text-muted-foreground flex items-center text-sm">
            <Briefcase className="w-4 h-4 mr-1.5" />
            {deal.clientName}
            {deal.industryVertical && ` · ${deal.industryVertical}`}
          </p>
        </div>
        <Select value={deal.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Update Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="proposal">AI Proposal</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Primary Goal</div>
                    <div className="font-medium mt-1">{deal.primaryBusinessGoal || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Infrastructure</div>
                    <div className="font-medium mt-1">{deal.currentInfrastructure || "-"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Workload Types</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {deal.workloadTypes?.length
                        ? deal.workloadTypes.map((w: string) => (
                            <Badge key={w} variant="secondary" className="font-normal">
                              {w}
                            </Badge>
                          ))
                        : <span className="text-sm text-muted-foreground">-</span>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-muted-foreground">Custom Scope Notes</div>
                    <div className="text-sm mt-2 whitespace-pre-wrap p-3 bg-muted/30 rounded-md border border-border/50">
                      {deal.customScope || "No custom scope notes provided."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {estimate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detailed Estimation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Total Workloads</div>
                        <div className="text-2xl font-bold font-mono">{estimate.totalWorkloads}</div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Effort Estimate</div>
                        <div className="text-2xl font-bold font-mono">
                          {estimate.estimatedEffortDays ?? 0}{" "}
                          <span className="text-base font-normal text-muted-foreground">days</span>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Timeline</div>
                        <div className="text-2xl font-bold font-mono">
                          {estimate.estimatedMigrationWeeks ?? 0}{" "}
                          <span className="text-base font-normal text-muted-foreground">weeks</span>
                        </div>
                      </div>
                    </div>

                    {estimate.costIndicatorMin != null && estimate.costIndicatorMax != null && (
                      <div className="mt-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                        <div className="text-xs font-medium text-primary mb-1">Estimated Cost Range</div>
                        <div className="text-xl font-bold">
                          ${(estimate.costIndicatorMin / 1000).toFixed(0)}k – $
                          {(estimate.costIndicatorMax / 1000).toFixed(0)}k
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="inventory" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Inventory</CardTitle>
                  <CardDescription>Add servers via CSV, Excel, or manual entry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="csv">
                    <TabsList className="mb-4">
                      <TabsTrigger value="csv">CSV / CMDB</TabsTrigger>
                      <TabsTrigger value="excel">Excel</TabsTrigger>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="csv">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                        <Input type="file" accept=".csv" className="hidden" id="csv-upload"
                          onChange={(e) => handleFileUpload(e, "csv")} />
                        <Label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                          <Upload className="w-7 h-7 text-muted-foreground mb-2" />
                          <span className="font-medium text-primary text-sm">Click to upload CSV</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            Headers: ServerName, Type, OS, Environment
                          </span>
                        </Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="excel">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                        <Input type="file" accept=".xlsx,.xls" className="hidden" id="excel-upload"
                          onChange={(e) => handleFileUpload(e, "excel")} />
                        <Label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                          <Server className="w-7 h-7 text-muted-foreground mb-2" />
                          <span className="font-medium text-primary text-sm">Click to upload Excel</span>
                          <span className="text-xs text-muted-foreground mt-1">.xlsx or .xls supported</span>
                        </Label>
                      </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4 border p-4 rounded-md bg-muted/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Server Name</Label>
                          <Input value={manualForm.serverName}
                            onChange={(e) => setManualForm({ ...manualForm, serverName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={manualForm.serverType}
                            onValueChange={(v) => setManualForm({ ...manualForm, serverType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vm">Virtual Machine</SelectItem>
                              <SelectItem value="physical">Physical Server</SelectItem>
                              <SelectItem value="container">Container</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>OS</Label>
                          <Input value={manualForm.os}
                            onChange={(e) => setManualForm({ ...manualForm, os: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Environment</Label>
                          <Input value={manualForm.environment}
                            onChange={(e) => setManualForm({ ...manualForm, environment: e.target.value })} />
                        </div>
                      </div>
                      <Button onClick={handleManualAdd} className="w-full" disabled={!manualForm.serverName}>
                        Add Server
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Inventory ({invLoading ? "…" : inventory?.length ?? 0} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invLoading ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : inventory && inventory.length > 0 ? (
                    <InventoryTable inventory={inventory} />
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-md bg-muted/5">
                      No inventory items added yet. Import from CSV, Excel, or add manually.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposal" className="mt-4">
              <AIProposalTab deal={deal} estimate={estimate} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <LiveInsightPanel data={estimate || {}} isLoading={estLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
