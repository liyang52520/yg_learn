"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import UnderlineExtension from "@tiptap/extension-underline";
import { InlineMath, BlockMath } from "@tiptap/extension-mathematics";
import { TextSelection } from "@tiptap/pm/state";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  Undo,
  Redo,
  Minus,
  Sigma,
} from "lucide-react";
import katex from "katex";

// ── Image extension with resize support ──────────────────────────────────────
const ResizableImage = ImageExtension.extend({
  addAttributes() {
    return {
      src: {},
      alt: { default: null },
      title: { default: null },
      width: { default: null },
    };
  },

  addNodeView() {
    return ({ editor, node, getPos }) => {
      const container = document.createElement("div");
      container.className = "relative inline-block leading-none";
      container.contentEditable = "false";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      if (node.attrs.width) img.style.width = `${node.attrs.width}px`;

      const handle = document.createElement("div");
      handle.className =
        "absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-primary border-2 border-white rounded-sm";
      handle.style.opacity = "0";
      handle.style.transition = "opacity 0.15s";

      const update = () => {
        const isSelected =
          editor.state.selection &&
          typeof getPos === "function" &&
          editor.state.selection.from === getPos();
        handle.style.opacity = isSelected ? "1" : "0";
        container.style.outline = isSelected ? "2px solid hsl(var(--primary))" : "none";
      };

      editor.on("selectionUpdate", update);
      requestAnimationFrame(update);

      container.addEventListener("click", () => {
        const pos = getPos();
        if (typeof pos === "number") {
          editor.commands.focus();
          editor.commands.setTextSelection({ from: pos, to: pos });
        }
      });

      let startX = 0;
      let startWidth = 0;
      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startX = e.clientX;
        startWidth = img.getBoundingClientRect().width;
        const onMouseMove = (me: MouseEvent) => {
          const newWidth = Math.max(60, startWidth + me.clientX - startX);
          img.style.width = `${newWidth}px`;
        };
        const onMouseUp = () => {
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          const pos = getPos();
          if (typeof pos === "number") {
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes("image", { width: parseInt(img.style.width, 10) })
              .run();
          }
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };
      handle.addEventListener("mousedown", onMouseDown);

      container.appendChild(img);
      container.appendChild(handle);
      return {
        dom: container,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "image") return false;
          if (updatedNode.attrs.width !== node.attrs.width) {
            img.style.width = updatedNode.attrs.width ? `${updatedNode.attrs.width}px` : "";
            node = updatedNode;
          }
          return true;
        },
        destroy: () => editor.off("selectionUpdate", update),
      };
    };
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
  if (!res.ok) return null;
  const { url } = await res.json();
  return url;
}

function ToolbarButton({
  onClick,
  active,
  icon: Icon,
  title,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  icon: any;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } disabled:opacity-30`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}

const COMMON_FORMULAS = [
  { label: "二次方程", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { label: "勾股定理", latex: "a^2 + b^2 = c^2" },
  { label: "欧拉公式", latex: "e^{i\\pi} + 1 = 0" },
  { label: "导数", latex: "\\frac{d}{dx}x^n = nx^{n-1}" },
  { label: "积分", latex: "\\int_a^b f(x)\\,dx" },
  { label: "求和", latex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
  { label: "正态分布", latex: "X \\sim N(\\mu, \\sigma^2)" },
  { label: "极限", latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1" },
];

export function TipTapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const [mathDialogOpen, setMathDialogOpen] = useState(false);
  const [mathLatex, setMathLatex] = useState("");
  const [mathMode, setMathMode] = useState<"inline" | "block">("inline");
  const [mathPreview, setMathPreview] = useState("");
  const editingMathPosRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      ResizableImage,
      UnderlineExtension,
      InlineMath.configure({
        katexOptions: { throwOnError: false },
        onClick: (node, pos) => {
          const ed = editorRef.current;
          if (!ed?.isEditable) return;
          const tr = ed.state.tr
            .replaceWith(pos, pos + 1, ed.state.schema.text(`$${node.attrs.latex}$`));
          tr.setSelection(TextSelection.create(tr.doc, pos + 1));
          ed.view.dispatch(tr);
        },
      }),
      BlockMath.configure({
        katexOptions: { throwOnError: false },
        onClick: (node, pos) => {
          const ed = editorRef.current;
          if (!ed?.isEditable) return;
          const text = `$$$` + node.attrs.latex + `$$$`;
          const tr = ed.state.tr
            .replaceWith(pos, pos + 1,
              ed.state.schema.nodes.paragraph.create(null, ed.state.schema.text(text)));
          tr.setSelection(TextSelection.create(tr.doc, pos + 3));
          ed.view.dispatch(tr);
        },
      }),
    ],
    content,
    onCreate: ({ editor }) => { editorRef.current = editor; },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
    immediatelyRender: false,
  });

  const closeMathDialog = useCallback(() => {
    setMathDialogOpen(false);
    setMathLatex("");
    setMathPreview("");
    editingMathPosRef.current = null;
  }, []);

  const applyMath = useCallback(() => {
    if (!editor || !mathLatex.trim()) return;
    if (mathMode === "inline") {
      editor.chain().focus().insertInlineMath({ latex: mathLatex }).run();
    } else {
      editor.chain().focus().insertBlockMath({ latex: mathLatex }).run();
    }
    closeMathDialog();
  }, [editor, mathLatex, mathMode, closeMathDialog]);

  const handleMathButtonClick = useCallback(() => {
    setMathLatex("");
    setMathMode("inline");
    setMathPreview("");
    editingMathPosRef.current = null;
    setMathDialogOpen(true);
  }, []);

  // Live KaTeX preview
  useEffect(() => {
    if (!mathDialogOpen) return;
    try {
      const html = katex.renderToString(mathLatex || "\\ ", {
        throwOnError: false,
        displayMode: mathMode === "block",
      });
      setMathPreview(html);
    } catch {
      setMathPreview("");
    }
  }, [mathLatex, mathMode, mathDialogOpen]);

  const handleLink = useCallback(() => {
    if (!editor) return;
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkDialogOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkDialogOpen(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkDialogOpen(false);
  }, [editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploading(true);
      const url = await uploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      setUploading(false);
    },
    [editor],
  );

  const handleImageButtonClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleImageUpload(file);
    };
    input.click();
  }, [handleImageUpload]);

  // Paste image from clipboard
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageUpload(file);
            return;
          }
        }
      }
    };
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [editor, handleImageUpload]);

  // Drop image
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          handleImageUpload(file);
          return;
        }
      }
    };
    el.addEventListener("drop", onDrop);
    return () => el.removeEventListener("drop", onDrop);
  }, [editor, handleImageUpload]);

  if (!mounted) {
    return <div className="border rounded-md min-h-[400px] p-4 bg-muted animate-pulse" />;
  }

  if (!editor) return null;

  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-0.5 p-1.5 border-b bg-muted/50 flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="撤销" disabled={!editor.can().undo()} />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="重做" disabled={!editor.can().redo()} />
        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={Heading1}
          title="标题 1"
          active={editor.isActive("heading", { level: 1 })}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={Heading2}
          title="标题 2"
          active={editor.isActive("heading", { level: 2 })}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={Heading3}
          title="标题 3"
          active={editor.isActive("heading", { level: 3 })}
        />
        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} title="加粗" active={editor.isActive("bold")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} title="斜体" active={editor.isActive("italic")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} icon={Underline} title="下划线" active={editor.isActive("underline")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} icon={Strikethrough} title="删除线" active={editor.isActive("strike")} />
        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote} title="引用" active={editor.isActive("blockquote")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={Code} title="代码块" active={editor.isActive("codeBlock")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} title="无序列表" active={editor.isActive("bulletList")} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} title="有序列表" active={editor.isActive("orderedList")} />
        <Divider />

        <ToolbarButton onClick={handleLink} icon={Link} title="链接" active={editor.isActive("link")} />
        <ToolbarButton onClick={handleImageButtonClick} icon={Image} title="图片" disabled={uploading} />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="分割线" />
        <Divider />
        <ToolbarButton onClick={handleMathButtonClick} icon={Sigma} title="数学公式" />
      </div>

      {linkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setLinkDialogOpen(false)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">插入链接</h3>
              <button type="button" onClick={() => setLinkDialogOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>
            <div className="p-4">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="输入链接地址..."
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink();
                  if (e.key === "Escape") setLinkDialogOpen(false);
                }}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button type="button" onClick={() => setLinkDialogOpen(false)} className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
                取消
              </button>
              {editor.getAttributes("link").href && (
                <button type="button" onClick={removeLink} className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
                  移除链接
                </button>
              )}
              <button type="button" onClick={applyLink} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 p-2 border-b bg-blue-50 text-blue-600 text-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          上传图片中...
        </div>
      )}

      {mathDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeMathDialog}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">插入数学公式</h3>
              <button type="button" onClick={closeMathDialog} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMathMode("inline")}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${mathMode === "inline" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  行内公式
                </button>
                <button
                  type="button"
                  onClick={() => setMathMode("block")}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${mathMode === "block" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                >
                  块级公式
                </button>
              </div>

              {/* LaTeX input */}
              <textarea
                value={mathLatex}
                onChange={(e) => setMathLatex(e.target.value)}
                placeholder="输入 LaTeX 公式，如 E = mc^2"
                className="w-full border rounded-md p-2 text-sm font-mono min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) applyMath();
                  if (e.key === "Escape") closeMathDialog();
                }}
              />

              {/* Live preview */}
              {mathLatex && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">预览</div>
                  <div className="border rounded-md p-4 min-h-[60px] flex items-center justify-center bg-muted/30 overflow-x-auto" dangerouslySetInnerHTML={{ __html: mathPreview }} />
                </div>
              )}

              {/* Common formulas */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">常用公式</div>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_FORMULAS.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setMathLatex(f.latex)}
                      className="text-left p-2 border rounded-md text-xs hover:bg-muted transition-colors"
                    >
                      <div className="font-medium text-foreground mb-0.5">{f.label}</div>
                      <code className="text-muted-foreground">${f.latex}$</code>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-2">
              <button type="button" onClick={closeMathDialog} className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors">
                取消
              </button>
              <button type="button" onClick={applyMath} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                插入
              </button>
            </div>
          </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
