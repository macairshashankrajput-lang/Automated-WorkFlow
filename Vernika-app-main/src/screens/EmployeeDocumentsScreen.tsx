import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  Award,
  Send,
  Download,
  Printer,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  UserCheck,
  Calendar,
  DollarSign,
  ShieldCheck,
  Share2,
  Mail,
  Search,
  Filter,
  Sparkles,
  QrCode,
  FileSignature,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { EmployeeDocumentRecord } from '../types';
import { generateWorkspaceDocument } from '../lib/firebase';

export const EmployeeDocumentsScreen: React.FC = () => {
  const {
    employees,
    employeeDocuments,
    createEmployeeDocument,
    deleteEmployeeDocument,
    shareEmployeeDocument
  } = useApp();
  const { role, user } = useAuth();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    employeeDocuments[0]?.id || null
  );
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [shareEmailModalDoc, setShareEmailModalDoc] = useState<EmployeeDocumentRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSentAlert, setEmailSentAlert] = useState(false);
  const [workspaceGeneration, setWorkspaceGeneration] = useState<{ status: 'idle' | 'working' | 'success' | 'error'; message: string; url?: string }>({ status: 'idle', message: '' });

  // New Document Generator State
  const [newDocData, setNewDocData] = useState({
    employeeId: employees[0]?.firebaseUid || employees[0]?.id || '',
    documentType: 'id_card' as EmployeeDocumentRecord['documentType'],
    title: 'Executive Digital Corporate ID Badge',
    bloodGroup: 'O+',
    emergencyContact: '+1 (555) 019-2831',
    annualCTC: '$120,000',
    joiningDate: '2024-03-01',
    reportingManager: 'Shashank Rajput (CTO)',
    tenureStart: '2023-01-15',
    tenureEnd: 'Present',
    signatoryName: 'Shashank Rajput, Chief Technology Officer'
  });

  const selectedDoc = employeeDocuments.find((d) => d.id === selectedDocId) || employeeDocuments[0];

  const filteredDocs = employeeDocuments.filter((doc) => {
    const docTypeStr = doc.documentType || doc.docType || '';
    const matchesSearch = doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          docTypeStr.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = docTypeFilter === 'all' || doc.documentType === docTypeFilter || doc.docType === docTypeFilter;
    const matchesRole = role === 'admin' ? true : (doc.employeeId === user?.id || doc.employeeName === user?.name);
    return matchesSearch && matchesType && matchesRole;
  });

  const handleGenerateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === newDocData.employeeId) || employees[0];
    
    let defaultTitle = 'Official Document';
    if (newDocData.documentType === 'id_card') defaultTitle = `Corporate ID Badge - ${emp.name}`;
    if (newDocData.documentType === 'offer_letter') defaultTitle = `Employment Offer Letter - ${emp.name}`;
    if (newDocData.documentType === 'experience_letter') defaultTitle = `Experience & Service Certificate - ${emp.name}`;
    if (newDocData.documentType === 'promotion_letter') defaultTitle = `Promotion & Grade Revision Order - ${emp.name}`;
    if (newDocData.documentType === 'relieving_letter') defaultTitle = `Official Relieving & Clearance Letter - ${emp.name}`;

    const docId = await createEmployeeDocument({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      position: emp.position,
      documentType: newDocData.documentType,
      title: defaultTitle,
      status: 'Issued',
      data: {
        bloodGroup: newDocData.bloodGroup,
        emergencyContact: newDocData.emergencyContact,
        annualCTC: newDocData.annualCTC,
        joiningDate: newDocData.joiningDate,
        reportingManager: newDocData.reportingManager,
        tenureStart: newDocData.tenureStart,
        tenureEnd: newDocData.tenureEnd,
        signatoryName: newDocData.signatoryName,
        badgeNumber: `VNK-${emp.id.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        accessLevel: 'Tier 4 - Standard Enterprise Facilities',
        validUntil: '2028-12-31'
      }
    });

    setSelectedDocId(docId);
    setIsCreatingDoc(false);
  };

  const handleSendEmail = async () => {
    if (!shareEmailModalDoc || !recipientEmail) return;
    await shareEmployeeDocument(shareEmailModalDoc.id, recipientEmail);
    setEmailSentAlert(true);
    setShareEmailModalDoc(null);
    setRecipientEmail('');
    setTimeout(() => setEmailSentAlert(false), 4000);
  };

  const handleGenerateWorkspaceDocument = async () => {
    if (!selectedDoc || role !== 'admin') return;
    const rawType = String(selectedDoc.documentType || selectedDoc.docType || '').toLowerCase().replace(/\s+/g, '_');
    const documentType = rawType.includes('offer') ? 'offer_letter' : rawType.includes('experience') ? 'experience_letter' : rawType.includes('reliev') ? 'relieving_letter' : rawType.includes('salary') || rawType.includes('payslip') ? 'payslip' : rawType.includes('promotion') ? 'promotion_letter' : '';
    if (!documentType) {
      setWorkspaceGeneration({ status: 'error', message: 'This document type does not have a Google Docs template yet.' });
      return;
    }
    const employee = employees.find((item) => item.id === selectedDoc.employeeId || item.firebaseUid === selectedDoc.employeeId);
    setWorkspaceGeneration({ status: 'working', message: 'Generating secure Google Doc…' });
    try {
      const result = await generateWorkspaceDocument({
        documentType,
        title: selectedDoc.title,
        employeeName: selectedDoc.employeeName,
        mergeData: {
          employee_name: selectedDoc.employeeName,
          employee_email: employee?.email || '',
          employee_id: selectedDoc.employeeId,
          department: selectedDoc.department || employee?.department || '',
          position: selectedDoc.position || employee?.position || '',
          issue_date: selectedDoc.issueDate,
          ...(selectedDoc.data || {}),
          signatory_name: selectedDoc.data?.signatoryName || user?.name || 'Vernika Administrator',
        },
      });
      setWorkspaceGeneration({ status: 'success', message: 'Google Doc generated in the private Admin Drive.', url: result.webViewLink });
      window.open(result.webViewLink, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setWorkspaceGeneration({ status: 'error', message: error instanceof Error ? error.message : 'Google Doc generation failed.' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100" id="employee-documents-screen">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Official Employee Document & Credential Generator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                PDF & Badge Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Issue tamper-evident Digital ID Badges, Appointment Letters, Experience Certificates, and Share via Outlook Mail.
            </p>
          </div>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => setIsCreatingDoc(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate New Document</span>
          </button>
        )}
      </div>

      {emailSentAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Document dispatched via Outlook Mail system with verified certificate attachments!
        </div>
      )}

      {/* Main Grid: Document Library List on Left + Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Document Catalog & Filters */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Issued Documents ({filteredDocs.length})
              </h3>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff, document type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={docTypeFilter}
                  onChange={(e) => setDocTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Document Types</option>
                  <option value="id_card">Digital ID Badges</option>
                  <option value="offer_letter">Offer & Appointment</option>
                  <option value="experience_letter">Experience & Service</option>
                  <option value="promotion_letter">Promotion Orders</option>
                  <option value="relieving_letter">Relieving Clearance</option>
                </select>
              </div>
            </div>

            {/* Document List */}
            <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No documents found matching criteria.
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = doc.id === selectedDoc?.id;
                  const emp = employees.find((e) => e.id === doc.employeeId);

                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300 dark:hover:border-emerald-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        (doc.documentType || doc.docType) === 'id_card'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
                      }`}>
                        {(doc.documentType || doc.docType) === 'id_card' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                            {doc.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {doc.employeeName} • {doc.issueDate}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {(doc.documentType || doc.docType || 'DOCUMENT').replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview Panel */}
        <div className="lg:col-span-8 space-y-4">
          {selectedDoc ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Document Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedDoc.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Doc ID: <span className="font-mono">{selectedDoc.id}</span> • Issued: {selectedDoc.issueDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShareEmailModalDoc(selectedDoc);
                      const emp = employees.find((e) => e.id === selectedDoc.employeeId);
                      setRecipientEmail(emp?.email || '');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Mail</span>
                  </button>

                  {role === 'admin' && selectedDoc.documentType !== 'id_card' && (
                    <button
                      onClick={handleGenerateWorkspaceDocument}
                      disabled={workspaceGeneration.status === 'working'}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>{workspaceGeneration.status === 'working' ? 'Generating…' : 'Create Google Doc'}</span>
                    </button>
                  )}

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>

                  {role === 'admin' && (
                    <button
                      onClick={() => deleteEmployeeDocument(selectedDoc.id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {workspaceGeneration.status !== 'idle' && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${workspaceGeneration.status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : workspaceGeneration.status === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-3"><span>{workspaceGeneration.message}</span>{workspaceGeneration.url && <a href={workspaceGeneration.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 underline"><ExternalLink className="w-3 h-3" /> Open</a>}</div>
                </div>
              )}

              {/* RENDER VIEW 1: Digital Corporate ID Card Badge */}
              {selectedDoc.documentType === 'id_card' ? (
                <div className="flex justify-center p-4">
                  <div className="w-full max-w-sm rounded-3xl bg-linear-to-b from-slate-900 via-slate-900 to-indigo-950 text-white p-6 shadow-2xl border border-indigo-500/30 relative overflow-hidden space-y-5">
                    {/* Badge Header with Holographic Stripe */}
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-sm">
                          V
                        </div>
                        <div>
                          <h4 className="text-xs font-black tracking-wider uppercase">Vernika Cloud</h4>
                          <p className="text-[9px] text-indigo-300 font-semibold tracking-widest uppercase">Enterprise Security</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        {selectedDoc.data?.accessLevel || 'Tier 5 Access'}
                      </span>
                    </div>

                    {/* Employee Photo & Core Details */}
                    <div className="flex items-center gap-4">
                      {(() => {
                        const emp = employees.find((e) => e.id === selectedDoc.employeeId);
                        return (
                          <img
                            src={emp?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                            alt={selectedDoc.employeeName}
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400 shadow-md"
                          />
                        );
                      })()}
                      <div className="min-w-0">
                        <h3 className="text-base font-black truncate">{selectedDoc.employeeName}</h3>
                        <p className="text-xs text-indigo-300 font-semibold truncate">{selectedDoc.position}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{selectedDoc.department}</p>
                      </div>
                    </div>

                    {/* Badge Details Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-500/20 text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Badge No.</span>
                        <p className="font-mono font-bold text-white">{selectedDoc.data?.badgeNumber || 'VNK-EXEC-001'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Blood Group</span>
                        <p className="font-bold text-emerald-400">{selectedDoc.data?.bloodGroup || 'O+'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Issue Date</span>
                        <p className="text-slate-300">{selectedDoc.issueDate}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Valid Thru</span>
                        <p className="text-slate-300">{selectedDoc.data?.validUntil || '2028-12-31'}</p>
                      </div>
                    </div>

                    {/* Barcode & Security Hologram Footer */}
                    <div className="pt-3 border-t border-indigo-500/20 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="h-6 flex items-center gap-0.5">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-full ${i % 3 === 0 ? 'w-1 bg-white' : i % 2 === 0 ? 'w-0.5 bg-indigo-300' : 'w-1.5 bg-white'}`}
                            />
                          ))}
                        </div>
                        <p className="text-[8px] font-mono text-slate-400 tracking-widest">VERNIKA-AUTH-SECURE</p>
                      </div>

                      <div className="p-1.5 rounded-xl bg-white text-slate-900 shadow-xs">
                        <QrCode className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* RENDER VIEW 2: Official Enterprise Letterhead Document (Offer / Experience / Relieving) */
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-6 shadow-md font-serif">
                  {/* Corporate Letterhead */}
                  <div className="flex items-center justify-between border-b-2 border-slate-800 dark:border-slate-200 pb-4 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                        V
                      </div>
                      <div>
                        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">VERNIKA CLOUD ENTERPRISE INC.</h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">100 Enterprise Way, Suite 800, Silicon Tower • hr@vernika.io</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">Ref: {selectedDoc.id}</p>
                      <p className="text-slate-500">Date: {selectedDoc.issueDate}</p>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="text-center font-sans py-2">
                    <h3 className="text-lg font-black tracking-wide uppercase text-slate-900 dark:text-white underline underline-offset-8 decoration-indigo-500">
                      {selectedDoc.title}
                    </h3>
                  </div>

                  {/* Recipient Addressee */}
                  <div className="space-y-1 text-xs font-sans">
                    <p className="font-bold text-slate-900 dark:text-white">To,</p>
                    <p className="font-bold">{selectedDoc.employeeName}</p>
                    <p className="text-slate-600 dark:text-slate-400">{selectedDoc.position}</p>
                    <p className="text-slate-600 dark:text-slate-400">{selectedDoc.department}</p>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4 text-xs leading-relaxed font-sans text-slate-700 dark:text-slate-300">
                    {selectedDoc.documentType === 'offer_letter' ? (
                      <>
                        <p>
                          Dear <strong>{selectedDoc.employeeName}</strong>,
                        </p>
                        <p>
                          On behalf of Vernika Cloud Enterprise Inc., we are pleased to offer you the position of{' '}
                          <strong>{selectedDoc.position}</strong> in the <strong>{selectedDoc.department}</strong> department.
                        </p>
                        <p>
                          Your gross annualized compensation (CTC) will be{' '}
                          <strong>{selectedDoc.data?.annualCTC || '$114,000'}</strong> per annum, subject to statutory deductions.
                          Your scheduled joining date is <strong>{selectedDoc.data?.joiningDate || 'Immediate'}</strong>, reporting to{' '}
                          <strong>{selectedDoc.data?.reportingManager || 'Engineering Leadership'}</strong>.
                        </p>
                        <p>
                          You will be on probation for a period of 3 months from the date of joining, post which your employment will be confirmed based on performance adherence.
                        </p>
                      </>
                    ) : selectedDoc.documentType === 'experience_letter' ? (
                      <>
                        <p>
                          <strong>TO WHOMSOEVER IT MAY CONCERN</strong>
                        </p>
                        <p>
                          This is to certify that <strong>{selectedDoc.employeeName}</strong> has been employed with Vernika Cloud Enterprise Inc. from{' '}
                          <strong>{selectedDoc.data?.tenureStart || '2023-01-15'}</strong> to <strong>{selectedDoc.data?.tenureEnd || 'Present'}</strong>.
                        </p>
                        <p>
                          During their tenure as <strong>{selectedDoc.position}</strong> in the <strong>{selectedDoc.department}</strong>, they demonstrated exceptional professionalism, technical proficiency, and dedication to enterprise quality standards.
                        </p>
                        <p>
                          We wish them continued success in all their future professional endeavors.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Dear <strong>{selectedDoc.employeeName}</strong>,
                        </p>
                        <p>
                          This official certificate validates your active credentials, position as <strong>{selectedDoc.position}</strong>, and standing within the <strong>{selectedDoc.department}</strong> department at Vernika Cloud Enterprise.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Signatory Section */}
                  <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-sans text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Authorized Signatory</p>
                      <div className="h-10 flex items-center">
                        <span className="font-serif italic font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                          {selectedDoc.data?.signatoryName || 'Shashank Rajput'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">Human Resources & Operations</p>
                      <p className="text-slate-500 text-[10px]">Vernika Cloud Enterprise Inc.</p>
                    </div>

                    <div className="text-right">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center text-[9px] font-bold text-indigo-600 uppercase tracking-widest text-center">
                        Official<br />Seal
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              Select or generate a document to preview.
            </div>
          )}
        </div>
      </div>

      {/* GENERATE DOCUMENT MODAL */}
      {isCreatingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Generate Official Employee Document
              </h3>
              <button
                onClick={() => setIsCreatingDoc(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDocument} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Employee</label>
                <select
                  value={newDocData.employeeId}
                  onChange={(e) => setNewDocData({ ...newDocData, employeeId: e.target.value })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Type</label>
                <select
                  value={newDocData.documentType}
                  onChange={(e) => setNewDocData({ ...newDocData, documentType: e.target.value as any })}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="id_card">Digital Corporate ID Card Badge</option>
                  <option value="offer_letter">Official Employment Offer & Appointment Letter</option>
                  <option value="experience_letter">Certificate of Experience & Service</option>
                  <option value="promotion_letter">Promotion & Salary Revision Order</option>
                  <option value="relieving_letter">Relieving & Full Clearance Certificate</option>
                  <option value="payslip">Confidential Payslip</option>
                </select>
              </div>

              {newDocData.documentType === 'id_card' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Blood Group</label>
                    <input
                      type="text"
                      value={newDocData.bloodGroup}
                      onChange={(e) => setNewDocData({ ...newDocData, bloodGroup: e.target.value })}
                      placeholder="e.g. O+, A+, B+"
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency Phone</label>
                    <input
                      type="text"
                      value={newDocData.emergencyContact}
                      onChange={(e) => setNewDocData({ ...newDocData, emergencyContact: e.target.value })}
                      placeholder="+1 (555) 019-2831"
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Annual CTC / Salary</label>
                    <input
                      type="text"
                      value={newDocData.annualCTC}
                      onChange={(e) => setNewDocData({ ...newDocData, annualCTC: e.target.value })}
                      placeholder="$120,000"
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Signatory Authority</label>
                    <input
                      type="text"
                      value={newDocData.signatoryName}
                      onChange={(e) => setNewDocData({ ...newDocData, signatoryName: e.target.value })}
                      placeholder="Shashank Rajput (CTO)"
                      className="w-full mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingDoc(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Generate & Issue Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE VIA OUTLOOK MAIL MODAL */}
      {shareEmailModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Dispatch Document via Outlook Mail
              </h3>
              <button
                onClick={() => setShareEmailModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              The official PDF document <strong>{shareEmailModalDoc.title}</strong> will be sent to the employee with digital verification references.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recipient Email Address</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="employee@vernika.io"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShareEmailModalDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Send Email Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
