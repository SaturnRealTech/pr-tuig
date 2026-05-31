'use client';

import { useState } from 'react';
import { MdSend, MdClose, MdAddCircleOutline } from 'react-icons/md';
import Swal from 'sweetalert2';

const DEFAULT_APPROVER = 'santosh.saturnrealcon@gmail.com';

// `entity` is what we send to /api/send-approval — { type, id, title }.
// `type` must match a key in the API's ENTITY_MAP: project / blog /
// blog-category / category.
export default function SendApprovalModal({ entity, onClose }) {
    const [emails, setEmails] = useState([]);
    const [input, setInput] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const addEmail = () => {
        const value = input.trim();
        if (!value) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            Swal.fire('Invalid email', value, 'warning');
            return;
        }
        if (emails.includes(value) || value === DEFAULT_APPROVER) {
            setInput('');
            return;
        }
        setEmails(prev => [...prev, value]);
        setInput('');
    };

    const removeEmail = (e) => setEmails(prev => prev.filter(x => x !== e));

    const handleSend = async () => {
        try {
            setSending(true);
            const res = await fetch('/api/send-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: entity.type,
                    id: entity.id,
                    additionalEmails: emails,
                    message: message.trim(),
                }),
            });
            const json = await res.json();
            if (!json.success) {
                Swal.fire('Could not send', json.error || 'Unknown error', 'error');
                return;
            }
            await Swal.fire({
                title: 'Mail sent',
                html: `<div style="text-align:left;font-size:13px"><div><b>To:</b> ${(json.data?.to || []).join(', ')}</div>${json.data?.cc?.length ? `<div><b>Cc:</b> ${json.data.cc.join(', ')}</div>` : ''}</div>`,
                icon: 'success',
                confirmButtonColor: '#b27e02',
            });
            onClose();
        } catch (e) {
            Swal.fire('Network error', e.message, 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <MdSend className="text-emerald-600" /> Send for approval
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{entity.title || ''}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <MdClose size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Default recipient</label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono">
                            {DEFAULT_APPROVER}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Additional recipients</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                                placeholder="add another email"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm"
                            />
                            <button type="button" onClick={addEmail}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition">
                                <MdAddCircleOutline size={18} /> Add
                            </button>
                        </div>
                        {emails.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {emails.map(e => (
                                    <span key={e} className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                                        {e}
                                        <button type="button" onClick={() => removeEmail(e)}
                                            className="ml-1 text-emerald-500 hover:text-emerald-800">
                                            <MdClose size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Extra note (optional)</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={3}
                            placeholder="Add anything you want to highlight…"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Title, page URL, and your details are added automatically.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                    <button type="button" onClick={onClose} disabled={sending}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSend} disabled={sending}
                        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                        <MdSend size={16} /> {sending ? 'Sending…' : 'Send Mail'}
                    </button>
                </div>
            </div>
        </div>
    );
}
