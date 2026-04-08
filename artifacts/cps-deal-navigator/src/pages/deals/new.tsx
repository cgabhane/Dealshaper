import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateDeal, useGetDealEstimate, getGetDealEstimateQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Save } from "lucide-react";
import { LiveInsightPanel } from "@/components/deals/live-insight-panel";

const WORKLOAD_TYPES = [
  "Web Apps",
  "SAP/ERP",
  "Databases",
  "AI/ML Workloads",
  "Legacy Monoliths",
  "Microservices",
];

const BUSINESS_GOALS = [
  "Cost Reduction",
  "Modernization",
  "Scalability",
  "Security/Compliance",
  "Operational Efficiency",
];

export default function NewDeal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createDeal = useCreateDeal();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    industryVertical: "",
    currentInfrastructure: "",
    numberOfApplications: "",
    workloadTypes: [] as string[],
    primaryBusinessGoal: "",
    customScope: "",
    totalVMs: "",
    totalPhysicalServers: "",
    manualVMCount: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkloadTypeToggle = (type: string) => {
    setFormData(prev => {
      const types = prev.workloadTypes.includes(type)
        ? prev.workloadTypes.filter(t => t !== type)
        : [...prev.workloadTypes, type];
      return { ...prev, workloadTypes: types };
    });
  };

  const handleSave = async () => {
    try {
      const res = await createDeal.mutateAsync({
        data: {
          name: formData.name,
          clientName: formData.clientName,
          industryVertical: formData.industryVertical,
          currentInfrastructure: formData.currentInfrastructure,
          numberOfApplications: formData.numberOfApplications ? parseInt(formData.numberOfApplications) : undefined,
          workloadTypes: formData.workloadTypes,
          primaryBusinessGoal: formData.primaryBusinessGoal,
          customScope: formData.customScope,
          totalVMs: formData.totalVMs ? parseInt(formData.totalVMs) : undefined,
          totalPhysicalServers: formData.totalPhysicalServers ? parseInt(formData.totalPhysicalServers) : undefined,
          manualVMCount: formData.manualVMCount ? parseInt(formData.manualVMCount) : undefined,
        }
      });
      
      toast({
        title: "Deal created",
        description: "Successfully saved the new deal.",
      });
      setLocation(`/deals/${res.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock estimate generation based on current form data
  const generateEstimate = () => {
    const vms = parseInt(formData.totalVMs || "0") || 0;
    const physical = parseInt(formData.totalPhysicalServers || "0") || 0;
    const manual = parseInt(formData.manualVMCount || "0") || 0;
    const totalWorkloads = vms + physical + manual;
    
    let complexity = "low";
    if (totalWorkloads > 500 || formData.workloadTypes.includes("SAP/ERP")) complexity = "high";
    else if (totalWorkloads > 100 || formData.workloadTypes.length > 3) complexity = "medium";

    let weeks = 4;
    if (complexity === "medium") weeks = 12;
    if (complexity === "high") weeks = 24;

    const risks = [];
    if (formData.workloadTypes.includes("Legacy Monoliths")) risks.push("Legacy app modernization required");
    if (formData.workloadTypes.includes("SAP/ERP")) risks.push("Complex SAP migration strategy needed");
    if (!formData.currentInfrastructure) risks.push("Current infrastructure unknown");

    let strategy = "Rehost (Lift and Shift)";
    if (formData.primaryBusinessGoal === "Modernization") strategy = "Refactor / Re-architect";
    else if (formData.workloadTypes.includes("Microservices")) strategy = "Replatform (Containers/PaaS)";

    return {
      complexityScore: complexity,
      estimatedMigrationWeeks: weeks,
      suggestedStrategy: strategy,
      riskFlags: risks,
    };
  };

  const estimate = generateEstimate();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Deal Shape</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step} of 3</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Discovery</CardTitle>
                <CardDescription>Basic client and goal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Deal Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" value={formData.clientName} onChange={(e) => handleInputChange("clientName", e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industryVertical">Industry Vertical</Label>
                    <Input id="industryVertical" value={formData.industryVertical} onChange={(e) => handleInputChange("industryVertical", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentInfrastructure">Current Infrastructure</Label>
                    <Input id="currentInfrastructure" placeholder="e.g. On-prem VMware, AWS" value={formData.currentInfrastructure} onChange={(e) => handleInputChange("currentInfrastructure", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Business Goal</Label>
                  <RadioGroup value={formData.primaryBusinessGoal} onValueChange={(val) => handleInputChange("primaryBusinessGoal", val)} className="flex flex-wrap gap-4 pt-2">
                    {BUSINESS_GOALS.map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <RadioGroupItem value={goal} id={goal} />
                        <Label htmlFor={goal} className="font-normal cursor-pointer">{goal}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Workload Types</Label>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {WORKLOAD_TYPES.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`wt-${type}`} 
                          checked={formData.workloadTypes.includes(type)}
                          onCheckedChange={() => handleWorkloadTypeToggle(type)}
                        />
                        <Label htmlFor={`wt-${type}`} className="font-normal cursor-pointer">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="customScope">Custom Scope Notes</Label>
                  <Textarea id="customScope" className="min-h-[100px]" value={formData.customScope} onChange={(e) => handleInputChange("customScope", e.target.value)} />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Quick Scope</CardTitle>
                <CardDescription>Provide high-level workload counts. (Detailed inventory can be uploaded later).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalVMs">Total Virtual Machines</Label>
                    <Input id="totalVMs" type="number" value={formData.totalVMs} onChange={(e) => handleInputChange("totalVMs", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalPhysicalServers">Total Physical Servers</Label>
                    <Input id="totalPhysicalServers" type="number" value={formData.totalPhysicalServers} onChange={(e) => handleInputChange("totalPhysicalServers", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfApplications">Number of Applications</Label>
                    <Input id="numberOfApplications" type="number" value={formData.numberOfApplications} onChange={(e) => handleInputChange("numberOfApplications", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualVMCount">Unmapped/Manual Workload Count</Label>
                    <Input id="manualVMCount" type="number" value={formData.manualVMCount} onChange={(e) => handleInputChange("manualVMCount", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Save</CardTitle>
                <CardDescription>Review the deal shape before creating the draft.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block">Deal Name</span>
                    <span className="font-medium">{formData.name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Client Name</span>
                    <span className="font-medium">{formData.clientName || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Primary Goal</span>
                    <span className="font-medium">{formData.primaryBusinessGoal || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Workloads</span>
                    <span className="font-medium">{formData.workloadTypes.join(", ") || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Total Scope Count</span>
                    <span className="font-medium font-mono">
                      {(parseInt(formData.totalVMs || "0") || 0) + (parseInt(formData.totalPhysicalServers || "0") || 0) + (parseInt(formData.manualVMCount || "0") || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={() => setStep(s => Math.min(3, s + 1))}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={createDeal.isPending || !formData.name || !formData.clientName}>
                <Save className="w-4 h-4 mr-2" />
                {createDeal.isPending ? "Saving..." : "Create Deal"}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <LiveInsightPanel data={estimate} />
          </div>
        </div>
      </div>
    </div>
  );
}
