"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, CardTitle, Icon, IconButton, Segmented, cx, inputCls } from "@/components/ui";
import { clipUrl, setClipUrl } from "@/lib/clips";
import { GRADEBOOKS } from "@/lib/plans";
import { actions } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { GradeEntry, Rubric, Student, Workspace } from "@/lib/types";

const QUICK = {
  en: ["Great job!", "Needs improvement", "Showing progress", "See rubric", "Excellent effort", "Resubmit"],
  es: ["¡Muy bien!", "Necesita mejorar", "Muestra progreso", "Ver rúbrica", "Excelente esfuerzo", "Vuelve a entregar"],
};

interface Props {
  ws: Workspace;
  rubric: Rubric;
  student: Student | undefined;
  entry: GradeEntry | undefined;
  isPro: boolean;
  gradedIds: string[];
  onUpgrade: (reason: string) => void;
}

export function FeedbackPanel({ ws, rubric, student, entry, isPro, gradedIds, onUpgrade }: Props) {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [newComment, setNewComment] = useState("");
  const [target, setTarget] = useState<string>(GRADEBOOKS[0]);

  const setComment = (text: string) => {
    if (!student) return;
    actions.updateGrade(rubric.id, student.id, (e) => ({ ...e, comment: text }));
  };
  const append = (c: string) => {
    const cur = entry?.comment ?? "";
    setComment(cur ? `${cur} ${c}` : c);
  };

  function sync() {
    if (!isPro) {
      onUpgrade("Gradebook sync is a Pro feature. Free accounts can export a CSV instead.");
      return;
    }
    if (gradedIds.length === 0) {
      toast("Score at least one student first", "warn");
      return;
    }
    const res = actions.syncGrades(rubric.id, gradedIds, target);
    if (res.ok) toast(`Sent ${res.data} grades to ${target}`);
  }

  return (
    <>
      <Card>
        <CardTitle>Comment</CardTitle>
        <textarea
          aria-label="Overall feedback"
          className={`${inputCls} min-h-[84px] resize-y`}
          placeholder={student ? "Overall feedback for this student…" : "Add a student to leave feedback"}
          disabled={!student}
          value={entry?.comment ?? ""}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK[lang].map((c) => (
            <button
              key={c}
              type="button"
              disabled={!student}
              onClick={() => append(c)}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white disabled:opacity-50"
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      <VoiceCard rubric={rubric} student={student} entry={entry} isPro={isPro} onUpgrade={onUpgrade} />

      <Card>
        <CardTitle>Comment bank</CardTitle>
        <Segmented
          size="sm"
          value={lang}
          onChange={setLang}
          className="mb-3 w-full"
          options={[
            { value: "en", label: "English" },
            { value: "es", label: "Español" },
          ]}
        />
        <ul className="max-h-56 space-y-1.5 overflow-y-auto">
          {ws.commentBanks[lang].map((c, i) => (
            <li key={`${c}-${i}`} className="group flex items-start gap-1">
              <button
                type="button"
                disabled={!student}
                onClick={() => {
                  append(c);
                  toast("Comment added");
                }}
                className="flex-1 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-left text-xs leading-snug text-ink-2 transition-colors hover:border-ok hover:bg-ok-bg hover:text-ok disabled:opacity-50"
              >
                {c}
              </button>
              <IconButton icon="x" label="Remove comment" className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-lg:opacity-100" onClick={() => actions.removeComment(lang, i)} />
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            actions.addComment(lang, newComment);
            setNewComment("");
          }}
        >
          <input aria-label="New comment" className={`${inputCls} text-xs`} placeholder="Add comment…" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
          <Button type="submit" variant="primary" icon="plus" aria-label="Add comment" />
        </form>
      </Card>

      <Card>
        <CardTitle action={!isPro && <Badge tone="pro">PRO</Badge>}>Send to gradebook</CardTitle>
        <div className="space-y-1.5" role="radiogroup" aria-label="Gradebook">
          {GRADEBOOKS.map((g) => (
            <label
              key={g}
              className={cx(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                target === g ? "border-brand-600 bg-brand-50" : "border-line hover:border-brand-200",
                !isPro && "opacity-60",
              )}
            >
              <input type="radio" name="gradebook" className="accent-brand-600" checked={target === g} onChange={() => setTarget(g)} />
              {g}
            </label>
          ))}
        </div>
        <Button variant={isPro ? "success" : "pro"} className="mt-3 w-full" icon={isPro ? "send" : "lock"} onClick={sync}>
          {isPro ? `Send ${gradedIds.length} grades` : "Upgrade to sync"}
        </Button>
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs text-ink-3">{isPro ? "Or take a copy with you:" : "Free plan: export grades and enter them yourself."}</p>
          <Link href="/app/gradebook" className="flex h-9 items-center justify-center gap-2 rounded-lg border border-brand-600 text-sm font-semibold text-brand-600 hover:bg-brand-50">
            <Icon name="clipboard" className="size-4" />
            View / export grade list
          </Link>
        </div>
      </Card>
    </>
  );
}

// ───────────────────────── voice ─────────────────────────

function VoiceCard({
  rubric,
  student,
  entry,
  isPro,
  onUpgrade,
}: {
  rubric: Rubric;
  student: Student | undefined;
  entry: GradeEntry | undefined;
  isPro: boolean;
  onUpgrade: (reason: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const secondsRef = useRef(0);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      secondsRef.current += 1;
      setSeconds(secondsRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Stop the microphone if the teacher leaves the page mid-recording.
  useEffect(() => {
    return () => {
      const r = recorder.current;
      if (r && r.state !== "inactive") {
        r.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function start() {
    if (!isPro) {
      onUpgrade("Voice feedback is a Pro feature.");
      return;
    }
    if (!student) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("Microphone is not available in this browser", "warn");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      const rubricId = rubric.id;
      const studentId = student.id;
      rec.ondataavailable = (e) => chunks.current.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const id = `clip_${Math.random().toString(36).slice(2, 9)}`;
        setClipUrl(id, URL.createObjectURL(blob));
        const secs = secondsRef.current;
        actions.updateGrade(rubricId, studentId, (e) => ({ ...e, clips: [...e.clips, { id, seconds: secs }] }));
        toast("Voice note saved");
      };
      rec.start();
      recorder.current = rec;
      secondsRef.current = 0;
      setSeconds(0);
      setRecording(true);
    } catch {
      toast("Microphone access was denied", "warn");
    }
  }

  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }

  const clips = entry?.clips ?? [];
  return (
    <Card>
      <CardTitle action={!isPro && <Badge tone="pro">PRO</Badge>}>Voice feedback</CardTitle>
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={!student}
        className={cx(
          "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
          recording ? "border-bad bg-bad-bg text-bad" : "border-line bg-surface-2 text-ink-2 hover:border-bad hover:bg-bad-bg hover:text-bad",
        )}
      >
        <span className={cx("size-2.5 rounded-full bg-bad", recording && "animate-rec")} />
        {recording ? `Recording… ${seconds}s (tap to stop)` : "Record voice feedback"}
        {!isPro && <Icon name="lock" className="ml-auto size-4 text-ink-3" />}
      </button>
      {clips.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {clips.map((c) => {
            const url = clipUrl(c.id);
            return (
              <li key={c.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-ink-2">
                <Icon name="mic" className="size-3.5" />
                <span className="whitespace-nowrap">{c.seconds}s</span>
                {url ? <audio src={url} controls className="h-7 min-w-0 flex-1" /> : <span className="text-ink-3">Recording not kept after reload in this prototype</span>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
