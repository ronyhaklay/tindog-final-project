"use client";

import { useRef, useState } from "react";
import { MicIcon, SquareIcon, Trash2Icon, UploadIcon, VideoIcon, Volume2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";
import { DOG_MEDIA_BUCKET, MAX_AUDIO_SIZE_BYTES, MAX_BARK_SECONDS, MAX_VIDEO_SIZE_BYTES } from "@/lib/constants";
import { publicDogMediaUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";

export function MediaUploader({ initialVideoPath, initialBarkAudioPath }: { initialVideoPath?: string | null; initialBarkAudioPath?: string | null }) {
  const [videoPath, setVideoPath] = useState(initialVideoPath ?? "");
  const [audioPath, setAudioPath] = useState(initialBarkAudioPath ?? "");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isHebrew } = useLanguage();

  async function uploadFile(file: File, kind: "video" | "audio") {
    const max = kind === "video" ? MAX_VIDEO_SIZE_BYTES : MAX_AUDIO_SIZE_BYTES;
    if (file.size > max) {
      setError(kind === "video" ? (isHebrew ? "הווידאו צריך להיות עד 35MB." : "Video must be 35MB or less.") : (isHebrew ? "האודיו צריך להיות עד 8MB." : "Audio must be 8MB or less."));
      return;
    }
    if (kind === "video" && !file.type.startsWith("video/")) { setError(isHebrew ? "בחרו קובץ וידאו." : "Please choose a video file."); return; }
    if (kind === "audio" && !file.type.startsWith("audio/")) { setError(isHebrew ? "בחרו קובץ אודיו." : "Please choose an audio file."); return; }

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError(isHebrew ? "צריך להתחבר כדי להעלות מדיה." : "You must be logged in to upload media."); return; }
      const ext = file.name.split(".").pop() || (kind === "video" ? "mp4" : "webm");
      const path = `${user.id}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(DOG_MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setError(isHebrew ? "ההעלאה נכשלה. נסו שוב." : "Upload failed. Please try again."); return; }
      if (kind === "video") setVideoPath(path); else setAudioPath(path);
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(isHebrew ? "הדפדפן לא תומך בהקלטה מהמיקרופון. אפשר להעלות קובץ אודיו במקום." : "Your browser does not support microphone recording. You can upload an audio file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);
        const file = new File([blob], `bark-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        await uploadFile(file, "audio");
      };
      recorder.start();
      setRecording(true);
      timerRef.current = setTimeout(() => stopRecording(), MAX_BARK_SECONDS * 1000);
    } catch {
      setError(isHebrew ? "הגישה למיקרופון נדחתה. אפשר לאשר גישה למיקרופון או להעלות הקלטה קיימת." : "Microphone permission was denied. Allow microphone access or upload a recording instead.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <input type="hidden" name="videoPath" value={videoPath} />
      <input type="hidden" name="barkAudioPath" value={audioPath} />

      <div className="rounded-2xl border bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 font-semibold"><VideoIcon className="size-4 text-primary" />{isHebrew ? "וידאו לפרופיל" : "Profile video"}</div>
        {videoPath ? (
          <div className="space-y-3">
            <video src={publicDogMediaUrl(videoPath)} controls playsInline className="aspect-video w-full rounded-xl bg-black object-cover" />
            <Button type="button" variant="outline" size="sm" onClick={() => setVideoPath("")}><Trash2Icon data-icon="inline-start" />{isHebrew ? "הסרת וידאו" : "Remove video"}</Button>
          </div>
        ) : (
          <button type="button" disabled={uploading} onClick={() => videoInputRef.current?.click()} className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-rose-50/40 text-sm text-muted-foreground hover:bg-rose-50">
            <UploadIcon className="size-6 text-primary" /><span>{uploading ? (isHebrew ? "מעלה..." : "Uploading...") : (isHebrew ? "העלאת סרטון קצר" : "Upload a short video")}</span><span className="text-xs">{isHebrew ? "MP4 / MOV / WebM · עד 35MB" : "MP4 / MOV / WebM · up to 35MB"}</span>
          </button>
        )}
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file, "video"); e.currentTarget.value = ""; }} />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center gap-2 font-semibold"><Volume2Icon className="size-4 text-primary" />{isHebrew ? "הנביחה שלי" : "Hear my bark"}</div>
        {audioPath ? (
          <div className="space-y-3">
            <audio src={publicDogMediaUrl(audioPath)} controls className="w-full" />
            <Button type="button" variant="outline" size="sm" onClick={() => setAudioPath("")}><Trash2Icon data-icon="inline-start" />{isHebrew ? "הסרת הקלטה" : "Remove bark"}</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button type="button" variant={recording ? "destructive" : "outline"} className="w-full" disabled={uploading} onClick={recording ? stopRecording : startRecording}>
              {recording ? <SquareIcon data-icon="inline-start" /> : <MicIcon data-icon="inline-start" />}
              {recording ? (isHebrew ? "עצירת הקלטה" : "Stop recording") : (isHebrew ? `הקלטת נביחה (עד ${MAX_BARK_SECONDS} שניות)` : `Record a bark (max ${MAX_BARK_SECONDS}s)`)}
            </Button>
            <Button type="button" variant="ghost" className="w-full" disabled={uploading || recording} onClick={() => audioInputRef.current?.click()}><UploadIcon data-icon="inline-start" />{isHebrew ? "העלאת קובץ אודיו במקום" : "Upload audio instead"}</Button>
          </div>
        )}
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file, "audio"); e.currentTarget.value = ""; }} />
      </div>

      {error && <p className="text-sm text-destructive lg:col-span-2">{error}</p>}
      <p className="text-xs text-muted-foreground lg:col-span-2">{isHebrew ? "טיפ: סרטון של 10–20 שניות והקלטת נביחה קצרה הופכים את הפרופיל להרבה יותר אישי. האודיו אף פעם לא מתנגן אוטומטית." : "Tip: a 10–20 second video and a tiny bark clip make profiles feel much more personal. Audio never auto-plays."}</p>
    </div>
  );
}
