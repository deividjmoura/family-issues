"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { markCompleted } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { sfx } from "@/lib/sounds";
import { GAME_MISSION_COMPLETE_EVENT } from "@/components/executor/game-feedback";

export function CompleteTaskButton({ taskId, xp = 1 }: { taskId: string; xp?: number }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    sfx.open();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    sfx.click();
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  function closeModal() {
    if (pending) return;
    sfx.close();
    setOpen(false);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      let proofUrl: string | null = null;
      if (file) {
        setUploading(true);
        proofUrl = await uploadProof(file);
        setUploading(false);
        if (!proofUrl) return;
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
      sfx.success();
      window.dispatchEvent(
        new CustomEvent(GAME_MISSION_COMPLETE_EVENT, { detail: { xp } }),
      );
      setOpen(false);
      setNote("");
      clearPhoto();
    });
  }

  const modal =
    open && mounted
      ? createPortal(
          <div
            className="complete-modal-root"
            role="presentation"
            onClick={closeModal}
          >
            <div
              className="complete-modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="complete-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="complete-modal-panel__head">
                <h2 id="complete-title" className="complete-modal-title">
                  Missão concluída!
                </h2>
                <button
                  type="button"
                  className="complete-modal-close"
                  onClick={closeModal}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div className="complete-modal-body">
                <p className="complete-modal-hint">
                  Escreva uma mensagem (ex: resumo do livro) e tire uma foto se
                  quiser.
                </p>

                <label
                  className="complete-modal-label"
                  htmlFor="complete-note"
                >
                  Sua mensagem
                </label>
                <textarea
                  id="complete-note"
                  className="complete-modal-textarea"
                  placeholder="Ex: Li 5 páginas. Resumo: o herói encontrou o mapa…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  autoFocus
                />

                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0])}
                />

                {preview ? (
                  <div className="complete-modal-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Prévia da prova"
                      className="complete-modal-preview__img"
                    />
                    <button
                      type="button"
                      className="complete-modal-preview__remove"
                      onClick={clearPhoto}
                    >
                      Remover foto
                    </button>
                  </div>
                ) : (
                  <div className="complete-modal-photo-actions">
                    <Button
                      type="button"
                      className="w-full min-h-[48px]"
                      onClick={() => cameraRef.current?.click()}
                    >
                      📷 Tirar foto
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full min-h-[44px]"
                      onClick={() => galleryRef.current?.click()}
                    >
                      Escolher da galeria
                    </Button>
                  </div>
                )}

                {error && (
                  <p className="complete-modal-error" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="complete-modal-footer">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending || uploading}
                  onClick={closeModal}
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
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          sfx.click();
          setOpen(true);
        }}
      >
        Concluí! ✨
      </Button>
      {modal}
    </>
  );
}
