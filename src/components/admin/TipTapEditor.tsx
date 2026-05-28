"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import UnderlineExtension from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { TextSelection } from "@tiptap/pm/state";
import { useEffect, useState, useCallback, useMemo } from "react";

// Image extension with resize support
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
      if (node.attrs.width) img.style.width = node.attrs.width;

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
      // Defer initial check so getPos is available
      requestAnimationFrame(update);

      // Click on image selects it
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
          editor
            .chain()
            .focus()
            .updateAttributes("image", { width: img.style.width })
            .run();
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      };
      handle.addEventListener("mousedown", onMouseDown);

      container.appendChild(img);
      container.appendChild(handle);
      return { dom: container, destroy: () => editor.off("selectionUpdate", update) };
    };
  },
});
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
} from "lucide-react";

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

export function TipTapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const [mounted, setMounted] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lowlight = useMemo(() => createLowlight(common), []);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      ResizableImage,
      UnderlineExtension,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4",
      },
      handleKeyDown: (view, event) => {
        if (event.key !== "Tab") return false;
        const { selection, schema } = view.state;
        if (selection.$from.parent.type.name !== "codeBlock") return false;
        event.preventDefault();

        const { from, to } = selection;
        const doc = view.state.doc;
        const text = doc.textBetween(from, to);

        if (selection.empty && !event.shiftKey) {
          // Cursor with no selection — insert a tab
          view.dispatch(view.state.tr.insertText("\t"));
          return true;
        }

        // Selection or Shift+Tab — modify each line
        const lines = text.split("\n");

        if (event.shiftKey) {
          // Unindent: remove one leading tab from each line
          const newText = lines.map((l) => (l.startsWith("\t") ? l.slice(1) : l)).join("\n");
          const tr = view.state.tr.replaceWith(from, to, schema.text(newText));
          tr.setSelection(new TextSelection(tr.doc.resolve(from), tr.doc.resolve(from + newText.length)));
          view.dispatch(tr);
        } else {
          // Indent: add one tab to each line
          const newText = lines.map((l) => "\t" + l).join("\n");
          const tr = view.state.tr.replaceWith(from, to, schema.text(newText));
          tr.setSelection(new TextSelection(tr.doc.resolve(from), tr.doc.resolve(from + newText.length)));
          view.dispatch(tr);
        }
        return true;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content && !mounted) {
      editor.commands.setContent(content);
    }
  }, [editor, content, mounted]);

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

  const handleLink = useCallback(() => {
    if (!editor) return;
    setLinkUrl(editor.getAttributes("link").href || "");
    setShowLinkInput(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

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
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 border-b bg-background">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="输入链接地址..."
            className="flex-1 border rounded px-2 py-1 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") applyLink();
              if (e.key === "Escape") setShowLinkInput(false);
            }}
          />
          <button type="button" onClick={applyLink} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
            确定
          </button>
          {editor.getAttributes("link").href && (
            <button type="button" onClick={removeLink} className="text-xs px-2 py-1 border rounded">
              移除链接
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 p-2 border-b bg-blue-50 text-blue-600 text-sm">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          上传图片中...
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
