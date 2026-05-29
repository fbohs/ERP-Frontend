'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import FontFamily from '@tiptap/extension-font-family'
import { useEffect, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Baseline,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  readonly value: string
  readonly onChange: (html: string) => void
  readonly disabled?: boolean
  readonly placeholder?: string
}

const FONT_FAMILIES = [
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, sans-serif' },
  { label: 'Serif', value: 'ui-serif, Georgia, serif' },
  { label: 'Monospace', value: 'ui-monospace, monospace' },
] as const

const SELECT_CLASS = cn(
  'h-7 rounded border border-border bg-background px-2 py-0.5',
  'text-xs text-foreground',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
)

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  readonly onClick: () => void
  readonly active?: boolean
  readonly title?: string
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-xs transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" />
}

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Describe the product…',
}: RichTextEditorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const highlightInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      FontFamily,
    ],
    content: value || '',
    editable: !disabled,
    onUpdate({ editor: e }) {
      const html = e.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        class: 'tiptap-prose focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    const normalised = current === '<p></p>' ? '' : current
    if (normalised !== value) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  if (!editor) return null

  function handleLink() {
    const prev = (editor.getAttributes('link').href as string | undefined) ?? ''
    const url = window.prompt('Enter URL', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const headingLevel = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p'

  function setHeading(val: string) {
    if (val === 'p') {
      editor.chain().focus().setParagraph().run()
    } else {
      const level = parseInt(val.replace('h', ''), 10) as 1 | 2 | 3
      editor.chain().focus().toggleHeading({ level }).run()
    }
  }

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-card text-sm',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        <select
          value={(editor.getAttributes('textStyle').fontFamily as string | undefined) ?? ''}
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run()
            } else {
              editor.chain().focus().unsetFontFamily().run()
            }
          }}
          className={SELECT_CLASS}
          title="Font family"
        >
          <option value="">Default</option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          value={headingLevel}
          onChange={(e) => setHeading(e.target.value)}
          className={cn(SELECT_CLASS, 'ml-1')}
          title="Paragraph style"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Text colour */}
        <div className="relative">
          <ToolbarButton onClick={() => colorInputRef.current?.click()} title="Text colour">
            <Baseline className="h-3.5 w-3.5" />
          </ToolbarButton>
          <input
            ref={colorInputRef}
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            defaultValue="#f2f2f2"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </div>

        {/* Highlight */}
        <div className="relative">
          <ToolbarButton onClick={() => highlightInputRef.current?.click()} title="Highlight">
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <input
            ref={highlightInputRef}
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            defaultValue="#facc15"
            onChange={(e) =>
              editor.chain().focus().toggleHighlight({ color: e.target.value }).run()
            }
          />
        </div>

        <Divider />

        <ToolbarButton onClick={handleLink} active={editor.isActive('link')} title="Link">
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Content area */}
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  )
}
