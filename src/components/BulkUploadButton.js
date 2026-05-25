'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';

// Reusable folder/multi-file JSON upload button.
//
// Props:
//   endpoint     – API URL that accepts { items: [...] } and returns
//                  { success, inserted, skipped, failed, details }
//   entityLabel  – noun used in messages (e.g. "blog", "project")
//   onSuccess    – called after a successful import (use to refetch the list)
//   label        – button text (defaults to "Bulk Upload Folder")
//   className    – extra classes for the button wrapper
export default function BulkUploadButton({
    endpoint,
    entityLabel = 'item',
    onSuccess,
    label = 'Bulk Upload Folder',
    className = '',
}) {
    const [busy, setBusy] = useState(false);

    const readFile = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });

    const handleChange = async (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.name.toLowerCase().endsWith('.json'));
        e.target.value = '';
        if (files.length === 0) {
            Swal.fire('No JSON files', 'The selection did not contain any .json files.', 'warning');
            return;
        }

        const confirm = await Swal.fire({
            title: `Import ${files.length} ${entityLabel} file(s)?`,
            text: `Files whose title already exists will be skipped.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, import',
            confirmButtonColor: '#b8860b',
            cancelButtonColor: '#6b7280',
        });
        if (!confirm.isConfirmed) return;

        setBusy(true);
        Swal.fire({
            title: 'Importing...',
            html: `Reading ${files.length} file(s)...`,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        const items = [];
        const parseErrors = [];
        for (const file of files) {
            try {
                const text = await readFile(file);
                const parsed = JSON.parse(text);
                items.push({ ...parsed, __source: file.name });
            } catch (err) {
                parseErrors.push({ source: file.name, status: 'failed', error: `Parse error: ${err.message}` });
            }
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
                cache: 'no-store',
            });
            const result = await res.json();
            if (!result.success) {
                await Swal.fire('Error', result.error || 'Bulk import failed.', 'error');
                return;
            }

            const inserted = result.inserted || 0;
            const skipped = result.skipped || 0;
            const failed = (result.failed || 0) + parseErrors.length;
            const allDetails = [...parseErrors, ...(result.details || [])];
            const failedRows = allDetails.filter(d => d.status === 'failed');
            const skippedRows = allDetails.filter(d => d.status === 'skipped');

            const failedHtml = failedRows.length
                ? `<details class="mt-3 text-left"><summary class="cursor-pointer font-semibold text-red-600">Failed (${failedRows.length})</summary><ul class="text-xs text-gray-600 mt-2 max-h-40 overflow-y-auto">${failedRows.map(d => `<li>• ${d.source}: ${d.error || ''}</li>`).join('')}</ul></details>`
                : '';
            const skippedHtml = skippedRows.length
                ? `<details class="mt-2 text-left"><summary class="cursor-pointer font-semibold text-gray-600">Skipped (${skippedRows.length})</summary><ul class="text-xs text-gray-600 mt-2 max-h-40 overflow-y-auto">${skippedRows.map(d => `<li>• ${d.source} — already exists</li>`).join('')}</ul></details>`
                : '';

            await Swal.fire({
                icon: failed > 0 ? 'warning' : 'success',
                title: 'Bulk Import Complete',
                html: `<div class="text-left text-sm"><p><strong>Inserted:</strong> ${inserted}</p><p><strong>Skipped:</strong> ${skipped}</p><p><strong>Failed:</strong> ${failed}</p>${skippedHtml}${failedHtml}</div>`,
            });
            onSuccess?.();
        } catch (err) {
            await Swal.fire('Error', err.message || 'Bulk import failed.', 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <label className={`font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 border-2 cursor-pointer ${busy ? 'opacity-60 cursor-not-allowed' : ''} border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white ${className}`}>
            {busy ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Importing...
                </>
            ) : (
                <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    {label}
                </>
            )}
            <input
                type="file"
                accept=".json,application/json"
                multiple
                webkitdirectory=""
                directory=""
                onChange={handleChange}
                disabled={busy}
                className="hidden"
            />
        </label>
    );
}
