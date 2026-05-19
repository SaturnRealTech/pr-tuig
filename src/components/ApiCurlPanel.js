'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Swal from 'sweetalert2';

function ApiCurlBlock({ title, method, code, label, color, copied, onCopy }) {
    return (
        <div className="mb-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${color}`}>{method}</span>
                    <p className="text-sm font-semibold text-gray-700 truncate">{title}</p>
                </div>
                <button type="button" onClick={() => onCopy(code, label)}
                    className="text-xs px-3 py-1 bg-[#b27e02] text-white rounded hover:bg-[#8a6002] transition font-semibold shrink-0">
                    {copied === label ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-72 whitespace-pre-wrap break-all max-w-full">{code}</pre>
        </div>
    );
}

const ApiCurlPanel = memo(function ApiCurlPanel({
    title = 'API Access — n8n / cURL',
    resourceName = 'Item',
    endpoint,           // e.g. '/api/projects' or '/api/blog'
    itemId = null,      // when null, hides GET-by-id / PUT / DELETE blocks
    samplePayload,      // object — used as POST body
    updatePayload = { title: 'Updated Title' }, // object — used as PUT body
    patchPayload = null, // object — when set (and itemId present), shows PATCH block
    listQuery = '',     // e.g. '?admin=1' (optional)
}) {
    const [token, setToken] = useState('');
    const [origin, setOrigin] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [format, setFormat] = useState('json');

    useEffect(() => {
        try { setToken(localStorage.getItem('token') || ''); } catch { }
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    const baseUrl = origin || 'http://localhost:3000';
    const tokenForCmd = token || 'YOUR_TOKEN';
    const maskedToken = token
        ? (showToken ? token : (token.length > 16 ? token.slice(0, 8) + '••••••••' + token.slice(-8) : '••••••••'))
        : '(no token — please log in again)';

    const codes = useMemo(() => {
        if (collapsed) return null;

        const shell = (obj) => JSON.stringify(obj, null, 2).replace(/'/g, "'\\''");
        const collectionUrl = `${baseUrl}${endpoint}${listQuery}`;
        const itemUrl = itemId ? `${baseUrl}${endpoint}/${itemId}` : null;

        const curl = {
            post: `curl -X POST '${baseUrl}${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: auth-token=${tokenForCmd}' \\
  -d '${shell(samplePayload)}'`,
            getList: `curl -X GET '${collectionUrl}' \\
  -H 'Cookie: auth-token=${tokenForCmd}'`,
            ...(itemUrl && {
                getOne: `curl -X GET '${itemUrl}'`,
                put: `curl -X PUT '${itemUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: auth-token=${tokenForCmd}' \\
  -d '${shell(updatePayload)}'`,
                ...(patchPayload && {
                    patch: `curl -X PATCH '${itemUrl}' \\
  -H 'Content-Type: application/json' \\
  -H 'Cookie: auth-token=${tokenForCmd}' \\
  -d '${shell(patchPayload)}'`,
                }),
                delete: `curl -X DELETE '${itemUrl}' \\
  -H 'Cookie: auth-token=${tokenForCmd}'`,
            }),
        };

        const buildN8n = (name, method, url, body) => {
            const headers = [{ name: 'Cookie', value: `auth-token=${tokenForCmd}` }];
            if (body) headers.unshift({ name: 'Content-Type', value: 'application/json' });
            const parameters = {
                method, url,
                sendHeaders: true,
                headerParameters: { parameters: headers },
                ...(body ? {
                    sendBody: true,
                    contentType: 'json',
                    specifyBody: 'json',
                    jsonBody: JSON.stringify(body, null, 2),
                } : {}),
                options: {},
            };
            return JSON.stringify({
                name,
                nodes: [{
                    parameters,
                    name: 'HTTP Request',
                    type: 'n8n-nodes-base.httpRequest',
                    typeVersion: 4.2,
                    position: [250, 300],
                }],
                connections: {},
                active: false,
                settings: { executionOrder: 'v1' },
                pinData: {},
            }, null, 2);
        };

        const json = {
            post: buildN8n(`Create ${resourceName}`, 'POST', `${baseUrl}${endpoint}`, samplePayload),
            getList: buildN8n(`List ${resourceName}s`, 'GET', collectionUrl, null),
            ...(itemUrl && {
                getOne: buildN8n(`Get ${resourceName}`, 'GET', itemUrl, null),
                put: buildN8n(`Update ${resourceName}`, 'PUT', itemUrl, updatePayload),
                ...(patchPayload && {
                    patch: buildN8n(`Patch ${resourceName}`, 'PATCH', itemUrl, patchPayload),
                }),
                delete: buildN8n(`Delete ${resourceName}`, 'DELETE', itemUrl, null),
            }),
        };

        return { curl, json };
    }, [collapsed, baseUrl, tokenForCmd, endpoint, itemId, listQuery, samplePayload, updatePayload, patchPayload, resourceName]);

    const copy = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(''), 1500);
        } catch {
            Swal.fire('Copy Failed', 'Clipboard not available in this browser.', 'error');
        }
    };

    const codeFor = (kind) => codes ? (format === 'json' ? codes.json[kind] : codes.curl[kind]) : '';

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-purple-500 mb-6 max-w-full overflow-hidden min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">ADMIN ONLY</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {format === 'json'
                            ? 'Copy the JSON and paste it into n8n → Workflows → Import from File / Clipboard.'
                            : 'Copy a cURL command — n8n can also import it via HTTP Request node → Import cURL.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button type="button" onClick={() => setFormat('json')}
                            className={`text-xs px-3 py-1.5 rounded font-semibold transition ${format === 'json' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-800'}`}>
                            n8n JSON
                        </button>
                        <button type="button" onClick={() => setFormat('curl')}
                            className={`text-xs px-3 py-1.5 rounded font-semibold transition ${format === 'curl' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-800'}`}>
                            cURL
                        </button>
                    </div>
                    <button type="button" onClick={() => setCollapsed(c => !c)}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition text-gray-700 font-semibold">
                        {collapsed ? 'Show' : 'Hide'}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-semibold text-gray-700">Your Auth Token (JWT)</p>
                            <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => setShowToken(s => !s)}
                                    className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 transition text-gray-700 font-semibold">
                                    {showToken ? 'Hide' : 'Show'}
                                </button>
                                <button type="button" onClick={() => copy(token, 'token')}
                                    disabled={!token}
                                    className="text-xs px-3 py-1 bg-[#b27e02] text-white rounded hover:bg-[#8a6002] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                                    {copied === 'token' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <pre className="text-xs text-gray-800 font-mono break-all whitespace-pre-wrap max-w-full">{maskedToken}</pre>
                        <p className="text-xs text-gray-400 mt-2">Send as cookie header: <code className="bg-gray-200 px-1 py-0.5 rounded">Cookie: auth-token=&lt;token&gt;</code></p>
                    </div>

                    <ApiCurlBlock copied={copied} onCopy={copy} method="POST" color="bg-green-100 text-green-800"
                        title={`Create ${resourceName} (auto-add data)`} code={codeFor('post')} label="post" />
                    <ApiCurlBlock copied={copied} onCopy={copy} method="GET" color="bg-blue-100 text-blue-800"
                        title={`List All ${resourceName}s`} code={codeFor('getList')} label="getList" />
                    {itemId && (
                        <>
                            <ApiCurlBlock copied={copied} onCopy={copy} method="GET" color="bg-blue-100 text-blue-800"
                                title={`Fetch This ${resourceName}`} code={codeFor('getOne')} label="getOne" />
                            <ApiCurlBlock copied={copied} onCopy={copy} method="PUT" color="bg-yellow-100 text-yellow-800"
                                title={`Update This ${resourceName}`} code={codeFor('put')} label="put" />
                            {patchPayload && (
                                <ApiCurlBlock copied={copied} onCopy={copy} method="PATCH" color="bg-orange-100 text-orange-800"
                                    title={`Patch Field(s) on This ${resourceName}`} code={codeFor('patch')} label="patch" />
                            )}
                            <ApiCurlBlock copied={copied} onCopy={copy} method="DELETE" color="bg-red-100 text-red-800"
                                title={`Delete This ${resourceName}`} code={codeFor('delete')} label="delete" />
                        </>
                    )}

                    {format === 'json' && (
                        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4 text-xs text-purple-900">
                            <p className="font-bold mb-1">How to use in n8n</p>
                            <ol className="list-decimal pl-5 space-y-0.5">
                                <li>Open n8n → <strong>Workflows</strong> → <strong>+ New</strong>.</li>
                                <li>Click the <strong>⋯</strong> menu → <strong>Import from Clipboard</strong>.</li>
                                <li>Paste the copied JSON and click Import — an HTTP Request node will be pre-configured.</li>
                            </ol>
                        </div>
                    )}
                </>
            )}
        </div>
    );
});

export default ApiCurlPanel;
