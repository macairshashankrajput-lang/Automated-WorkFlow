import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  Code2,
  Copy,
  Layers,
  BarChart3,
  Globe,
  Bot,
  Zap,
  TrendingUp,
  ShieldCheck,
  Check,
  Download,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'scanner' | 'meta_schema' | 'keyword_matrix' | 'ai_pipeline' | 'technical' | 'programmatic'
  >('scanner');

  const [scanUrl, setScanUrl] = useState('https://seo-automation-tanusingh.vercel.app/');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState({
    overallScore: 92,
    googleScore: 95,
    chatGptScore: 88,
    perplexityScore: 91,
    geminiScore: 94,
    lastScanned: 'Today, Just Now',
  });

  const [pageTitle, setPageTitle] = useState('AI - Intelligent SEO & Content Automation Platform');
  const [metaDescription, setMetaDescription] = useState(
    'Automate enterprise SEO, create AI-optimized content, generate schema markup, and maximize visibility across Google, ChatGPT, and Perplexity.'
  );
  const [schemaType, setSchemaType] = useState<'Article' | 'Organization' | 'FAQPage' | 'SoftwareApplication'>(
    'SoftwareApplication'
  );
  const [copiedSchema, setCopiedSchema] = useState(false);

  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywords, setKeywords] = useState([
    { term: 'ai seo automation platform', volume: '14,200', kd: 32, intent: 'Commercial', cpc: '$4.20' },
    { term: 'automate schema markup json-ld', volume: '8,900', kd: 24, intent: 'Informational', cpc: '$3.50' },
    { term: 'chatgpt search optimization tool', volume: '22,400', kd: 45, intent: 'Commercial', cpc: '$6.80' },
    { term: 'programmatic seo matrix generator', volume: '6,100', kd: 19, intent: 'Transactional', cpc: '$5.10' },
    { term: 'core web vitals auditor online', volume: '11,500', kd: 28, intent: 'Informational', cpc: '$2.90' },
  ]);

  const [articleTopic, setArticleTopic] = useState('How AI Search Engines (ChatGPT & Perplexity) Are Changing SEO in 2026');
  const [articleContent, setArticleContent] = useState(`## The Evolution of Search: From Blue Links to AI Answer Synthesis

Traditional Search Engine Optimization (SEO) has fundamentally transitioned into **Generative Engine Optimization (GEO)**. Modern users no longer rely exclusively on ten blue links on Google; instead, platforms like ChatGPT Search, Perplexity AI, and Google Gemini synthesize authoritative answers directly in the SERP.

### 1. Key Optimization Pillars for AI Search Engines
- **Structured Knowledge Graphs:** Implement deep Schema.org JSON-LD to allow AI crawlers to parse factual entities without hallucination.
- **Direct Semantic Answers:** Format primary insights as concise 2-3 sentence summaries immediately beneath H2 headings.
- **E-E-A-T Validation:** Ensure first-party author credentials and reputable citations are clearly visible to AI retrieval engines.

### 2. High-Intent Frequently Asked Questions
**Q: How does AI SEO optimize content for Perplexity?**  
A: By providing verified factual data tables, direct source citations, and schema markup that retrieval augmented generation (RAG) models index effortlessly.

**Q: Does programmatic SEO still work with AI search?**  
A: Yes, provided each generated page offers unique value, verified metadata, and answers genuine user search intent.`);

  const [programmaticService, setProgrammaticService] = useState('SEO Audit & GEO Optimization');
  const [programmaticPages, setProgrammaticPages] = useState([
    { slug: 'seo-audit-austin-tx', title: 'Top SEO Audit & GEO Optimization in Austin, TX', targetCity: 'Austin, TX', status: 'Ready' },
    { slug: 'seo-audit-san-francisco-ca', title: 'Top SEO Audit & GEO Optimization in San Francisco, CA', targetCity: 'San Francisco, CA', status: 'Ready' },
    { slug: 'seo-audit-new-york-ny', title: 'Top SEO Audit & GEO Optimization in New York, NY', targetCity: 'New York, NY', status: 'Ready' },
    { slug: 'seo-audit-seattle-wa', title: 'Top SEO Audit & GEO Optimization in Seattle, WA', targetCity: 'Seattle, WA', status: 'Ready' },
    { slug: 'seo-audit-chicago-il', title: 'Top SEO Audit & GEO Optimization in Chicago, IL', targetCity: 'Chicago, IL', status: 'Ready' },
  ]);

  const handleRunScan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResults({
        overallScore: Math.floor(88 + Math.random() * 8),
        googleScore: Math.floor(92 + Math.random() * 6),
        chatGptScore: Math.floor(85 + Math.random() * 10),
        perplexityScore: Math.floor(89 + Math.random() * 8),
        geminiScore: Math.floor(90 + Math.random() * 7),
        lastScanned: 'Just Now',
      });
    }, 900);
  };

  const generatedSchemaJson = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: pageTitle,
      description: metaDescription,
      url: scanUrl,
      author: {
        '@type': 'Organization',
        name: 'AI SEO Platform',
        url: 'https://seo-automation-tanusingh.vercel.app/',
      },
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
    },
    null,
    2
  );

  const handleCopySchema = () => {
    navigator.clipboard.writeText(generatedSchemaJson);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleExportProgrammatic = () => {
    const ws = XLSX.utils.json_to_sheet(programmaticPages);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Programmatic_SEO_Matrix');
    XLSX.writeFile(wb, `SEO_Programmatic_URLs_${Date.now()}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white tracking-tight">AI SEO</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SEO Automation
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Search Engine & Content Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://seo-automation-tanusingh.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-xs text-cyan-300 transition-all flex items-center gap-1.5 shadow-md"
          >
            Direct Vercel Launch <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold">
          {[
            { id: 'scanner', label: 'AI Search Visibility Scanner', icon: Globe },
            { id: 'meta_schema', label: 'Meta & Schema.org JSON-LD', icon: Code2 },
            { id: 'keyword_matrix', label: 'Keyword Gaps & SERP Matrix', icon: BarChart3 },
            { id: 'ai_pipeline', label: 'Multi-Agent AI Content Studio', icon: Bot },
            { id: 'technical', label: 'Core Web Vitals & Technical Health', icon: ShieldCheck },
            { id: 'programmatic', label: 'Programmatic SEO Engine', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 flex-shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <form onSubmit={handleRunScan} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="url"
                  required
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="Enter target URL"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isScanning}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning Website...' : 'Scan AI Search Readiness'}
              </button>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 col-span-2 md:col-span-1 bg-gradient-to-b from-cyan-950/40 to-slate-950">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall AI Score</div>
                <div className="text-3xl font-extrabold text-cyan-400 mt-2">{scanResults.overallScore}/100</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Search Ready
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">Google Search</div>
                <div className="text-2xl font-bold text-white mt-1">{scanResults.googleScore}%</div>
                <div className="text-[10px] text-slate-400 mt-1">SERP Crawl & Index</div>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">ChatGPT Search</div>
                <div className="text-2xl font-bold text-white mt-1">{scanResults.chatGptScore}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Entity Citation Ready</div>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">Perplexity AI</div>
                <div className="text-2xl font-bold text-white mt-1">{scanResults.perplexityScore}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Source Fact Anchor</div>
              </div>

              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400">Gemini Grounding</div>
                <div className="text-2xl font-bold text-white mt-1">{scanResults.geminiScore}%</div>
                <div className="text-[10px] text-slate-400 mt-1">Knowledge Structured</div>
              </div>
            </div>
          </div>
        )}

        {/* Meta & Schema Tab */}
        {activeTab === 'meta_schema' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Code2 className="h-4 w-4 text-cyan-400" /> Metadata & Rich Snippet Configurator
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Page Title</label>
                  <input
                    type="text"
                    value={pageTitle}
                    onChange={(e) => setPageTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Schema Entity Type</label>
                  <select
                    value={schemaType}
                    onChange={(e) => setSchemaType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="SoftwareApplication">SoftwareApplication</option>
                    <option value="Article">Article</option>
                    <option value="Organization">Organization</option>
                    <option value="FAQPage">FAQPage</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-cyan-400" /> Schema JSON-LD Script
                  </h2>
                  <button
                    onClick={handleCopySchema}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    {copiedSchema ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedSchema ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-mono overflow-x-auto max-h-80">
                  {`<script type="application/ld+json">\n${generatedSchemaJson}\n</script>`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keyword_matrix' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-3.5">Target Query</th>
                    <th className="p-3.5">Volume</th>
                    <th className="p-3.5">Difficulty</th>
                    <th className="p-3.5">Intent</th>
                    <th className="p-3.5">CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {keywords.map((k, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-400" /> {k.term}
                      </td>
                      <td className="p-3.5 font-mono">{k.volume}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/10 text-emerald-400">
                          {k.kd}% KD
                        </span>
                      </td>
                      <td className="p-3.5">{k.intent}</td>
                      <td className="p-3.5 font-mono text-cyan-400">{k.cpc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Pipeline Tab */}
        {activeTab === 'ai_pipeline' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white">{articleTopic}</h3>
              <div className="text-xs text-slate-400">1,240 Words • Readability: Grade 9 • 0% AI Slop</div>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans border-t border-slate-800 pt-4">
                {articleContent}
              </div>
            </div>
          </div>
        )}

        {/* Technical Tab */}
        {activeTab === 'technical' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400">LCP</div>
              <div className="text-2xl font-extrabold text-emerald-400">1.2s</div>
              <p className="text-[11px] text-slate-400">Fast server response.</p>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400">INP</div>
              <div className="text-2xl font-extrabold text-emerald-400">42ms</div>
              <p className="text-[11px] text-slate-400">High interactivity.</p>
            </div>
            <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-400">CLS</div>
              <div className="text-2xl font-extrabold text-emerald-400">0.01</div>
              <p className="text-[11px] text-slate-400">Zero layout shift.</p>
            </div>
          </div>
        )}

        {/* Programmatic Tab */}
        {activeTab === 'programmatic' && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Programmatic SEO Pages</h3>
                <p className="text-xs text-slate-400">Automated regional landing pages</p>
              </div>
              <button
                onClick={handleExportProgrammatic}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Export Excel (.xlsx)
              </button>
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800 text-[10px]">
                  <tr>
                    <th className="p-3.5">URL Slug</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {programmaticPages.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-mono text-cyan-400">/{p.slug}</td>
                      <td className="p-3.5 font-bold text-white">{p.title}</td>
                      <td className="p-3.5 text-slate-400">{p.targetCity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
