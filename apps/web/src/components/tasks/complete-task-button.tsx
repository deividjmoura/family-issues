"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markCompleted } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadProof(file: File): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${taskId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("task-proofs")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      alert(`Falha no upload: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from("task-proofs").getPublicUrl(path);
    return data.publicUrl;
  }

  function complete(proofUrl?: string | null) {
    startTransition(async () => {
      const res = await markCompleted(taskId, proofUrl);
      if (!res.ok && res.error) alert(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          void uploadProof(file).then((url) => {
            setUploading(false);
            if (url) complete(url);
          });
        }}
      />
      <Button
        size="sm"
        disabled={pending || uploading}
        onClick={() => complete()}
      >
        {pending || uploading ? "…" : "Concluí!"}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || uploading}
        onClick={() => inputRef.current?.click()}
        title="Anexar foto de prova"
      >
        {uploading ? "Enviando…" : "📷 + prova"}
      </Button>
    </div>
  );
}
