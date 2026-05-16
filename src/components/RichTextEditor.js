'use client';

import { useEffect } from 'react';
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

export default function RichTextEditor({ content, onChange }) {
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

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
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

                {/* Link Button */}
                <MenuButton
                    onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        }
                    }}
                    active={editor.isActive('link')}
                    title="Add Link"
                >
                    <MdLink size={20} />
                </MenuButton>

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
                <EditorContent editor={editor} />
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
