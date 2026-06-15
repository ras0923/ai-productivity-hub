import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { OutputEditor } from "@/components/output-editor";
import { ToolPage } from "@/components/tool-page";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bumpCounter } from "@/hooks/use-local-counter";
import { summarizeNotes, transcribeAudio } from "@/lib/ai.functions";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — AI Workplace" },
      { name: "description", content: "Summarize meeting notes into decisions and action items." },
      { property: "og:title", content: "Meeting Notes Summarizer" },
      { property: "og:description", content: "Summarize meeting notes into decisions and action items." },
    ],
  }),
  component: NotesPage,
});

function pickMimeType(): { mimeType: string; format: "webm" | "mp4" } | null {
  const candidates: Array<{ mimeType: string; format: "webm" | "mp4" }> = [
    { mimeType: "audio/webm;codecs=opus", format: "webm" },
    { mimeType: "audio/webm", format: "webm" },
    { mimeType: "audio/mp4", format: "mp4" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function NotesPage() {
  const fn = useServerFn(summarizeNotes);
  const transcribeFn = useServerFn(transcribeAudio);
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const formatRef = useRef<"webm" | "mp4">("webm");
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    const picked = pickMimeType();
    if (!picked) return toast.error("Recording isn't supported in this browser.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: picked.mimeType });
      chunksRef.current = [];
      formatRef.current = picked.format;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        setElapsed(0);
        const blob = new Blob(chunksRef.current, { type: picked.mimeType });
        if (blob.size === 0) return;
        setTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const { text } = await transcribeFn({
            data: { audioBase64, format: formatRef.current },
          });
          if (!text) {
            toast.error("Couldn't transcribe audio. Try again.");
            return;
          }
          setNotes((prev) => (prev.trim() ? `${prev}\n\n${text}` : text));
          toast.success("Transcription added to notes.");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 250);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Microphone access denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const generate = async () => {
    if (!notes.trim()) return toast.error("Paste or record your meeting notes first.");
    setLoading(true);
    try {
      const { text } = await fn({ data: { notes } });
      setOutput(text);
      bumpCounter("notes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <ToolPage
      title="Meeting Notes Summarizer"
      description="Record live, or paste raw notes — get a summary, decisions, action items, and deadlines."
      input={
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Meeting notes</Label>
              <div className="flex items-center gap-2">
                {recording && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                    {mm}:{ss}
                  </span>
                )}
                {transcribing && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Transcribing…
                  </span>
                )}
                {recording ? (
                  <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                    <Square className="mr-1.5 h-3.5 w-3.5" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={startRecording}
                    disabled={transcribing}
                  >
                    <Mic className="mr-1.5 h-3.5 w-3.5" />
                    Record
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste the full meeting transcript, or click Record to capture audio…"
              className="min-h-64"
            />
          </div>
          <Button onClick={generate} disabled={loading || recording || transcribing} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Summarize Notes
          </Button>
        </div>
      }
      output={
        <OutputEditor value={output} onChange={setOutput} loading={loading} mode="markdown" />
      }
    />
  );
}
