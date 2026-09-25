"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markCompleted } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";

export function CompleteTaskButton({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadProof(f: File): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${taskId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("task-proofs")
      .upload(path, f, { cacheControl: "3600", upsert: false });

    if (upErr) {
      setError(`Falha no upload: ${upErr.message}`);
      return null;
    }

    const { data } = supabase.storage.from("task-proofs").getPublicUrl(path);
    return data.publicUrl;
  }

  function onPickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      let proofUrl: string | null = null;
      if (file) {
        setUploading(true);
        proofUrl = await uploadProof(file);
        setUploading(false);
        if (!proofUrl && file) return;
      }
      const res = await markCompleted(
        taskId,
        proofUrl,
        note.trim() || null,
      );
      if (!res.ok) {
        setError(res.error ?? "Erro ao concluir");
        return;
      }
      setOpen(false);
      setNote("");
      setFile(null);
      setPreview(null);
    });
  }

  return (
    <>
      <Button size="sm" disabled={pending} onClick={() => setOpen(true)}>
        Concluí! ✨
      </Button>

      {open && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-panel__head">
              <h2 id="complete-title" className="text-lg font-bold">
                Missão concluída!
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Escreva uma mensagem (ex: resumo do livro) e, se quiser, anexe uma
              foto.
            </p>

            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sua mensagem
            </label>
            <textarea
              className="mb-3 min-h-[100px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              placeholder="Ex: Li 5 páginas. Resumo: o herói encontrou o mapa…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />

            {preview ? (
              <div className="mb-3 overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Prévia da prova"
                  className="max-h-40 w-full object-cover"
                />
                <button
                  type="button"
                  className="w-full py-1 text-xs text-muted-foreground underline"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                >
                  Remover foto
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="mb-3 w-full"
                onClick={() => inputRef.current?.click()}
              >
                📷 Anexar foto (opcional)
              </Button>
            )}

            {error && (
              <p className="mb-2 text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={pending || uploading}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={pending || uploading}
                onClick={submit}
              >
                {pending || uploading ? "Enviando…" : "Enviar conclusão"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
