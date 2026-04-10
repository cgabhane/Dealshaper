import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BrainCircuit,
  Upload,
  Send,
  Trash2,
  FileText,
  Loader2,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextUsed?: boolean;
}

interface KnowledgeDoc {
  name: string;
  chunks: number;
}

export default function AIBrain() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/ai/status`)
      .then((r) => r.json())
      .then((d) => {
        setOllamaOnline(d.online);
        setTotalChunks(d.knowledgeChunks ?? 0);
      })
      .catch(() => setOllamaOnline(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast({ title: "Only PDF files are supported", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/ai/upload-knowledge`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setDocs((prev) => [...prev, { name: file.name, chunks: data.chunksAdded }]);
      setTotalChunks(data.totalChunks);
      toast({ title: "Document indexed", description: `${data.chunksAdded} sections added to knowledge base.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearKnowledge = async () => {
    try {
      await fetch(`${API_BASE}/api/ai/knowledge`, { method: "DELETE" });
      setDocs([]);
      setTotalChunks(0);
      toast({ title: "Knowledge base cleared" });
    } catch {
      toast({ title: "Failed to clear knowledge base", variant: "destructive" });
    }
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || isQuerying) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsQuerying(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/ask-brain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        contextUsed: data.contextUsed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${err.message || "Failed to get a response. Is Ollama running?"}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary" />
            Presales Brain
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Private local AI powered by Ollama — query your uploaded presales documents.
          </p>
        </div>
        {ollamaOnline !== null && (
          <Badge
            variant={ollamaOnline ? "default" : "secondary"}
            className={cn(
              "text-xs",
              ollamaOnline
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-muted text-muted-foreground"
            )}
          >
            {ollamaOnline ? "Ollama Online" : "Ollama Offline"}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge Base
              </CardTitle>
              <CardDescription className="text-xs">
                Upload PDF documents (playbooks, proposals, pricing guides) to ground the AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-primary mx-auto mb-1 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                )}
                <div className="text-xs font-medium text-primary">
                  {isUploading ? "Indexing…" : "Upload PDF"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Click to select file</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleUpload}
              />

              {totalChunks > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  {totalChunks} sections indexed
                </div>
              )}

              {docs.length > 0 && (
                <div className="space-y-1.5">
                  {docs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 bg-muted/40 rounded-md">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">{doc.name}</span>
                      <span className="text-muted-foreground flex-shrink-0">{doc.chunks} sec.</span>
                    </div>
                  ))}
                </div>
              )}

              {docs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-destructive hover:text-destructive"
                  onClick={handleClearKnowledge}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Clear Knowledge Base
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground space-y-1.5">
                <div className="font-medium text-foreground mb-2">Suggested uploads</div>
                <div>• Cloud migration playbooks</div>
                <div>• Previous proposal documents</div>
                <div>• Pricing & rate cards</div>
                <div>• Technical architecture guides</div>
                <div>• Partner enablement materials</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b flex-shrink-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Ask the Presales Brain
              </CardTitle>
              {!ollamaOnline && ollamaOnline !== null && (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md p-2 mt-1">
                  Ollama is not detected on localhost:11434. Start Ollama and ensure gemma4:e4b is pulled.
                </div>
              )}
            </CardHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  <div className="text-center space-y-2">
                    <BrainCircuit className="w-10 h-10 mx-auto opacity-20" />
                    <div>Ask anything about presales, cloud migration strategy, or your uploaded documents.</div>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/60 text-foreground border"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === "assistant" && msg.contextUsed && (
                        <div className="mt-1.5 text-[10px] opacity-60 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          Referenced uploaded documents
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isQuerying && (
                <div className="flex justify-start">
                  <div className="bg-muted/60 border rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <Separator />
            <div className="p-4 flex gap-2 flex-shrink-0">
              <Input
                placeholder="Ask about migration strategy, pricing, risk assessment…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                disabled={isQuerying}
                className="flex-1"
              />
              <Button
                onClick={handleAsk}
                disabled={!question.trim() || isQuerying}
                size="icon"
                className="flex-shrink-0"
              >
                {isQuerying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
