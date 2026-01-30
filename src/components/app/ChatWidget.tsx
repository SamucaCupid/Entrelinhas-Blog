"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import type { Category } from "@/types";

type ChatWidgetProps = {
  categories: Category[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Oi! Sou a IA do Entrelinhas. Conte o flagrante, escolha a categoria e anexe foto, video ou relato.",
};

export function ChatWidget({ categories }: ChatWidgetProps) {
  const MIN_WIDTH = 280;
  const MIN_HEIGHT = 360;
  const MAX_WIDTH = 560;
  const MAX_HEIGHT = 720;
  const VIEWPORT_MARGIN = 24;

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [category, setCategory] = useState(categories[0]?.name ?? "Politica");
  const [categoryLocked, setCategoryLocked] = useState(false);
  const [size, setSize] = useState({ width: 360, height: 520 });
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hoverHandle, setHoverHandle] = useState<"none" | "top" | "left" | "corner">("none");
  const [activeHandle, setActiveHandle] = useState<"none" | "top" | "left" | "corner">("none");
  const isResizingRef = useRef(false);
  const activeHandleRef = useRef<"none" | "top" | "left" | "corner">("none");
  const startRef = useRef({
    x: 0,
    y: 0,
    width: 360,
    height: 520,
    anchorRight: 0,
    anchorBottom: 0,
  });
  const positionRef = useRef(position);
  const sizeRef = useRef(size);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    if (!open) return;

    const maxWidth = Math.min(MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const maxHeight = Math.min(MAX_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2);

    const width = Math.min(Math.max(sizeRef.current.width, MIN_WIDTH), maxWidth);
    const height = Math.min(Math.max(sizeRef.current.height, MIN_HEIGHT), maxHeight);
    const top = Math.max(VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN - height);
    const left = Math.max(VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - width);

    setSize({ width, height });
    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - startRef.current.x;
      const deltaY = event.clientY - startRef.current.y;

      const anchorRight = Math.min(startRef.current.anchorRight, window.innerWidth - VIEWPORT_MARGIN);
      const anchorBottom = Math.min(startRef.current.anchorBottom, window.innerHeight - VIEWPORT_MARGIN);

      const maxWidth = Math.min(MAX_WIDTH, anchorRight - VIEWPORT_MARGIN);
      const maxHeight = Math.min(MAX_HEIGHT, anchorBottom - VIEWPORT_MARGIN);
      const baseLeft = anchorRight - startRef.current.width;
      const baseTop = anchorBottom - startRef.current.height;
      const handle = activeHandleRef.current;

      let nextWidth = startRef.current.width;
      let nextHeight = startRef.current.height;

      if (handle === "left" || handle === "corner") {
        nextWidth = Math.min(Math.max(startRef.current.width - deltaX, MIN_WIDTH), maxWidth);
      }

      if (handle === "top" || handle === "corner") {
        nextHeight = Math.min(Math.max(startRef.current.height - deltaY, MIN_HEIGHT), maxHeight);
      }

      const nextLeft = handle === "left" || handle === "corner" ? anchorRight - nextWidth : baseLeft;
      const nextTop = handle === "top" || handle === "corner" ? anchorBottom - nextHeight : baseTop;

      setSize({ width: nextWidth, height: nextHeight });
      setPosition({ left: nextLeft, top: nextTop });
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      activeHandleRef.current = "none";
      setActiveHandle("none");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const categoryOptions = useMemo(() => {
    const names = categories.map((item) => item.name);
    return names.length ? [...names, "Outro"] : ["Politica", "Policial", "Eventos", "Outro"];
  }, [categories]);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    setFiles(selected);
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSend = () => {
    if (!message.trim() && files.length === 0) return;

    const fileSummary = files.length ? ` (${files.length} arquivo(s) anexado(s))` : "";
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: `Categoria: ${category}. ${message.trim()}${fileSummary}`.trim(),
    };

    const assistantMessage: Message = {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content: "Recebido! Agora, se puder, descreva local, horario e qualquer detalhe importante do flagrante.",
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setMessage("");
    setFiles([]);
    if (!categoryLocked) {
      setCategoryLocked(true);
    }
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, label")) return;
    const handle = getResizeHandle(event);
    if (handle === "none") return;

    isResizingRef.current = true;
    activeHandleRef.current = handle;
    setActiveHandle(handle);
    const anchorRight = positionRef.current.left + sizeRef.current.width;
    const anchorBottom = positionRef.current.top + sizeRef.current.height;
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: sizeRef.current.width,
      height: sizeRef.current.height,
      anchorRight,
      anchorBottom,
    };
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isResizingRef.current) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, label")) {
      setHoverHandle("none");
      return;
    }

    setHoverHandle(getResizeHandle(event));
  };

  const getResizeHandle = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const threshold = 10;
    const onLeft = x <= threshold;
    const onTop = y <= threshold;

    if (onLeft && onTop) return "corner";
    if (onLeft) return "left";
    if (onTop) return "top";
    return "none";
  };

  const cursor = (() => {
    const handle = activeHandle !== "none" ? activeHandle : hoverHandle;
    if (handle === "corner") return "nwse-resize";
    if (handle === "left") return "ew-resize";
    if (handle === "top") return "ns-resize";
    return "default";
  })();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-8 right-8 bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-3 shadow-lg items-center gap-2 font-semibold transition"
      >
        <Send size={18} />
        Envie seu flagrante
      </button>

      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-5 right-5 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        aria-label="Enviar flagrante"
      >
        <Send size={18} />
      </button>

      {open && (
        <div
          onMouseDown={handleResizeStart}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverHandle("none")}
          className="fixed max-w-[90vw] min-w-[280px] max-h-[80vh] min-h-[360px] bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
          style={{ width: size.width, height: size.height, top: position.top, left: position.left, cursor }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Enviar flagrante</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">IA do Entrelinhas</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  item.role === "user"
                    ? "ml-auto bg-green-500 text-white"
                    : "bg-zinc-100 text-zinc-800 dark:bg-slate-800 dark:text-zinc-200"
                }`}
              >
                {item.content}
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 dark:border-slate-700 px-4 py-3 space-y-3">
            {!categoryLocked ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Categoria</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Categoria selecionada: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{category}</span>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white">
                <Paperclip size={18} />
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFilesChange} />
              </label>
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Descreva o flagrante..."
                className="flex-1 px-3 py-2 text-sm rounded-full border border-zinc-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-zinc-900 dark:text-white"
              />
              <button onClick={handleSend} className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2">
                <Send size={16} />
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Seu envio sera analisado pela equipe. Nenhum arquivo e enviado automaticamente.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
