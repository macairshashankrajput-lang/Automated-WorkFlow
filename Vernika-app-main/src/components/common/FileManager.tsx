import React, { useRef, useState } from 'react';
import { FileText, Trash2, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAX_FILE_SIZE_BYTES = 700 * 1024;
const MAX_FILE_COUNT = 20;
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf', 'text/plain', 'text/csv', 'application/json', 'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

export const FileManager: React.FC = () => {
  const { globalFiles, uploadFile, deleteGlobalFile } = useApp();
  const [uploadError, setUploadError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    const incoming = Array.from(selectedFiles);
    const rejected = incoming.find((file) => file.size > MAX_FILE_SIZE_BYTES || !ALLOWED_FILE_TYPES.has(file.type));
    if (rejected) {
      setUploadError('Only PDF, Office, text, CSV, JSON, and common image files up to 700 KB are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (globalFiles.length + incoming.length > MAX_FILE_COUNT) {
      setUploadError(`You can store up to ${MAX_FILE_COUNT} shared files.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setBusy(true);
    setUploadError('');
    try {
      for (const file of incoming) await uploadFile(file, { category: 'shared_attachment' });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not upload the selected file.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${['B', 'KB', 'MB', 'GB'][i]}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />File Manager & Shared Attachments</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Shared through the workspace database and available across authorized devices.</p>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept=".pdf,.txt,.csv,.json,.docx,.xlsx,.pptx,image/png,image/jpeg,image/webp,image/gif" className="hidden" />
        <button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-purple-600/20"><Upload className="w-4 h-4" />{busy ? 'Uploading…' : 'Browse Device'}</button>
      </div>
      {uploadError && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300">{uploadError}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {globalFiles.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl"><Upload className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" /><p className="text-sm font-bold">No shared files uploaded</p><p className="text-xs mt-1">Upload an attachment to share it across authorized workspace sessions.</p></div>
        ) : globalFiles.map((file) => {
          const dataUrl = file.dataUrl || file.url || '#';
          const uploadedAt = file.uploadedAt || new Date().toISOString();
          return <div key={file.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col hover:border-purple-300 dark:hover:border-purple-800 transition-colors group shadow-xs">
            <div className="flex items-start justify-between mb-3"><div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">{String(file.type || '').startsWith('image/') ? <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}</div><button type="button" onClick={() => void deleteGlobalFile(file.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100" title="Delete shared file"><Trash2 className="w-3.5 h-3.5" /></button></div>
            <div className="flex-1"><p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2" title={file.name}>{file.name}</p><div className="flex items-center justify-between mt-2"><span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{formatSize(file.size)}</span><span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(uploadedAt).toLocaleDateString()}</span></div></div>
            {String(file.type || '').startsWith('image/') && <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50"><a href={dataUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors uppercase cursor-pointer"><span>View Image</span><ExternalLink className="w-3 h-3" /></a></div>}
          </div>;
        })}
      </div>
    </div>
  );
};
