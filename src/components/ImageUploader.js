'use client';

import { useState } from 'react';
import { MdCloudUpload, MdDelete, MdImage } from 'react-icons/md';

export default function ImageUploader({
    onUploadComplete,
    onUploadSuccess,
    folder = 'uploads',
    multiple = false,
    maxFiles = 5
}) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState([]);
    const [uploadedUrls, setUploadedUrls] = useState([]);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);

        if (files.length > maxFiles) {
            alert(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Create preview URLs
        const previews = files.map(file => ({
            url: URL.createObjectURL(file),
            name: file.name,
            file: file,
        }));

        setPreview(previews);

        // Auto-upload immediately after file selection
        await handleUpload(previews);
    };

    const handleUpload = async (previewFiles = preview) => {
        if (previewFiles.length === 0) {
            alert('Please select files first');
            return;
        }

        try {
            setUploading(true);

            console.log('[ImageUploader] Starting upload for', previewFiles.length, 'files');
            console.log('[ImageUploader] Folder:', folder);

            const formData = new FormData();
            previewFiles.forEach(item => {
                console.log('[ImageUploader] Adding file:', item.file.name, 'Size:', item.file.size);
                formData.append('files', item.file);
            });
            formData.append('folder', folder);

            console.log('[ImageUploader] Sending request to /api/upload');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            console.log('[ImageUploader] Response status:', response.status);

            const result = await response.json();
            console.log('[ImageUploader] Response data:', result);

            if (result.success) {
                setUploadedUrls(result.urls);

                // Call parent callback with URLs
                const callback = onUploadSuccess || onUploadComplete;
                if (callback) {
                    callback(multiple ? result.urls : result.urls[0]);
                }

                alert(`✅ ${result.count} file(s) uploaded successfully!`);
            } else {
                console.error('[ImageUploader] Upload failed:', result.error);
                alert('❌ Upload failed: ' + result.error);
            }
        } catch (error) {
            console.error('[ImageUploader] Upload error:', error);
            console.error('[ImageUploader] Error stack:', error.stack);
            alert('❌ Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const clearSelection = () => {
        setPreview([]);
        setUploadedUrls([]);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#b27e02] transition-colors">
                    <label className="cursor-pointer block">
                        <input
                            type="file"
                            accept="image/*"
                            multiple={multiple}
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={uploading}
                        />
                        <MdCloudUpload className="mx-auto text-6xl text-gray-400 mb-4" />
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            Click to select {multiple ? 'images' : 'an image'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {multiple ? `Up to ${maxFiles} files` : 'Single file'} • JPG, PNG, GIF
                        </p>
                    </label>
                </div>

                {/* Preview */}
                {preview.length > 0 && (
                    <div className="space-y-4">
                        {uploading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b27e02] mx-auto mb-4"></div>
                                    <p className="text-lg font-semibold text-gray-700">Uploading to cloud...</p>
                                    <p className="text-sm text-gray-500">Please wait</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {preview.map((item, idx) => (
                                    <div key={idx} className="relative group">
                                        <img
                                            src={item.url}
                                            alt={item.name}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded truncate">
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Uploaded URLs */}
                {uploadedUrls.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                            <MdImage />
                            Uploaded Successfully!
                        </h3>
                        <div className="space-y-2">
                            {uploadedUrls.map((url, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <img src={url} alt={`Upload ${idx + 1}`} className="w-16 h-16 object-cover rounded" />
                                    <input
                                        type="text"
                                        value={url}
                                        readOnly
                                        className="flex-1 text-sm bg-white border border-green-300 rounded px-3 py-2 font-mono"
                                        onClick={(e) => e.target.select()}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
