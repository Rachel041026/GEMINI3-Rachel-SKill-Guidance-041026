/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  FileText, 
  Settings as SettingsIcon, 
  Play, 
  Square,
  RotateCcw,
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Database, 
  Languages, 
  Palette,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  FileJson,
  HelpCircle
} from "lucide-react";
import Markdown from "react-markdown";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend 
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { AppSettings, WorkflowResults, AgentStep, Entity, ChecklistItem } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_TEMPLATE, PAINTER_STYLES } from "./constants";
import { runWorkflow } from "./services/geminiService";

// --- Mock Data for Dashboard ---
const CHART_DATA = [
  { name: "Admin", risk: 80, completeness: 20 },
  { name: "Description", risk: 60, completeness: 40 },
  { name: "Indications", risk: 40, completeness: 70 },
  { name: "Equivalence", risk: 30, completeness: 85 },
  { name: "Standards", risk: 20, completeness: 95 },
  { name: "V&V", risk: 50, completeness: 60 },
];

const RADAR_DATA = [
  { subject: 'Biocompatibility', A: 120, B: 110, fullMark: 150 },
  { subject: 'Software', A: 98, B: 130, fullMark: 150 },
  { subject: 'Clinical', A: 86, B: 130, fullMark: 150 },
  { subject: 'Electrical', A: 99, B: 100, fullMark: 150 },
  { subject: 'Mechanical', A: 85, B: 90, fullMark: 150 },
  { subject: 'Sterilization', A: 65, B: 85, fullMark: 150 },
];

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [inputs, setInputs] = useState({
    guidance: "",
    notes: "",
    deviceInfo: "",
    template: DEFAULT_TEMPLATE
  });
  const [results, setResults] = useState<WorkflowResults | null>(null);
  const [agentStep, setAgentStep] = useState<AgentStep>(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<string>("fullReport");

  const isRunning = agentStep > 0 && agentStep < 7;

  const handleStartWorkflow = async () => {
    const controller = new AbortController();
    setAbortController(controller);
    setAgentStep(1);
    setLoadingMessage("Initializing workflow...");
    
    try {
      const res = await runWorkflow(settings, inputs, (step, msg) => {
        setAgentStep(step as AgentStep);
        setLoadingMessage(msg);
      }, controller.signal);
      
      setResults(res);
      setAgentStep(7);
      setActiveTab("results");
    } catch (error: any) {
      if (error.message === "Workflow stopped by user") {
        setLoadingMessage("Workflow stopped.");
      } else {
        console.error(error);
        alert("Workflow failed: " + error.message);
      }
      setAgentStep(0);
    } finally {
      setAbortController(null);
    }
  };

  const handleStopWorkflow = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setAgentStep(0);
      setLoadingMessage("Stopping...");
    }
  };

  const handleClearInputs = () => {
    setInputs({
      guidance: "",
      notes: "",
      deviceInfo: "",
      template: DEFAULT_TEMPLATE
    });
    setResults(null);
    setAgentStep(0);
  };

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className={cn(
      "min-h-screen font-sans transition-all duration-500",
      `style-${settings.painterStyle}`
    )}>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <Database className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ORICKS v4.0</h1>
              <p className="text-xs text-muted-foreground font-medium">FDA 510(k) AI Review System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <Badge variant="outline" className="bg-background">v4.0.0</Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-xs font-medium">
                <Languages className="w-3 h-3" />
                {settings.language === 'zh' ? '繁體中文' : 'English'}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isRunning ? (
                <Button 
                  onClick={handleStopWorkflow} 
                  variant="destructive"
                  className="rounded-full px-6 shadow-lg shadow-destructive/20"
                >
                  <Square className="w-4 h-4 mr-2 fill-current" />
                  Stop Review
                </Button>
              ) : (
                <Button 
                  onClick={handleStartWorkflow} 
                  className="rounded-full px-6 shadow-lg shadow-primary/20"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Start Review
                </Button>
              )}
              
              {!isRunning && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClearInputs}
                  className="rounded-full hover:bg-muted"
                  title="Clear all inputs"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Progress Overlay */}
        <AnimatePresence>
          {isRunning && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            >
              <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Agent Pipeline Active</p>
                        <p className="text-xs text-muted-foreground">{loadingMessage}</p>
                      </div>
                    </div>
                    <p className="text-xs font-mono font-bold">{Math.round((agentStep / 7) * 100)}%</p>
                  </div>
                  <Progress value={(agentStep / 7) * 100} className="h-2" />
                  <div className="mt-4 grid grid-cols-7 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                      <div 
                        key={s} 
                        className={cn(
                          "h-1 rounded-full transition-colors",
                          agentStep >= s ? "bg-primary" : "bg-muted"
                        )} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-muted/50 p-1 rounded-full">
              <TabsTrigger value="dashboard" className="rounded-full px-6 gap-2">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="submission" className="rounded-full px-6 gap-2">
                <FileText className="w-4 h-4" /> Submission
              </TabsTrigger>
              <TabsTrigger value="dataset" className="rounded-full px-6 gap-2" disabled={!results}>
                <Database className="w-4 h-4" /> Dataset
              </TabsTrigger>
              <TabsTrigger value="results" className="rounded-full px-6 gap-2" disabled={!results}>
                <CheckCircle2 className="w-4 h-4" /> Results
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-full px-6 gap-2">
                <SettingsIcon className="w-4 h-4" /> Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">35</div>
                  <p className="text-xs text-green-500 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> All systems operational
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Review Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results ? "Completed" : "Idle"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Waiting for submission</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Risk Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">Medium</div>
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">RTA Risk</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Based on initial scan</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <Progress value={78} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Completeness vs. Risk Analysis</CardTitle>
                  <CardDescription>Correlation between documentation depth and regulatory risk</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444" }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="completeness" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Predicate Benchmark</CardTitle>
                  <CardDescription>Subject vs. Predicate Device metrics</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                      <PolarGrid stroke="hsl(var(--muted))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Subject" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name="Predicate" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Live Agent Stream
                </CardTitle>
                <CardDescription>Real-time activity from simulated regulatory agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] rounded-md border bg-muted/30 p-4 font-mono text-xs">
                  <div className="space-y-2">
                    <p className="text-blue-500">[09:12:01] Agent #04: Initializing 21 CFR 807 compliance check...</p>
                    <p className="text-green-500">[09:12:05] Agent #12: Predicate device K-number identified: K210456</p>
                    <p className="text-yellow-500">[09:12:10] Agent #24: Verifying ISO 14971 risk file consistency...</p>
                    <p className="text-muted-foreground">[09:12:15] Agent #07: Scanning consensus standards for IEC 60601-1-2...</p>
                    <p className="text-blue-500">[09:12:20] Agent #31: Analyzing substantial equivalence claims...</p>
                    <p className="text-green-500">[09:12:25] Agent #15: Biocompatibility data extraction complete.</p>
                    <p className="text-muted-foreground">[09:12:30] Agent #02: Monitoring FDA guidance updates for AI/ML devices...</p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submission Tab */}
          <TabsContent value="submission" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Guidance</CardTitle>
                    <CardDescription>Paste FDA guidance documents or internal SOPs (txt, markdown)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Paste guidance here..." 
                      className="min-h-[200px] font-mono text-sm"
                      value={inputs.guidance}
                      onChange={(e) => setInputs({ ...inputs, guidance: e.target.value })}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Review Notes</CardTitle>
                    <CardDescription>Internal observations, engineer comments, or specific concerns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Paste notes here..." 
                      className="min-h-[200px] font-mono text-sm"
                      value={inputs.notes}
                      onChange={(e) => setInputs({ ...inputs, notes: e.target.value })}
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Device Information (Optional)</CardTitle>
                    <CardDescription>Information for creating a mock 510(k) summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Provide device details (e.g., intended use, technology, components)..." 
                      className="min-h-[200px] font-mono text-sm"
                      value={inputs.deviceInfo}
                      onChange={(e) => setInputs({ ...inputs, deviceInfo: e.target.value })}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Report Template</CardTitle>
                    <CardDescription>Markdown structure for the final 510(k) report</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Markdown template..." 
                      className="min-h-[200px] font-mono text-sm"
                      value={inputs.template}
                      onChange={(e) => setInputs({ ...inputs, template: e.target.value })}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Dataset Tab */}
          <TabsContent value="dataset" className="space-y-6">
            {results && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">50 Regulatory Entities</h2>
                    <p className="text-muted-foreground">Extracted from the comprehensive summary</p>
                  </div>
                  <Button variant="outline" onClick={() => downloadJson(results.entities, "510k_dataset.json")}>
                    <Download className="w-4 h-4 mr-2" /> Export JSON
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.entities.map((entity, idx) => (
                    <Card key={entity.id || idx} className="group hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-mono">{idx + 1}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6"><SettingsIcon className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        <CardTitle className="text-sm font-bold mt-2">{entity.key}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2">{entity.value}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-2 italic">{entity.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="border-dashed flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="bg-muted p-2 rounded-full mb-2">
                      <Plus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Add New Entity</p>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h2 className="text-2xl font-bold mb-4">20 Follow-up Questions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.followUpQuestions.length > 0 ? results.followUpQuestions.map((q, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-6 flex gap-4">
                          <div className="text-primary font-bold">{idx + 1}.</div>
                          <p className="text-sm">{q}</p>
                        </CardContent>
                      </Card>
                    )) : (
                      <p className="text-muted-foreground italic col-span-2">Questions will be generated in the final report.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {results && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Artifacts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => setSelectedArtifact("all")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "all" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <LayoutDashboard className="w-4 h-4" /> View All Results
                        </button>
                        <button 
                          onClick={() => setSelectedArtifact("webSearch")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "webSearch" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <Search className="w-4 h-4" /> Web Search Summary
                        </button>
                        <button 
                          onClick={() => setSelectedArtifact("comprehensive")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "comprehensive" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <FileText className="w-4 h-4" /> Comprehensive Summary
                        </button>
                        <button 
                          onClick={() => setSelectedArtifact("mock")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "mock" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <Database className="w-4 h-4" /> Mock 510(k) Summary
                        </button>
                        <button 
                          onClick={() => setSelectedArtifact("checklist")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "checklist" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Review Checklist
                        </button>
                        <button 
                          onClick={() => setSelectedArtifact("fullReport")}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left border-l-2",
                            selectedArtifact === "fullReport" ? "border-primary bg-primary/5" : "border-transparent"
                          )}
                        >
                          <FileJson className="w-4 h-4" /> Full Review Report
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Download Center</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" onClick={() => {
                        const content = selectedArtifact === "all" ? 
                          `# Web Search Summary\n\n${results.webSearchSummary}\n\n---\n\n# Comprehensive Summary\n\n${results.comprehensiveSummary}\n\n---\n\n# Mock Summary\n\n${results.mockSummary}\n\n---\n\n# Full Report\n\n${results.fullReport}` :
                          selectedArtifact === "webSearch" ? results.webSearchSummary :
                          selectedArtifact === "comprehensive" ? results.comprehensiveSummary :
                          selectedArtifact === "mock" ? results.mockSummary :
                          results.fullReport;
                        downloadMarkdown(content, `${selectedArtifact}.md`);
                      }}>
                        <Download className="w-4 h-4 mr-2" /> Download Current (MD)
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => downloadMarkdown(results.fullReport, "full_report.md")}>
                        <Download className="w-4 h-4 mr-2" /> Full Report (MD)
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => downloadJson(results.entities, "dataset.json")}>
                        <FileJson className="w-4 h-4 mr-2" /> Dataset (JSON)
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-3">
                  <Card className="min-h-[600px]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>
                          {selectedArtifact === "all" ? "All Results" : 
                           selectedArtifact === "webSearch" ? "Web Search Summary" :
                           selectedArtifact === "comprehensive" ? "Comprehensive Summary" :
                           selectedArtifact === "mock" ? "Mock 510(k) Summary" :
                           selectedArtifact === "checklist" ? "Review Checklist" :
                           "Full Review Report"}
                        </CardTitle>
                        <CardDescription>Review and modify generated artifacts</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon"><Save className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const content = selectedArtifact === "all" ? 
                            `# Web Search Summary\n\n${results.webSearchSummary}\n\n---\n\n# Comprehensive Summary\n\n${results.comprehensiveSummary}\n\n---\n\n# Mock Summary\n\n${results.mockSummary}\n\n---\n\n# Full Report\n\n${results.fullReport}` :
                            selectedArtifact === "webSearch" ? results.webSearchSummary :
                            selectedArtifact === "comprehensive" ? results.comprehensiveSummary :
                            selectedArtifact === "mock" ? results.mockSummary :
                            results.fullReport;
                          downloadMarkdown(content, `${selectedArtifact}.md`);
                        }}><Download className="w-4 h-4" /></Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px] pr-4">
                        <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                          {selectedArtifact === "all" ? (
                            <div className="space-y-12">
                              <section>
                                <h1 className="text-3xl font-bold mb-6">1. Web Search Summary</h1>
                                <Markdown>{results.webSearchSummary}</Markdown>
                              </section>
                              <Separator className="my-12" />
                              <section>
                                <h1 className="text-3xl font-bold mb-6">2. Comprehensive Summary</h1>
                                <Markdown>{results.comprehensiveSummary}</Markdown>
                              </section>
                              <Separator className="my-12" />
                              <section>
                                <h1 className="text-3xl font-bold mb-6">3. Mock 510(k) Summary</h1>
                                <Markdown>{results.mockSummary}</Markdown>
                              </section>
                              <Separator className="my-12" />
                              <section>
                                <h1 className="text-3xl font-bold mb-6">4. Full Review Report</h1>
                                <Markdown>{results.fullReport}</Markdown>
                              </section>
                            </div>
                          ) : selectedArtifact === "checklist" ? (
                            <div className="space-y-6">
                              <table className="w-full border-collapse border">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border p-2">Category</th>
                                    <th className="border p-2">Item</th>
                                    <th className="border p-2">Status</th>
                                    <th className="border p-2">Comment</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results.checklist.map((item) => (
                                    <tr key={item.id}>
                                      <td className="border p-2 font-medium">{item.category}</td>
                                      <td className="border p-2">{item.item}</td>
                                      <td className="border p-2">
                                        <Badge variant={
                                          item.status === 'compliant' ? 'default' :
                                          item.status === 'non-compliant' ? 'destructive' : 'secondary'
                                        }>
                                          {item.status}
                                        </Badge>
                                      </td>
                                      <td className="border p-2 text-xs">{item.comment}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <Markdown>
                              {selectedArtifact === "webSearch" ? results.webSearchSummary :
                               selectedArtifact === "comprehensive" ? results.comprehensiveSummary :
                               selectedArtifact === "mock" ? results.mockSummary :
                               results.fullReport}
                            </Markdown>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" /> Painter Styles
                    </CardTitle>
                    <CardDescription>Choose the visual aesthetic of the application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {PAINTER_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSettings({ ...settings, painterStyle: style.id })}
                          className={cn(
                            "flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all",
                            settings.painterStyle === style.id 
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                              : "border-transparent bg-muted/50 hover:bg-muted"
                          )}
                        >
                          <span className="font-bold text-sm">{style.name}</span>
                          <span className="text-[10px] text-muted-foreground mt-1">{style.description}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5" /> Model Configuration
                    </CardTitle>
                    <CardDescription>Select model and language for AI features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary Model</Label>
                      <Select 
                        value={settings.model} 
                        onValueChange={(v) => setSettings({ ...settings, model: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</SelectItem>
                          <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Reasoning)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Output Language</Label>
                      <Select 
                        value={settings.language} 
                        onValueChange={(v: 'zh' | 'en') => setSettings({ ...settings, language: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh">Traditional Chinese (繁體中文)</SelectItem>
                          <SelectItem value="en">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" /> Prompt Customization
                  </CardTitle>
                  <CardDescription>Modify the underlying prompts for each workflow step</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {Object.entries(settings.prompts).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                          <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                          <Textarea 
                            value={value} 
                            onChange={(e) => setSettings({
                              ...settings,
                              prompts: { ...settings.prompts, [key]: e.target.value }
                            })}
                            className="min-h-[120px] font-mono text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-6 bg-background/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© 2026 ORICKS v4.0 — Optimal Regulatory Intelligent Compliance Knowledge System</p>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">FDA Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
