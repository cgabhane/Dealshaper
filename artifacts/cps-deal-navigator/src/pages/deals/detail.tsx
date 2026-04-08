import { useParams } from "wouter";
import { useState } from "react";
import { 
  useGetDeal, 
  getGetDealQueryKey, 
  useGetDealInventory, 
  getGetDealInventoryQueryKey,
  useGetDealEstimate,
  getGetDealEstimateQueryKey,
  useAddInventoryItem,
  useUpdateDeal,
  useDeleteDeal
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
import { FileSpreadsheet, Server, Activity, ArrowRight, Save, Trash, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function DealDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deal, isLoading: dealLoading } = useGetDeal(id, { 
    query: { enabled: !!id, queryKey: getGetDealQueryKey(id) } 
  });
  
  const { data: inventory, isLoading: invLoading } = useGetDealInventory(id, { 
    query: { enabled: !!id, queryKey: getGetDealInventoryQueryKey(id) } 
  });
  
  const { data: estimate, isLoading: estLoading } = useGetDealEstimate(id, { 
    query: { enabled: !!id, queryKey: getGetDealEstimateQueryKey(id) } 
  });

  const updateDeal = useUpdateDeal();
  const addInventoryItem = useAddInventoryItem();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDeal.mutateAsync({
        id,
        data: { status: newStatus as any }
      });
      queryClient.invalidateQueries({ queryKey: getGetDealQueryKey(id) });
      toast({ title: "Status updated" });
    } catch (e) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'excel') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'csv') {
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
                  serverType: row.Type?.toLowerCase() === 'physical' ? 'physical' : 'vm',
                  os: row.OS || row.OperatingSystem,
                  environment: row.Environment || row.Env,
                  application: row.Application || row.App
                }
              });
              successCount++;
            } catch (err) {
              console.error("Failed to add row", row, err);
            }
          }
          queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
          toast({ title: "Import Complete", description: `Added ${successCount} items from CSV.` });
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
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
                serverType: row.Type?.toLowerCase() === 'physical' ? 'physical' : 'vm',
                os: row.OS || row.OperatingSystem,
                environment: row.Environment || row.Env,
                application: row.Application || row.App
              }
            });
            successCount++;
          } catch (err) {
             console.error("Failed to add row", row, err);
          }
        }
        queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
        toast({ title: "Import Complete", description: `Added ${successCount} items from Excel.` });
      };
      reader.readAsBinaryString(file);
    }
  };

  const [manualForm, setManualForm] = useState({
    serverName: "",
    serverType: "vm",
    os: "",
    environment: "",
    application: ""
  });

  const handleManualAdd = async () => {
    if (!manualForm.serverName) return;
    try {
      await addInventoryItem.mutateAsync({
        id,
        data: {
          source: "manual",
          ...manualForm,
          serverType: manualForm.serverType as any
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetDealInventoryQueryKey(id) });
      setManualForm({ serverName: "", serverType: "vm", os: "", environment: "", application: "" });
      toast({ title: "Item added" });
    } catch (e) {
      toast({ title: "Failed to add item", variant: "destructive" });
    }
  };

  if (dealLoading || estLoading) {
    return <div className="p-8 flex justify-center text-muted-foreground">Loading deal details...</div>;
  }

  if (!deal) {
    return <div className="p-8 text-destructive">Deal not found.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{deal.name}</h1>
            <DealStatusBadge status={deal.status} />
            <ComplexityBadge complexity={deal.complexity} />
          </div>
          <p className="text-muted-foreground flex items-center">
            <Briefcase className="w-4 h-4 mr-1.5" />
            {deal.clientName} {deal.industryVertical && `• ${deal.industryVertical}`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory & Scope</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deal Information</CardTitle>
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
                      {deal.workloadTypes?.map(w => (
                        <Badge key={w} variant="secondary" className="font-normal">{w}</Badge>
                      )) || "-"}
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
                    <CardTitle className="text-lg">Detailed Estimation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Total Workloads</div>
                        <div className="text-2xl font-bold font-mono">{estimate.totalWorkloads}</div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Effort Estimate</div>
                        <div className="text-2xl font-bold font-mono">{estimate.estimatedEffortDays || 0} <span className="text-base font-normal text-muted-foreground">days</span></div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="text-sm text-muted-foreground mb-1">Timeline</div>
                        <div className="text-2xl font-bold font-mono">{estimate.estimatedMigrationWeeks || 0} <span className="text-base font-normal text-muted-foreground">weeks</span></div>
                      </div>
                    </div>

                    {estimate.costIndicatorMin && estimate.costIndicatorMax && (
                      <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                        <div className="text-sm font-medium text-primary mb-1">Estimated Cost Range</div>
                        <div className="text-xl font-bold">
                          ${(estimate.costIndicatorMin / 1000).toFixed(0)}k - ${(estimate.costIndicatorMax / 1000).toFixed(0)}k
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
                  <CardTitle className="text-lg">Import Inventory</CardTitle>
                  <CardDescription>Add servers via CSV, Excel, or manual entry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="csv">
                    <TabsList className="mb-4">
                      <TabsTrigger value="csv">CSV/CMDB</TabsTrigger>
                      <TabsTrigger value="excel">Excel</TabsTrigger>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="csv" className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                        <Input 
                          type="file" 
                          accept=".csv" 
                          className="hidden" 
                          id="csv-upload" 
                          onChange={(e) => handleFileUpload(e, 'csv')}
                        />
                        <Label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center justify-center">
                          <FileSpreadsheet className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="font-medium text-primary">Click to upload CSV</span>
                          <span className="text-xs text-muted-foreground mt-1">Headers: ServerName, Type, OS, Environment</span>
                        </Label>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="excel" className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                        <Input 
                          type="file" 
                          accept=".xlsx, .xls" 
                          className="hidden" 
                          id="excel-upload" 
                          onChange={(e) => handleFileUpload(e, 'excel')}
                        />
                        <Label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center justify-center">
                          <FileSpreadsheet className="w-8 h-8 text-green-600/60 mb-2" />
                          <span className="font-medium text-primary">Click to upload Excel</span>
                          <span className="text-xs text-muted-foreground mt-1">.xlsx or .xls files supported</span>
                        </Label>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="manual" className="space-y-4 border p-4 rounded-md bg-muted/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Server Name</Label>
                          <Input value={manualForm.serverName} onChange={e => setManualForm({...manualForm, serverName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={manualForm.serverType} onValueChange={v => setManualForm({...manualForm, serverType: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vm">Virtual Machine</SelectItem>
                              <SelectItem value="physical">Physical</SelectItem>
                              <SelectItem value="container">Container</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>OS</Label>
                          <Input value={manualForm.os} onChange={e => setManualForm({...manualForm, os: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Environment</Label>
                          <Input value={manualForm.environment} onChange={e => setManualForm({...manualForm, environment: e.target.value})} />
                        </div>
                      </div>
                      <Button onClick={handleManualAdd} className="w-full">Add Server</Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inventory List ({inventory?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  {invLoading ? (
                    <div className="text-center text-sm text-muted-foreground py-4">Loading inventory...</div>
                  ) : inventory && inventory.length > 0 ? (
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
                          {inventory.map(item => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium font-mono text-xs">{item.serverName || `srv-${item.id}`}</TableCell>
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
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-md bg-muted/5">
                      No inventory items added yet.
                    </div>
                  )}
                </CardContent>
              </Card>
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

// Ensure Briefcase is imported above if not already
