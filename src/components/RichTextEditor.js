'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import {
    MdFormatBold,
    MdFormatItalic,
    MdFormatUnderlined,
    MdFormatListBulleted,
    MdFormatListNumbered,
    MdFormatQuote,
    MdCode,
    MdUndo,
    MdRedo,
    MdTableChart,
    MdLink,
    MdFormatAlignLeft,
    MdFormatAlignCenter,
    MdFormatAlignRight,
    MdFormatAlignJustify,
} from 'react-icons/md';

// `linkSuggestions` enables the inline link search popover (default: true).
// `excludeId` is the current post / project _id so we don't suggest it.
export default function RichTextEditor({ content, onChange, linkSuggestions = true, excludeId = '' }) {
    // Visual / HTML tab toggle — WordPress-style. When the admin is in
    // 'code' mode we hide the TipTap canvas and show a raw HTML textarea
    // they can edit directly. On switch-back we push the edited HTML into
    // the editor.
    const [view, setView] = useState('visual'); // 'visual' | 'code'
    const [codeBuffer, setCodeBuffer] = useState('');
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your content here...',
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full',
                },
            }),
            TableRow,
            TableCell,
            TableHeader,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                    rel: 'noopener noreferrer',
                },
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            FontSize,
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[400px] p-4',
            },
            // Handle paste to preserve formatting
            handlePaste: () => false,
        },
    });

    // Update editor content when prop changes (e.g., when data is fetched)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            editor.commands.setContent(content);
        }
    }, [editor, content]);

    if (!editor) {
        return null;
    }

    const MenuButton = ({ onClick, active, children, title }) => (
        <button
            onClick={onClick}
            type="button"
            title={title}
            className={`p-2 rounded hover:bg-gray-200 transition ${active ? 'bg-[#faf0d0] text-[#b27e02]' : 'text-gray-700'
                }`}
        >
            {children}
        </button>
    );

    // Compute the current block kind (Paragraph / H1 / H2 / H3 / etc.) so we
    // can show it in the dropdown — gives admins instant visibility into
    // what level of heading their cursor is sitting in.
    const currentBlock = editor.isActive('heading', { level: 1 }) ? 'h1'
        : editor.isActive('heading', { level: 2 }) ? 'h2'
            : editor.isActive('heading', { level: 3 }) ? 'h3'
                : editor.isActive('heading', { level: 4 }) ? 'h4'
                    : editor.isActive('heading', { level: 5 }) ? 'h5'
                        : editor.isActive('heading', { level: 6 }) ? 'h6'
                            : 'p';

    const setBlock = (kind) => {
        const chain = editor.chain().focus();
        if (kind === 'p') chain.setParagraph().run();
        else if (kind.startsWith('h')) chain.toggleHeading({ level: parseInt(kind.slice(1), 10) }).run();
    };

    const enterCodeView = () => {
        setCodeBuffer(editor.getHTML());
        setView('code');
    };
    const exitCodeView = () => {
        // Push the edited HTML back into the editor — this also triggers
        // onUpdate → parent's onChange callback.
        editor.commands.setContent(codeBuffer, true);
        onChange(codeBuffer);
        setView('visual');
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Tabs: Visual / HTML — exposes the raw markup like WordPress's "Text" tab. */}
            <div className="flex border-b border-gray-300 bg-white">
                <button
                    type="button"
                    onClick={() => { if (view === 'code') exitCodeView(); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition border-b-2 ${view === 'visual' ? 'border-[#b27e02] text-[#b27e02]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    Visual
                </button>
                <button
                    type="button"
                    onClick={() => { if (view === 'visual') enterCodeView(); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition border-b-2 ${view === 'code' ? 'border-[#b27e02] text-[#b27e02]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                >
                    HTML
                </button>
                {view === 'visual' ? (
                    <span className="ml-auto self-center pr-3 text-[11px] text-gray-400">
                        Block: <strong className="text-gray-700 uppercase">{currentBlock === 'p' ? 'Paragraph' : currentBlock}</strong>
                    </span>
                ) : (
                    <span className="ml-auto self-center pr-3 text-[11px] text-gray-400">Editing raw HTML</span>
                )}
            </div>

            {/* Toolbar */}
            <div className={`bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1 ${view === 'code' ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Block-type dropdown — explicit indicator of the current paragraph / heading. */}
                <select
                    title="Block type"
                    value={currentBlock}
                    onChange={e => setBlock(e.target.value)}
                    className="h-8 px-2 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:border-[#b27e02] cursor-pointer"
                >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="h4">Heading 4</option>
                    <option value="h5">Heading 5</option>
                    <option value="h6">Heading 6</option>
                </select>

                <div className="w-px bg-gray-300 mx-1" />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold"
                >
                    <MdFormatBold size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic"
                >
                    <MdFormatItalic size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline"
                >
                    <MdFormatUnderlined size={20} />
                </MenuButton>

                <div className="w-px bg-gray-300 mx-1" />

                {/* Font Size */}
                <select
                    title="Font Size"
                    className="h-8 px-1 text-sm border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:border-[#b27e02] cursor-pointer"
                    value={editor.getAttributes('textStyle').fontSize || ''}
                    onChange={e => {
                        const size = e.target.value;
                        if (size) editor.chain().focus().setFontSize(size).run();
                        else editor.chain().focus().unsetFontSize().run();
                    }}
                >
                    <option value="">Size</option>
                    {['12px','14px','16px','18px','20px','24px','28px','32px','36px','48px','64px'].map(s => (
                        <option key={s} value={s}>{s.replace('px','')}</option>
                    ))}
                </select>

                <div className="w-px bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                    title="Align Left"
                >
                    <MdFormatAlignLeft size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                    title="Align Center"
                >
                    <MdFormatAlignCenter size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                    title="Align Right"
                >
                    <MdFormatAlignRight size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    active={editor.isActive({ textAlign: 'justify' })}
                    title="Justify"
                >
                    <MdFormatAlignJustify size={20} />
                </MenuButton>

                <div className="w-px bg-gray-300 mx-1" />

                {[1, 2, 3, 4, 5, 6].map(level => (
                    <MenuButton
                        key={level}
                        onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                        active={editor.isActive('heading', { level })}
                        title={`Heading ${level}`}
                    >
                        <span className="font-bold text-sm">H{level}</span>
                    </MenuButton>
                ))}

                <div className="w-px bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <MdFormatListBulleted size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <MdFormatListNumbered size={20} />
                </MenuButton>

                <div className="w-px bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <MdFormatQuote size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    <MdCode size={20} />
                </MenuButton>

                <div className="w-px bg-gray-300 mx-1" />

                {/* Link Button — opens a search popover (Rank Math-style
                    link suggestions) or falls back to a plain URL prompt when
                    suggestions are disabled per type config. */}
                <LinkInsertButton editor={editor} enabled={linkSuggestions} excludeId={excludeId} />

                {/* Table Buttons */}
                <MenuButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                >
                    <MdTableChart size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    title="Add Column"
                >
                    <span className="text-xs font-bold">+Col</span>
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    title="Delete Column"
                >
                    <span className="text-xs font-bold">-Col</span>
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    title="Add Row"
                >
                    <span className="text-xs font-bold">+Row</span>
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    title="Delete Row"
                >
                    <span className="text-xs font-bold">-Row</span>
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    title="Delete Table"
                >
                    <span className="text-xs font-bold text-red-500">Del Tbl</span>
                </MenuButton>

                <div className="w-px bg-gray-300 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    title="Undo"
                >
                    <MdUndo size={20} />
                </MenuButton>

                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    title="Redo"
                >
                    <MdRedo size={20} />
                </MenuButton>
            </div>

            {/* Editor Content */}
            <div className="bg-white">
                {view === 'visual' ? (
                    <EditorContent editor={editor} />
                ) : (
                    <textarea
                        value={codeBuffer}
                        onChange={e => setCodeBuffer(e.target.value)}
                        spellCheck={false}
                        className="w-full min-h-[400px] p-4 font-mono text-[13px] leading-[1.6] text-gray-800 bg-white focus:outline-none resize-y"
                    />
                )}
            </div>

            {/* Character Counter */}
            <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-600 text-right">
                {editor.storage.characterCount?.characters() || 0} characters
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
          padding: 1rem;
          color: #111827;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: 'Start writing your content here...';
          color: #9ca3af;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror:focus {
          outline: none;
        }
        /* Heading tags — admin-only inline label so you can SEE which
           heading level each line is without selecting it. Rendered via
           ::before so it doesn't end up in the saved HTML. */
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6 {
          position: relative;
          padding-left: 3rem;
        }
        .ProseMirror h1::before,
        .ProseMirror h2::before,
        .ProseMirror h3::before,
        .ProseMirror h4::before,
        .ProseMirror h5::before,
        .ProseMirror h6::before {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 6px;
          border-radius: 4px;
          background: #faf0d0;
          color: #b27e02;
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }
        .ProseMirror h1::before { content: 'H1'; }
        .ProseMirror h2::before { content: 'H2'; }
        .ProseMirror h3::before { content: 'H3'; }
        .ProseMirror h4::before { content: 'H4'; }
        .ProseMirror h5::before { content: 'H5'; }
        .ProseMirror h6::before { content: 'H6'; }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h4 {
          font-size: 1.1rem;
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror li p {
          margin-bottom: 0.25rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .ProseMirror pre {
          background: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        .ProseMirror code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
        }
        .ProseMirror u {
          text-decoration: underline;
        }
        /* Table Styles */
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: auto;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          min-width: 100px;
        }
        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: 600;
          text-align: left;
        }
        .ProseMirror td {
          background-color: #fff;
        }
        .ProseMirror .selectedCell {
          background-color: #dbeafe;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          pointer-events: none;
        }
        /* Strong/Bold */
        .ProseMirror strong {
          font-weight: 700;
        }
        /* Horizontal Rule */
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }
      `}</style>
        </div>
    );
}

// ----------------------------------------------------------------------------
// Link insertion popover (Rank Math-style suggestions).
// ----------------------------------------------------------------------------
// Click the link button → popover opens with a search box. Typing fires
// /api/link-suggestions which returns matching blog posts + projects. Picking
// one applies the link to the current selection (or inserts the title as the
// link text if nothing is selected).
//
// `enabled=false` reverts to the simple URL prompt for users / post types
// where the Titles & Meta "Link Suggestions" toggle is off.

function LinkInsertButton({ editor, enabled, excludeId }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [urlOverride, setUrlOverride] = useState('');
    const wrapRef = useRef(null);

    // Debounced search.
    useEffect(() => {
        if (!open || !enabled || !q.trim()) { setItems([]); return; }
        let cancelled = false;
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ q: q.trim() });
                if (excludeId) params.set('excludeId', String(excludeId));
                const res = await fetch(`/api/link-suggestions?${params.toString()}`);
                const j = await res.json();
                if (!cancelled && j.success) setItems(j.data || []);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 200);
        return () => { cancelled = true; clearTimeout(t); };
    }, [q, open, enabled, excludeId]);

    // Click-outside to close.
    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    const applyLink = (url, title) => {
        if (!url) return;
        const { from, to, empty } = editor.state.selection;
        const chain = editor.chain().focus();
        if (empty) {
            // No selection — insert the title text as a new link.
            chain.insertContent(`<a href="${escapeAttr(url)}" title="${escapeAttr(title || '')}">${escapeText(title || url)}</a>`).run();
        } else {
            // Selection — wrap it with the link.
            chain.extendMarkRange('link').setLink({ href: url }).run();
        }
        setOpen(false);
        setQ('');
        setItems([]);
        setUrlOverride('');
    };

    const handleClick = () => {
        if (!enabled) {
            const url = window.prompt('Enter URL:');
            if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            return;
        }
        setOpen(o => !o);
    };

    return (
        <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={handleClick}
                title="Add Link"
                className={`p-2 rounded transition ${editor.isActive('link') ? 'bg-gold text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
                <MdLink size={20} />
            </button>

            {open && enabled ? (
                <div
                    className="absolute z-40 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl p-3"
                    style={{ top: '100%', left: 0 }}
                >
                    <input
                        type="text"
                        autoFocus
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search posts and projects…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold mb-2"
                    />

                    <div className="max-h-64 overflow-y-auto -mx-3">
                        {loading ? (
                            <p className="px-3 py-2 text-xs text-gray-500">Searching…</p>
                        ) : items.length === 0 && q.trim() ? (
                            <p className="px-3 py-2 text-xs text-gray-500">No matches.</p>
                        ) : items.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-gray-400">Type to search internal posts and projects.</p>
                        ) : (
                            items.map(it => (
                                <button
                                    key={`${it.kind}-${it._id}`}
                                    type="button"
                                    onClick={() => applyLink(it.url, it.title)}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-t border-gray-100 first:border-t-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${it.kind === 'blog' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {it.kind}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800 truncate">{it.title}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-mono truncate">{it.url}</div>
                                </button>
                            ))
                        )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[11px] text-gray-500 mb-1">Or paste a URL</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={urlOverride}
                                onChange={e => setUrlOverride(e.target.value)}
                                placeholder="https://… or /relative"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:border-gold"
                            />
                            <button
                                type="button"
                                onClick={() => applyLink(urlOverride.trim(), urlOverride.trim())}
                                disabled={!urlOverride.trim()}
                                className="px-3 py-2 bg-gold text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                Insert
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function escapeAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeText(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
