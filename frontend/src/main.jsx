import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, BarChart3, BrainCircuit, CalendarClock, CheckCircle2, Download, FileText, Gauge, LockKeyhole, Mail, MapPin, Phone, Rocket, Send, UploadCloud, X, SearchCheck, Copy, Info, Trash2, Pencil, Save, RotateCcw, Eye, MousePointer2, ShieldAlert, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { API_BASE, apiGet, apiPost, apiPut, apiDelete, track } from './api';
import './styles.css';

const APP_VERSION = 'First Build v1.0.25';
const UPDATED_DATE = '21 June 2026';

const SERVICES = [
  { title: 'Consulting', icon: Gauge, body: 'Strategy, transformation, technology roadmaps, operating models and execution governance.', points: ['Digital transformation', 'Operating model design', 'Technology roadmaps'] },
  { title: 'Data & Insights', icon: BarChart3, body: 'Dashboards, KPI frameworks, analytics roadmaps and AI-ready data foundations.', points: ['Executive dashboards', 'Customer intelligence', 'Analytics roadmaps'] },
  { title: 'Innovation', icon: Rocket, body: 'Rapid prototypes, immersive experiences, emerging technology pilots and product incubation.', points: ['Proof-of-value builds', 'Experience centers', 'New product incubation'] },
  { title: 'AI Products & Platforms', icon: BrainCircuit, body: 'Agentic AI, automation platforms, digital trust systems and enterprise-grade applications.', points: ['Agentic AI systems', 'Biometric/QR trust systems', 'Enterprise platforms'] }
];

const METHOD_STEPS = [
  ['Discover', 'Understand the ambition, users, constraints and measurable outcomes.'],
  ['Define', 'Convert the opportunity into scope, KPIs and technology architecture.'],
  ['Design', 'Create UX journeys, content flows, data capture and interaction models.'],
  ['Build', 'Engineer the platform with lightweight frontend, Python backend, storage and analytics.'],
  ['Launch', 'Release content, whitepapers, posters and social campaigns on a controlled schedule.'],
  ['Measure', 'Track traffic, leads, downloads, source, interests and conversion outcomes.']
];

function App() {
  const [page, setPage] = useState('home');
  const [whitepapers, setWhitepapers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);

  async function refreshWhitepapers() { setWhitepapers(await apiGet('/api/whitepapers')); }
  function openContact() { setContactOpen(true); track('contact_dialog_open', { page }); }

  useEffect(() => { refreshWhitepapers().catch(console.error); track('page_view', { page: 'home' }); }, []);
  useEffect(() => { if (page) { window.scrollTo(0, 0); track('page_view', { page }); } }, [page]);
  useEffect(() => {
    const start = Date.now();
    const onClick = (e) => {
      const el = e.target?.closest?.('button,a,input,select,textarea,label');
      if (!el) return;
      const label = (el.innerText || el.getAttribute('aria-label') || el.name || el.placeholder || el.tagName || '').toString().replace(/\s+/g,' ').trim().slice(0,120);
      track('click', { page, click_target: label || el.tagName, element: el.tagName, class_name: el.className?.toString?.().slice(0,120) || '' });
    };
    const sendDuration = () => track('page_duration', { page, duration_ms: Date.now() - start });
    document.addEventListener('click', onClick, true);
    window.addEventListener('pagehide', sendDuration);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sendDuration(); });
    return () => { document.removeEventListener('click', onClick, true); window.removeEventListener('pagehide', sendDuration); sendDuration(); };
  }, [page]);

  return <div className="app-shell">
    <Header page={page} setPage={setPage} openContact={openContact}/>
    {page==='home' && <Home whitepapers={whitepapers} setPage={setPage} setSelected={setSelected} openContact={openContact}/>} 
    {page==='whitepapers' && <Whitepapers whitepapers={whitepapers} setSelected={setSelected}/>} 
    {page==='services' && <Services/>} 
    {page==='method' && <Method/>} 
    {page==='admin' && <Admin/>} 
    {selected && <LeadModal whitepaper={selected} onClose={()=>setSelected(null)}/>} 
    {contactOpen && <ContactDialog onClose={()=>setContactOpen(false)}/>} 
    <Footer setPage={setPage} openContact={openContact}/>
  </div>;
}

function Header({ page, setPage, openContact }) {
  const nav = [['home','Home'], ['services','Services'], ['whitepapers','Whitepapers'], ['method','Method'], ['admin','Admin']];
  return <header className="topbar">
    <button className="brand" onClick={()=>setPage('home')} aria-label="Go to homepage"><img src="/truflux-logo.png" alt="Truflux Technologies logo"/><span>TRUFLUX<br/>TECHNOLOGIES</span></button>
    <nav>{nav.map(([key,label])=><button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}>{label}</button>)}</nav>
    <button className="nav-cta" onClick={openContact}>Contact</button>
  </header>;
}

function Home({ whitepapers, setPage, setSelected, openContact }) {
  return <main>
    <section className="hero hero-clean">
      <div className="hero-copy">
        <p className="eyebrow">Consulting • Data & Insights • Innovation • AI Platforms</p>
        <h1>Strategy-led. Data-driven. AI-enabled. Outcome-focused.</h1>
        <p className="hero-text">Truflux Technologies helps organizations move from ambition to execution through consulting discipline, data intelligence, product engineering depth and emerging-technology implementation.</p>
        <div className="hero-actions">
          <button className="primary" onClick={()=>setPage('whitepapers')}>Explore Whitepapers <ArrowRight size={18}/></button>
          <button className="secondary" onClick={openContact}>Contact Truflux</button>
        </div>
        <div className="hero-proof-row">
          <span><CheckCircle2 size={16}/> Consulting discipline</span>
          <span><CheckCircle2 size={16}/> Data-led execution</span>
          <span><CheckCircle2 size={16}/> Product engineering depth</span>
        </div>
      </div>
      <div className="hero-logo-stage frameless">
        <img className="hero-logo-large" src="/truflux-logo.png" alt="Truflux 3D logo"/>
      </div>
    </section>

    <section className="services-grid-section" id="services">
      <div className="section-heading"><p className="eyebrow">Four integrated service lines</p><h2>One outcome-driven technology partner.</h2></div>
      <div className="services-grid">{SERVICES.map(s=><ServiceCard key={s.title} service={s}/>)}</div>
    </section>

    <FeaturedTrailer whitepapers={whitepapers} setSelected={setSelected} setPage={setPage}/>

    <section className="featured-whitepapers" id="whitepapers">
      <div className="section-heading row-heading">
        <div><p className="eyebrow">Gated insights engine</p><h2>Featured whitepapers</h2></div>
        <button className="secondary library-link" onClick={()=>setPage('whitepapers')}><FileText size={16}/> View Whitepaper Library</button>
      </div>
      <div className="whitepaper-grid">{whitepapers.slice(0,3).map(wp=><WhitepaperCard key={wp.id} wp={wp} onUnlock={()=>setSelected(wp)}/>)}</div>
    </section>

    <MethodPreview />
  </main>;
}

function FeaturedTrailer({ whitepapers, setSelected, setPage }) {
  const wp = whitepapers.find(w => w.trailer_url) || whitepapers[0];
  if (!wp) return null;
  return <section className="featured-trailer-section">
    <div className="trailer-copy">
      <p className="eyebrow">Featured insight trailer</p>
      <h2>{wp.trailer_url ? wp.title : 'Whitepaper trailer ready section'}</h2>
      <p>{wp.trailer_url ? (wp.summary || 'Watch the trailer and request access to the complete whitepaper.') : 'Upload a trailer video against any whitepaper from Admin. The featured trailer will appear here and stay linked to the whitepaper access flow.'}</p>
      <div className="trailer-actions">
        <button className="primary" onClick={()=>{ track('trailer_whitepaper_access_click',{whitepaper_id:wp.id,title:wp.title}); setSelected(wp); }}><LockKeyhole size={16}/> Request Whitepaper Access</button>
        <button className="secondary" onClick={()=>setPage('whitepapers')}><FileText size={16}/> View all whitepapers</button>
      </div>
    </div>
    <div className="trailer-player-card">
      {wp.trailer_url ? <video controls playsInline preload="metadata" poster={wp.poster_url || ''} src={`${API_BASE}${wp.trailer_url}`}></video> : <div className="trailer-placeholder"><FileText size={42}/><span>No trailer uploaded yet</span></div>}
      <div className="trailer-linked-note"><span>{wp.whitepaper_number || 'WP-0000'}</span><strong>Linked to whitepaper</strong></div>
    </div>
  </section>;
}

function Services() {
  return <main className="page-wrap page-top"><div className="section-heading wide"><p className="eyebrow">Services</p><h1>Consulting, data, innovation and AI platforms designed as one execution system.</h1><p>Each service line can stand alone, but the real strength of Truflux is the combination: strategy that becomes insight, insight that becomes design, and design that becomes a working platform.</p></div><div className="service-detail-grid">{SERVICES.map(service=><ServiceDetail key={service.title} service={service}/>)}</div></main>;
}
function ServiceCard({ service }) { const Icon=service.icon; return <article className="service-card"><div className="card-icon"><Icon size={24}/></div><h3>{service.title}</h3><p>{service.body}</p><ul>{service.points.map(p=><li key={p}>{p}</li>)}</ul></article>; }
function ServiceDetail({ service }) { const Icon=service.icon; return <article className="service-detail"><div className="card-icon"><Icon size={28}/></div><h2>{service.title}</h2><p>{service.body}</p><div className="pill-list">{service.points.map(p=><span key={p}>{p}</span>)}</div></article>; }

function Whitepapers({ whitepapers, setSelected }) { return <main className="page-wrap page-top"><div className="section-heading wide"><p className="eyebrow">Whitepapers</p><h1>Insight-led content that helps qualify audience interest.</h1><p>Visitors unlock whitepapers by sharing their business profile, area of interest, timeline and consent. Admin can view leads, downloads and campaign source data.</p></div><div className="whitepaper-grid">{whitepapers.map(wp=><WhitepaperCard key={wp.id} wp={wp} onUnlock={()=>setSelected(wp)}/>)}</div></main>; }
function WhitepaperCard({ wp, onUnlock }) { return <article className="whitepaper-card gradient-tile clean-paper-tile"><div className="tile-glow" aria-hidden="true"></div><div className="whitepaper-topline gradient-topline"><span className="report-tag">{wp.whitepaper_number || 'Whitepaper'}</span><span className="category soft">{wp.category}</span></div>{wp.trailer_url&&<div className="trailer-chip">Trailer available</div>}<div className="tile-content"><div className="tile-mark simple-doc-mark"><FileText size={30}/></div><h3>{wp.title}</h3><p>{wp.summary}</p></div><button className="tile-access clean-access" onClick={()=>{track('whitepaper_download_start',{whitepaper_id:wp.id,title:wp.title}); onUnlock();}}><span><LockKeyhole size={15}/> Request Access</span></button></article>; }

function LeadModal({ whitepaper, onClose }) {
  const [form,setForm] = useState({name:'',email:'',mobile:'',company:'',designation:'',industry:'',location:'',linkedin_profile:'',interest_area:whitepaper.category||'',business_challenge:'',timeline:'Exploring',consent:false,newsletter:true});
  const [downloadUrl,setDownloadUrl] = useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  function update(k,v){setForm(prev=>({...prev,[k]:v}));}
  async function submit(e){e.preventDefault();setError('');setLoading(true);try{const payload={...form,whitepaper_id:whitepaper.id,source:'website',utm:window.location.search,referrer:document.referrer,device:navigator.userAgent}; const data=await apiPost('/api/leads',payload); setDownloadUrl(data.download_url); track('whitepaper_lead_unlock_success',{whitepaper_id:whitepaper.id});}catch(e){setError('Could not unlock whitepaper. Please check required fields and consent.');}finally{setLoading(false);}}
  return <div className="modal-backdrop"><div className="lead-modal"><button className="close" onClick={onClose}>×</button><div className="modal-title"><span className="category">Gated Whitepaper</span><h2>{whitepaper.title}</h2><p>{whitepaper.summary}</p></div>{!downloadUrl ? <form onSubmit={submit} className="lead-form"><div className="form-grid"><Input label="Full Name" value={form.name} onChange={v=>update('name',v)} required/><Input label="Business Email" type="email" value={form.email} onChange={v=>update('email',v)} required/><Input label="Mobile" value={form.mobile} onChange={v=>update('mobile',v)}/><Input label="Company / Organization" value={form.company} onChange={v=>update('company',v)}/><Input label="Designation" value={form.designation} onChange={v=>update('designation',v)}/><Input label="Industry" value={form.industry} onChange={v=>update('industry',v)}/><Input label="Location" value={form.location} onChange={v=>update('location',v)}/><Input label="LinkedIn Profile" value={form.linkedin_profile} onChange={v=>update('linkedin_profile',v)}/><Input label="Area of Interest" value={form.interest_area} onChange={v=>update('interest_area',v)}/><label className="field"><span>Timeline</span><select value={form.timeline} onChange={e=>update('timeline',e.target.value)}><option>Immediate</option><option>3 months</option><option>6 months</option><option>Exploring</option></select></label></div><label className="field"><span>Business Challenge / Use Case</span><textarea value={form.business_challenge} onChange={e=>update('business_challenge',e.target.value)} placeholder="What are you trying to solve?"/></label><label className="checkline"><input type="checkbox" checked={form.consent} onChange={e=>update('consent',e.target.checked)} required/> I consent to Truflux Technologies storing my details and contacting me about relevant insights and services.</label><label className="checkline"><input type="checkbox" checked={form.newsletter} onChange={e=>update('newsletter',e.target.checked)}/> Subscribe me to Truflux insights and updates.</label>{error&&<p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading?'Unlocking...':'Unlock Whitepaper'}</button></form> : <div className="success-panel"><CheckCircle2 size={52}/><h2>Whitepaper unlocked</h2><p>Your access has been created. The admin dashboard now contains the captured audience profile.</p><a className="primary link-button" href={downloadUrl} target="_blank" rel="noreferrer"><Download size={18}/> Download PDF</a></div>}</div></div>;
}

function ContactDialog({ onClose }) {
  const [form,setForm] = useState({name:'',email:'',mobile:'',company:'',designation:'',industry:'',interest_area:'',message:'',consent:false});
  const [status,setStatus]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  function update(k,v){setForm(prev=>({...prev,[k]:v}));}
  async function submit(e){e.preventDefault();setStatus('');setError('');setLoading(true);try{await apiPost('/api/contact',{...form,source:'contact_dialog',utm:window.location.search,referrer:document.referrer,device:navigator.userAgent});setStatus('Thank you. Your enquiry has been captured in the Truflux admin dashboard.');track('contact_dialog_submit',{interest_area:form.interest_area});setForm({name:'',email:'',mobile:'',company:'',designation:'',industry:'',interest_area:'',message:'',consent:false});}catch(e){setError('Could not submit the form. Please check the required fields and consent.');}finally{setLoading(false);}}
  return <div className="modal-backdrop"><div className="lead-modal contact-dialog"><button className="close" onClick={onClose}><X size={20}/></button><div className="contact-dialog-grid"><div className="contact-dialog-intro"><span className="category">Contact Truflux</span><h2>Start a conversation with Truflux Technologies.</h2><p>Share your business context, interest area and contact details. The enquiry is saved in the admin dashboard for follow-up.</p><div className="contact-line"><Mail size={18}/><span>info@trufluxtech.com</span></div><div className="contact-line"><Phone size={18}/><span>Phone / mobile can be configured in the production website.</span></div><div className="contact-line"><MapPin size={18}/><span>Bengaluru, Karnataka, India</span></div></div><form className="lead-form contact-form" onSubmit={submit}><div className="form-grid"><Input label="Full Name" value={form.name} onChange={v=>update('name',v)} required/><Input label="Business Email" type="email" value={form.email} onChange={v=>update('email',v)} required/><Input label="Mobile" value={form.mobile} onChange={v=>update('mobile',v)}/><Input label="Company / Organization" value={form.company} onChange={v=>update('company',v)}/><Input label="Designation" value={form.designation} onChange={v=>update('designation',v)}/><Input label="Industry" value={form.industry} onChange={v=>update('industry',v)}/></div><label className="field"><span>Interest Area</span><select value={form.interest_area} onChange={e=>update('interest_area',e.target.value)}><option value="">Select area</option><option>Consulting</option><option>Data and Insights</option><option>Innovation</option><option>AI Products and Platforms</option><option>Whitepapers</option><option>Partnership</option></select></label><label className="field"><span>Message *</span><textarea required value={form.message} onChange={e=>update('message',e.target.value)} placeholder="Tell us what you are planning or exploring."/></label><label className="checkline"><input type="checkbox" checked={form.consent} onChange={e=>update('consent',e.target.checked)} required/> I consent to Truflux Technologies storing my details and contacting me.</label>{status&&<p className="notice">{status}</p>}{error&&<p className="error">{error}</p>}<button className="primary" disabled={loading}><Send size={17}/>{loading?'Submitting...':'Submit Enquiry'}</button></form></div></div></div>;
}

function Input({ label, value, onChange, type='text', required=false }){return <label className="field"><span>{label}{required?' *':''}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} required={required}/></label>}

function MethodPreview(){return <section className="method-showcase"><div className="section-heading"><p className="eyebrow">The Truflux Method</p><h2>A practical execution path from idea to measurable platform.</h2></div><div className="method-board compact">{METHOD_STEPS.map(([title,body],idx)=><article key={title} className="method-card"><span className="method-index">{String(idx+1).padStart(2,'0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>}

function Method() { return <main className="page-wrap page-top"><div className="section-heading wide"><p className="eyebrow">The Truflux Method</p><h1>From strategy to insight. From insight to platform. From platform to outcome.</h1><p>A cleaner operating model for turning ideas, content and technology into launched platforms with trackable performance.</p></div><div className="method-board large">{METHOD_STEPS.map(([title,body],idx)=><article key={title} className="method-card"><span className="method-index">{String(idx+1).padStart(2,'0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div></main>; }

function Admin() {
  const [token,setToken] = useState(localStorage.getItem('truflux_admin_token')||''); const [login,setLogin]=useState({username:'admin',password:'truflux@123'}); const [tab,setTab]=useState('dashboard'); const [error,setError]=useState('');
  async function doLogin(e){e.preventDefault();setError('');try{const data=await apiPost('/api/admin/login',login);localStorage.setItem('truflux_admin_token',data.token);setToken(data.token);}catch(e){setError('Invalid admin login.')}}
  if(!token) return <main className="page-wrap admin-login"><div className="login-card"><p className="eyebrow">Admin</p><h1>Content Launch Center</h1><p>Login to upload whitepapers, posters, launch schedules and view captured leads.</p><form onSubmit={doLogin} className="lead-form"><Input label="Username" value={login.username} onChange={v=>setLogin({...login,username:v})}/><Input label="Password" type="password" value={login.password} onChange={v=>setLogin({...login,password:v})}/>{error&&<p className="error">{error}</p>}<button className="primary">Login</button></form></div></main>
  const adminMenu = [
    ['dashboard','Dashboard'],
    ['upload','Upload & Schedule'],
    ['library','Whitepapers'],
    ['leads','Whitepaper Leads'],
    ['contacts','Contact Enquiries'],
    ['leadagent','Lead Agent'],
    ['jobs','Job Schedule'],
    ['stats','Statistics'],
    ['linkedin','Launch & LinkedIn']
  ];
  const activeLabel = adminMenu.find(([k])=>k===tab)?.[1] || 'Dashboard';
  return <main className="admin-shell page-top">
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <img src="/truflux-logo.png" alt="Truflux Technologies" />
        <div><strong>Truflux</strong><span>Admin Console</span></div>
      </div>
      <nav className="admin-side-nav" aria-label="Admin navigation">
        {adminMenu.map(([k,l])=><button className={tab===k?'active':''} key={k} onClick={()=>setTab(k)}>{l}</button>)}
      </nav>
      <div className="admin-sidebar-footer">
        <span>{APP_VERSION}</span>
        <button className="secondary logout-button" onClick={()=>{localStorage.removeItem('truflux_admin_token');setToken('');}}>Logout</button>
      </div>
    </aside>
    <section className="admin-main-panel">
      <div className="admin-head"><div><p className="eyebrow">Admin</p><h1>{activeLabel}</h1><p className="admin-context">Content, leads, launch scheduling and campaign intelligence for Truflux Technologies.</p></div></div>
      <div className="admin-content">{tab==='dashboard'&&<AdminDashboard token={token}/>} {tab==='upload'&&<AdminUpload token={token}/>} {tab==='library'&&<AdminLibrary token={token}/>} {tab==='leads'&&<AdminLeads token={token}/>} {tab==='contacts'&&<AdminContacts token={token}/>} {tab==='leadagent'&&<AdminLeadAgent token={token}/>} {tab==='jobs'&&<AdminJobs token={token}/>} {tab==='stats'&&<AdminStatistics token={token}/>} {tab==='linkedin'&&<AdminLinkedIn token={token}/>}</div>
    </section>
  </main>;
}
function AdminDashboard({ token }) { const [data,setData]=useState(null); useEffect(()=>{apiGet('/api/admin/analytics',token).then(setData).catch(console.error)},[token]); if(!data)return <p>Loading analytics...</p>; return <div className="dashboard-grid"><Metric title="Whitepaper Leads" value={data.total_leads}/><Metric title="Contact Enquiries" value={data.total_contacts||0}/><Metric title="Downloads / Unlocks" value={data.downloads}/><Metric title="Published" value={data.published_whitepapers}/><Metric title="Scheduled" value={data.scheduled_whitepapers}/><div className="admin-card span-2"><h3>Top Whitepapers</h3><table><tbody>{data.top_whitepapers.map(w=><tr key={w.title}><td>{w.title}</td><td>{w.category}</td><td>{w.downloads}</td></tr>)}</tbody></table></div><div className="admin-card span-2"><h3>Events</h3><table><tbody>{data.events.map(e=><tr key={e.event_type}><td>{e.event_type}</td><td>{e.count}</td></tr>)}</tbody></table></div></div>; }
function Metric({title,value}){return <div className="metric"><p>{title}</p><strong>{value}</strong></div>}
function AdminUpload({ token }) {
  const [msg,setMsg]=useState('');
  const [msgType,setMsgType]=useState('notice');
  const [loading,setLoading]=useState(false);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiNote,setAiNote]=useState('');
  const [selectedPdf,setSelectedPdf]=useState(null);
  const [pdfName,setPdfName]=useState('');
  const formRef = useRef(null);

  function fillField(name, value) {
    const el = formRef.current?.elements?.[name];
    if (el && value !== undefined && value !== null) el.value = value;
  }

  function getSelectedPdf() {
    return selectedPdf || formRef.current?.elements?.whitepaper_pdf?.files?.[0] || null;
  }

  function setFileFromInput(e) {
    const file = e.target.files?.[0] || null;
    setSelectedPdf(file);
    setPdfName(file?.name || '');
    setAiNote('');
    setMsg('');
  }

  function valueOf(form, name) {
    return String(form.elements?.[name]?.value || '').trim();
  }

  async function analyzeSelectedFile() {
    const file = getSelectedPdf();
    if (!file) {
      setAiNote('Please select the whitepaper PDF first, then click AI Fill Details.');
      return;
    }
    setAiNote('');
    setAiLoading(true);
    const fd = new FormData();
    fd.append('whitepaper_pdf', file);
    try {
      const data = await apiPost('/api/admin/whitepapers/analyze', fd, token);
      fillField('title', data.title || '');
      fillField('category', data.category || 'Data and Insights');
      fillField('summary', data.summary || '');
      fillField('description', data.description || '');
      fillField('seo_title', data.seo_title || '');
      fillField('meta_description', data.meta_description || '');
      fillField('linkedin_copy', data.linkedin_copy || '');
      setAiNote(`AI filled the whitepaper details. Confidence: ${data.confidence || 0}%. Extracted characters: ${data.extracted_characters || 0}. Please review before saving.`);
    } catch (e) {
      setAiNote('AI analysis failed. Please confirm the backend is running and the file is a readable PDF. Scanned/image-only PDFs may need manual entry.');
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(e){
    e.preventDefault();
    setMsg('');
    setMsgType('notice');
    const form = e.currentTarget;
    const pdf = getSelectedPdf();
    const title = valueOf(form, 'title');
    const summary = valueOf(form, 'summary');
    if(!pdf){ setMsgType('error'); setMsg('Please select the whitepaper PDF before saving.'); return; }
    if(!title || !summary){ setMsgType('error'); setMsg('Please fill Title and Short Summary before saving.'); return; }
    const fd=new FormData();
    fd.append('whitepaper_pdf', pdf, pdf.name || 'whitepaper.pdf');
    const poster = form.elements?.poster?.files?.[0];
    if(poster) fd.append('poster', poster, poster.name || 'poster.png');
    const trailer = form.elements?.trailer?.files?.[0];
    if(trailer) fd.append('trailer', trailer, trailer.name || 'trailer.mp4');
    ['title','summary','description','category','seo_title','meta_description','status','launch_at','linkedin_copy'].forEach(name=>{
      fd.append(name, form.elements?.[name]?.value || '');
    });
    setLoading(true);
    try{
      const res=await apiPost('/api/admin/whitepapers',fd,token);
      setMsgType('notice');
      setMsg(`Created whitepaper with status: ${res.status}`);
      form.reset();
      setSelectedPdf(null);
      setPdfName('');
      setAiNote('');
    }catch(err){
      let detail = err?.message || '';
      try { const parsed = JSON.parse(detail); detail = parsed.detail || detail; } catch(_) {}
      setMsgType('error');
      setMsg(`Upload failed: ${detail || 'Please check the PDF and required fields.'}`);
    }finally{setLoading(false)}
  }

  return <form ref={formRef} className="admin-card upload-form ai-upload-redesign" onSubmit={submit}>
    <div className="form-title compact-title">
      <UploadCloud/>
      <div><h2>Upload whitepaper, poster and launch schedule</h2><p>Create gated content, AI-assisted metadata, launch copy and scheduled publishing.</p></div>
    </div>

    <section className="upload-sequence-card">
      <div className="sequence-header">
        <div>
          <span className="admin-kicker">Step 1</span>
          <h3>Select whitepaper PDF</h3>
        </div>
        <div className="info-tooltip-wrap" tabIndex="0" aria-label="AI fill information">
          <Info size={17}/>
          <span className="info-tooltip">The AI Fill feature extracts readable PDF text, infers the service line, creates a summary, SEO description and LinkedIn launch copy. You can edit every field before saving.</span>
        </div>
      </div>
      <div className="upload-file-panel">
        <label className="field native-file-field">
          <span>Whitepaper PDF *</span>
          <input name="whitepaper_pdf" type="file" accept="application/pdf,.pdf" required onChange={setFileFromInput}/>
        </label>
        <div className="selected-file-card">
          <UploadCloud size={24}/>
          <div>
            <strong>{pdfName || 'No PDF selected yet'}</strong>
            <span>{selectedPdf ? 'PDF selected. You can now run AI Fill Details.' : 'Choose the PDF first. The AI Fill button will enable after selection.'}</span>
          </div>
        </div>
      </div>
      <div className="ai-action-row">
        <button type="button" className="primary" disabled={aiLoading || !selectedPdf} onClick={analyzeSelectedFile}>{aiLoading?'Reading PDF...':'AI Fill Details'}</button>
        <p>{selectedPdf ? 'Ready for AI detail extraction.' : 'Select a PDF to enable AI Fill Details.'}</p>
      </div>
      {aiNote&&<p className="notice ai-note">{aiNote}</p>}
    </section>

    <section className="upload-section-card">
      <div className="section-mini-title"><span className="admin-kicker">Step 2</span><h3>Review generated details</h3></div>
      <div className="form-grid upload-detail-grid">
        <label className="field"><span>Title *</span><input name="title" required placeholder="Building an AI-Ready Data Foundation"/></label>
        <label className="field"><span>Category</span><input name="category" defaultValue="Data and Insights"/></label>
        <label className="field"><span>SEO Title</span><input name="seo_title" placeholder="Whitepaper title | Truflux Technologies"/></label>
        <label className="field"><span>Meta Description</span><input name="meta_description" placeholder="Short SEO description"/></label>
        <label className="field wide-field"><span>Short Summary *</span><textarea name="summary" required placeholder="Short card summary"/></label>
        <label className="field wide-field"><span>Long Description</span><textarea name="description" placeholder="Landing page description"/></label>
        <label className="field wide-field"><span>LinkedIn Post Copy</span><textarea name="linkedin_copy" placeholder="Write the launch post. The system will add tracking link and hashtags."/></label>
      </div>
    </section>

    <section className="upload-section-card">
      <div className="section-mini-title"><span className="admin-kicker">Step 3</span><h3>Poster and launch settings</h3></div>
      <div className="form-grid upload-detail-grid">
        <label className="field"><span>Poster / LinkedIn Creative</span><input name="poster" type="file" accept="image/*,.svg"/></label>
        <label className="field"><span>Trailer Video</span><input name="trailer" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"/><small>Featured on the landing page and linked to this whitepaper.</small></label>
        <label className="field"><span>Status</span><select name="status" defaultValue="Draft"><option>Draft</option><option>Scheduled</option><option>Published</option></select></label>
        <label className="field"><span>Launch Date / Time</span><input type="datetime-local" name="launch_at"/></label>
      </div>
    </section>

    <div className="save-bar"><button className="primary" disabled={loading}>{loading?'Uploading...':'Save Whitepaper'}</button>{msg&&<p className={msgType}>{msg}</p>}</div>
  </form>
}
function AdminLibrary({ token }){
  const [items,setItems]=useState([]);
  const [query,setQuery]=useState('');
  const [editing,setEditing]=useState(null);
  const [message,setMessage]=useState('');
  async function load(){setItems(await apiGet('/api/admin/whitepapers',token))}
  useEffect(()=>{load().catch(console.error)},[token]);
  async function updateStatus(id,status){await apiPut(`/api/admin/whitepapers/${id}/status`,{status},token);await load()}
  async function deleteWhitepaper(item){
    const ok = window.confirm(`Delete ${item.whitepaper_number || 'this whitepaper'} - ${item.title}? This removes it from the library but keeps historical lead records.`);
    if(!ok) return;
    await apiDelete(`/api/admin/whitepapers/${item.id}`,token);
    if(editing?.id===item.id) setEditing(null);
    setMessage('Whitepaper deleted.');
    await load();
  }
  function beginEdit(item){setEditing({...item}); setMessage('');}
  function updateEdit(k,v){setEditing(prev=>({...prev,[k]:v}));}
  async function saveEdit(e){
    e.preventDefault();
    if(!editing) return;
    const form = e.currentTarget;
    const fd = new FormData();
    ['title','summary','description','category','seo_title','meta_description','status','launch_at','linkedin_copy'].forEach(name=>fd.append(name, form.elements?.[name]?.value || ''));
    const pdf = form.elements?.whitepaper_pdf?.files?.[0];
    const poster = form.elements?.poster?.files?.[0];
    if(pdf) fd.append('whitepaper_pdf', pdf, pdf.name);
    if(poster) fd.append('poster', poster, poster.name);
    const trailer = form.elements?.trailer?.files?.[0];
    if(trailer) fd.append('trailer', trailer, trailer.name);
    const headers = { Authorization: `Bearer ${token}` };
    const res = await fetch(`${API_BASE}/api/admin/whitepapers/${editing.id}`, { method:'PUT', headers, body:fd });
    if(!res.ok){ setMessage(`Update failed: ${await res.text()}`); return; }
    setMessage('Whitepaper updated.');
    setEditing(null);
    await load();
  }
  const filtered = items.filter(item=>{
    const q=query.trim().toLowerCase();
    const hay=[item.whitepaper_number,item.title,item.category,item.status,item.summary,item.launch_at].join(' ').toLowerCase();
    return !q || hay.includes(q);
  });
  return <div className="whitepaper-admin-v2">
    <section className="admin-card library-hero-v2">
      <div>
        <span className="admin-kicker">Whitepaper library</span>
        <h2>Manage gated content</h2>
        <p>Search, edit, delete, publish or reschedule whitepapers. Each item has a running whitepaper number for tracking.</p>
      </div>
      <label className="library-search-v2"><span>Search whitepapers</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by number, title, category, status..."/></label>
    </section>
    {message&&<p className={message.toLowerCase().includes('failed')?'error':'notice'}>{message}</p>}
    <section className="admin-card library-list-v2">
      <div className="library-list-head"><strong>{filtered.length}</strong><span>shown from {items.length} whitepapers</span></div>
      <div className="whitepaper-manage-list">
        {filtered.map(item=><article className="whitepaper-manage-card" key={item.id}>
          <div className="wp-number-badge">{item.whitepaper_number || 'WP-0000'}</div>
          <div className="wp-manage-main"><h3>{item.title}</h3><p>{item.summary}</p><div className="wp-meta-row"><span>{item.category || 'Uncategorised'}</span><span>Launch: {item.launch_at || 'Not scheduled'}</span><span>Downloads: {item.downloads || 0}</span></div></div>
          <div className="wp-manage-actions">
            <span className={`status ${String(item.status||'draft').toLowerCase()}`}>{item.status}</span>
            <select value={item.status} onChange={e=>updateStatus(item.id,e.target.value)}><option>Draft</option><option>Scheduled</option><option>Published</option></select>
            <button className="secondary small" onClick={()=>beginEdit(item)}><Pencil size={14}/> Edit / Reschedule</button>
            <button className="secondary small danger" onClick={()=>deleteWhitepaper(item)}><Trash2 size={14}/> Delete</button>
          </div>
        </article>)}
        {filtered.length===0&&<div className="empty-state-v2"><h3>No matching whitepapers</h3><p>Clear the search or upload a new whitepaper.</p></div>}
      </div>
    </section>
    {editing&&<div className="modal-backdrop"><div className="lead-modal edit-whitepaper-modal"><button className="close" onClick={()=>setEditing(null)}>×</button><div className="modal-title"><span className="category">{editing.whitepaper_number}</span><h2>Edit whitepaper</h2><p>Update content, replace files, change status, or reschedule the launch date.</p></div><form onSubmit={saveEdit} className="lead-form"><div className="form-grid upload-detail-grid">
      <label className="field"><span>Title *</span><input name="title" value={editing.title||''} onChange={e=>updateEdit('title',e.target.value)} required/></label>
      <label className="field"><span>Category</span><input name="category" value={editing.category||''} onChange={e=>updateEdit('category',e.target.value)}/></label>
      <label className="field"><span>SEO Title</span><input name="seo_title" value={editing.seo_title||''} onChange={e=>updateEdit('seo_title',e.target.value)}/></label>
      <label className="field"><span>Meta Description</span><input name="meta_description" value={editing.meta_description||''} onChange={e=>updateEdit('meta_description',e.target.value)}/></label>
      <label className="field"><span>Status</span><select name="status" value={editing.status||'Draft'} onChange={e=>updateEdit('status',e.target.value)}><option>Draft</option><option>Scheduled</option><option>Published</option></select></label>
      <label className="field"><span>Launch Date / Time</span><input type="datetime-local" name="launch_at" value={(editing.launch_at||'').slice(0,16)} onChange={e=>updateEdit('launch_at',e.target.value)}/></label>
      <label className="field"><span>Replace PDF</span><input name="whitepaper_pdf" type="file" accept="application/pdf,.pdf"/></label>
      <label className="field"><span>Replace Poster</span><input name="poster" type="file" accept="image/*,.svg"/></label>
      <label className="field"><span>Replace Trailer Video</span><input name="trailer" type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"/><small>{editing.trailer_url ? 'Current trailer is linked to this whitepaper.' : 'No trailer linked yet.'}</small></label>
      <label className="field wide-field"><span>Short Summary *</span><textarea name="summary" value={editing.summary||''} onChange={e=>updateEdit('summary',e.target.value)} required/></label>
      <label className="field wide-field"><span>Long Description</span><textarea name="description" value={editing.description||''} onChange={e=>updateEdit('description',e.target.value)}/></label>
      <label className="field wide-field"><span>LinkedIn Post Copy</span><textarea name="linkedin_copy" value={editing.linkedin_copy||''} onChange={e=>updateEdit('linkedin_copy',e.target.value)}/></label>
    </div><div className="save-bar"><button className="primary"><Save size={16}/> Save Changes</button><button type="button" className="secondary" onClick={()=>setEditing(null)}><RotateCcw size={16}/> Cancel</button></div></form></div></div>}
  </div>
}
function AdminLeads({ token }){
  const [leads,setLeads]=useState([]);
  const [query,setQuery]=useState('');
  const [timeline,setTimeline]=useState('All');
  const [selectedId,setSelectedId]=useState(null);
  useEffect(()=>{apiGet('/api/admin/leads',token).then(data=>{setLeads(data); if(data.length) setSelectedId(data[0].id);}).catch(console.error)},[token]);
  const exportUrl=`${API_BASE}/api/admin/export/leads.csv`;
  function exportCsv(e){e.preventDefault();fetch(exportUrl,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.blob()).then(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='truflux_leads_export.csv';a.click();URL.revokeObjectURL(url);});}
  const timelines=['All',...Array.from(new Set(leads.map(l=>l.timeline).filter(Boolean)))];
  const filtered=leads.filter(lead=>{
    const q=query.trim().toLowerCase();
    const hay=[lead.name,lead.email,lead.company,lead.designation,lead.industry,lead.location,lead.whitepaper_title,lead.interest_area].join(' ').toLowerCase();
    return (!q || hay.includes(q)) && (timeline==='All' || lead.timeline===timeline);
  });
  const selected=filtered.find(l=>l.id===selectedId)||filtered[0]||null;
  const companyCount=new Set(leads.map(l=>(l.company||'').trim()).filter(Boolean)).size;
  const newsletterCount=leads.filter(l=>Number(l.newsletter)===1).length;
  const highIntent=leads.filter(l=>String(l.timeline||'').toLowerCase().includes('immediate')||String(l.timeline||'').includes('3')).length;
  const latest=leads[0]?.created_at ? new Date(leads[0].created_at).toLocaleDateString() : '-';
  function initials(name){return String(name||'Lead').split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'L'}
  return <div className="leads-page-v2">
    <div className="leads-hero-card">
      <div>
        <span className="admin-kicker">Whitepaper audience</span>
        <h2>Leads</h2>
        <p>Clean view of people who unlocked whitepapers. Search, qualify and export without crowding the page.</p>
      </div>
      <a className="primary link-button" href={exportUrl} onClick={exportCsv}><Download size={16}/> Export CSV</a>
    </div>
    <div className="lead-metrics-v2">
      <Metric title="Total leads" value={leads.length}/>
      <Metric title="Companies" value={companyCount}/>
      <Metric title="High intent" value={highIntent}/>
      <Metric title="Newsletter" value={newsletterCount}/>
    </div>
    <div className="lead-workspace-v2">
      <section className="admin-card lead-directory-v2">
        <div className="lead-toolbar-v2">
          <label className="lead-search-v2"><span>Search leads</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, company, email, whitepaper..."/></label>
          <label className="lead-filter-v2"><span>Timeline</span><select value={timeline} onChange={e=>setTimeline(e.target.value)}>{timelines.map(t=><option key={t}>{t}</option>)}</select></label>
        </div>
        <div className="lead-summary-line"><strong>{filtered.length}</strong> shown from <strong>{leads.length}</strong> leads <span>Latest: {latest}</span></div>
        <div className="lead-card-list-v2">
          {filtered.map(lead=><button type="button" className={`lead-card-v2 ${selected?.id===lead.id?'selected':''}`} key={lead.id} onClick={()=>setSelectedId(lead.id)}>
            <span className="lead-avatar-v2">{initials(lead.name)}</span>
            <span className="lead-main-v2"><strong>{lead.name}</strong><small>{lead.designation||'Designation not set'} {lead.company?`• ${lead.company}`:''}</small><em>{lead.whitepaper_title||'Whitepaper not set'}</em></span>
            <span className="lead-meta-v2"><small>{lead.timeline||'Timeline not set'}</small><b>{lead.industry||'Industry not set'}</b></span>
          </button>)}
          {filtered.length===0&&<div className="empty-state-v2"><h3>No matching leads</h3><p>Try clearing the search or timeline filter.</p></div>}
          {leads.length===0&&<div className="empty-state-v2"><h3>No leads yet</h3><p>Unlock a whitepaper from the public site to test the capture flow.</p></div>}
        </div>
      </section>
      <aside className="admin-card lead-detail-v2">
        <div className="detail-top-v2"><span className="lead-avatar-v2 large">{initials(selected?.name)}</span><div><h2>{selected?.name||'Select a lead'}</h2><p>{selected?.designation||'Designation not set'}{selected?.company?` at ${selected.company}`:''}</p></div></div>
        {selected?<>
          <div className="detail-grid-v2">
            <p><strong>Email</strong><span>{selected.email}</span></p>
            <p><strong>Mobile</strong><span>{selected.mobile||'-'}</span></p>
            <p><strong>Company</strong><span>{selected.company||'-'}</span></p>
            <p><strong>Industry</strong><span>{selected.industry||'-'}</span></p>
            <p><strong>Location</strong><span>{selected.location||'-'}</span></p>
            <p><strong>Timeline</strong><span>{selected.timeline||'-'}</span></p>
            <p><strong>Interest</strong><span>{selected.interest_area||'-'}</span></p>
            <p><strong>Newsletter</strong><span>{Number(selected.newsletter)===1?'Yes':'No'}</span></p>
          </div>
          <div className="detail-note-v2"><strong>Whitepaper</strong><p>{selected.whitepaper_title||'-'}</p></div>
          <div className="detail-note-v2"><strong>Business challenge</strong><p>{selected.business_challenge||'Not provided'}</p></div>
          {selected.linkedin_profile&&<a className="secondary link-button small" href={selected.linkedin_profile} target="_blank" rel="noreferrer">Open LinkedIn Profile</a>}
        </>:<p>Select a lead from the left to view full details.</p>}
      </aside>
    </div>
  </div>
}
function AdminContacts({ token }){const [contacts,setContacts]=useState([]);useEffect(()=>{apiGet('/api/admin/contacts',token).then(setContacts).catch(console.error)},[token]);return <div className="admin-card"><div className="row-heading"><div><h2>Contact Enquiries</h2><p>Captured from the public contact dialog.</p></div></div><div className="lead-list">{contacts.map(c=><div className="lead-row" key={c.id}><strong>{c.name}</strong><span>{c.email}</span><span>{c.company||'-'}</span><span>{c.interest_area||'-'}</span><small>{c.mobile||'Mobile not set'} • {c.designation||'Designation not set'}</small><small>{c.message||'No message'}</small></div>)}{contacts.length===0&&<p>No contact enquiries yet. Submit the public contact dialog to test the flow.</p>}</div></div>}
function AdminLinkedIn({ token }){const [items,setItems]=useState([]);const [selectedPost,setSelectedPost]=useState(null);const [notice,setNotice]=useState('');async function load(){setItems(await apiGet('/api/admin/launches',token))} useEffect(()=>{load().catch(console.error)},[token]);async function generate(id){setSelectedPost(await apiGet(`/api/admin/linkedin/post/${id}`,token))} async function processDue(){const res=await apiPost('/api/admin/launches/process-due',{},token);setNotice(`Processed due launches. Published count: ${res.published_count}`);await load()} async function copyText(text){await navigator.clipboard.writeText(text);setNotice('Copied LinkedIn post text to clipboard.')} return <div className="linkedin-layout"><div className="admin-card"><div className="row-heading"><div><h2>Launch & LinkedIn Queue</h2><p>Generate LinkedIn-ready posts with UTM tracking links.</p></div><button className="primary small" onClick={processDue}><CalendarClock size={16}/> Process Due Launches</button></div>{notice&&<p className="notice">{notice}</p>}<table className="admin-table"><thead><tr><th>Title</th><th>Status</th><th>Launch</th><th>LinkedIn</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.title}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{item.launch_at||'-'}</td><td><button className="secondary tiny" onClick={()=>generate(item.id)}>Generate</button></td></tr>)}</tbody></table></div><div className="admin-card linkedin-preview"><h2>LinkedIn Post Preview</h2>{selectedPost?<>{selectedPost.poster_url&&<img src={selectedPost.poster_url} alt="LinkedIn poster"/>}<textarea readOnly value={selectedPost.post_text}/><div className="hero-actions"><button className="primary small" onClick={()=>copyText(selectedPost.post_text)}>Copy Post</button><a className="secondary link-button small" href={selectedPost.tracking_url} target="_blank" rel="noreferrer">Open Tracking Link</a></div></>:<p>Select a whitepaper and click Generate. This first build prepares the post and tracking link for manual LinkedIn publishing.</p>}</div></div>}

function AdminJobs({ token }){
  const [data,setData]=useState({jobs:[],scheduled_whitepapers:[],recent_runs:[]});
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState('');
  async function load(){setData(await apiGet('/api/admin/jobs',token));}
  useEffect(()=>{load().catch(console.error)},[token]);
  async function run(jobType){
    setLoading(jobType); setNotice('');
    try{
      const res=await apiPost('/api/admin/jobs/run',{job_type:jobType},token);
      const msg=res.message || 'Job completed';
      const extra = res.published_count!==undefined ? ` Published: ${res.published_count}.` : (res.created_count!==undefined ? ` Leads created: ${res.created_count}.` : '');
      setNotice(`${msg}.${extra}`);
      await load();
    }catch(e){
      setNotice(e.message || 'Job failed. Please check backend logs.');
    }finally{setLoading('');}
  }
  return <div className="jobs-layout">
    <section className="admin-card jobs-hero-card">
      <div className="row-heading"><div><h2>Job Schedule</h2><p>Run scheduled whitepaper launches and approved-source lead jobs from one place.</p></div><button className="secondary small" onClick={load}>Refresh</button></div>
      {notice&&<p className="notice">{notice}</p>}
      <div className="job-grid">
        {data.jobs.map(job=><div className="job-card" key={job.job_type}>
          <div className="job-card-top"><span className={`status ${String(job.status||'ready').toLowerCase()}`}>{job.status}</span><CalendarClock size={20}/></div>
          <h3>{job.job_name}</h3>
          <p>{job.description}</p>
          <div className="job-meta"><span>{job.schedule}</span><span>{job.due_count ? `${job.due_count} due` : 'No due items'}</span></div>
          <button className="primary small" onClick={()=>run(job.job_type)} disabled={loading===job.job_type}>{loading===job.job_type?'Running...':'Run Now'}</button>
        </div>)}
      </div>
      <p className="job-compliance-note"><Info size={15}/> LinkedIn-related jobs are designed for approved imports, CRM sync, Sales Navigator assisted review, and consented data sources. This build does not automate LinkedIn scraping.</p>
    </section>

    <section className="admin-card">
      <div className="row-heading"><div><h2>Scheduled Whitepapers</h2><p>Whitepapers waiting for launch processing.</p></div></div>
      <table className="admin-table"><thead><tr><th>No.</th><th>Title</th><th>Status</th><th>Launch Date</th></tr></thead><tbody>{data.scheduled_whitepapers.map(wp=><tr key={wp.id}><td>{wp.whitepaper_number}</td><td>{wp.title}</td><td><span className={`status ${wp.status.toLowerCase()}`}>{wp.status}</span></td><td>{wp.launch_at || '-'}</td></tr>)}{data.scheduled_whitepapers.length===0&&<tr><td colSpan="4">No scheduled whitepapers pending.</td></tr>}</tbody></table>
    </section>

    <section className="admin-card">
      <div className="row-heading"><div><h2>Recent Job Runs</h2><p>Execution history for launch and lead-generation jobs.</p></div></div>
      <table className="admin-table"><thead><tr><th>Time</th><th>Job</th><th>Status</th><th>Result</th></tr></thead><tbody>{data.recent_runs.map(run=><tr key={run.id}><td>{run.created_at}</td><td>{run.job_name}</td><td><span className={`status ${run.status.toLowerCase()}`}>{run.status}</span></td><td><small>{run.result}</small></td></tr>)}{data.recent_runs.length===0&&<tr><td colSpan="4">No jobs have been run yet.</td></tr>}</tbody></table>
    </section>
  </div>
}

function InfoTip({ text }){
  return <span className="info-tooltip-wrap inline-info" tabIndex="0" aria-label="Information"><Info size={15}/><span className="info-tooltip">{text}</span></span>
}

function AdminLeadAgent({ token }){
  const [sourceText,setSourceText]=useState('');
  const [query,setQuery]=useState('Identify CIOs and technology decision owners at companies announcing new projects, new roles, data, AI, platform and transformation initiatives');
  const [mode,setMode]=useState('cio');
  const [sourcePlan,setSourcePlan]=useState([]);
  const [salesNavText,setSalesNavText]=useState('');
  const [salesNavName,setSalesNavName]=useState('CIO / Technology Decision Makers');
  const [salesNavUrl,setSalesNavUrl]=useState('');
  const [prospects,setProspects]=useState([]);
  const [selected,setSelected]=useState(null);
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);
  async function load(){setProspects(await apiGet('/api/admin/prospect-leads',token));}
  useEffect(()=>{load().catch(console.error);apiGet('/api/admin/lead-agent/source-plan',token).then(r=>setSourcePlan(r.sources||[])).catch(()=>{})},[token]);
  function parseSources(){return sourceText.split('\n---\n').map(block=>block.trim()).filter(Boolean).map(block=>{const lines=block.split('\n');const first=lines[0]||'';const isUrl=first.startsWith('http');return {platform:'Manual LinkedIn / Social Import', url:isUrl?first:'', text:isUrl?lines.slice(1).join('\n'):block};});}
  async function runAgent(runMode=mode, useDemo=false){setLoading(true); setNotice('');try{const sources = useDemo ? [] : parseSources();const res=await apiPost('/api/admin/lead-agent/run',{query,sources,mode:runMode},token);setMode(runMode);setNotice(`${runMode==='cio'?'CIO discovery':'Lead agent'} completed. Sources checked: ${res.source_count}. New lead records created: ${res.created_count}.`);await load();}catch(e){setNotice('Lead agent run failed. Please check backend logs.');}finally{setLoading(false);}}
  async function importSalesNavigator(){setLoading(true); setNotice('');try{const res=await apiPost('/api/admin/sales-navigator/import',{saved_search_name:salesNavName,saved_search_url:salesNavUrl,pasted_records:salesNavText,notes:'Imported from Admin Lead Agent Sales Navigator panel'},token);setNotice(`Sales Navigator import completed. Records read: ${res.pasted_count}. New lead records created: ${res.created_count}.`);setSalesNavText('');await load();}catch(e){setNotice('Sales Navigator import failed. Please check the pasted data and backend logs.');}finally{setLoading(false);}}
  async function updateStatus(id,status){await apiPut(`/api/admin/prospect-leads/${id}/status`,{status},token);await load();}
  async function copyEmail(lead){await navigator.clipboard.writeText(`Subject: ${lead.email_subject}\n\n${lead.email_body}`);setNotice('Introductory email copied to clipboard.');}
  const exportUrl=`${API_BASE}/api/admin/export/prospect-leads.csv`;
  return <div className="lead-agent-layout spacious deexplained-agent">
    <div className="admin-card lead-agent-runner spacious-runner">
      <div className="lead-agent-header compact-agent-header">
        <div className="lead-agent-icon"><SearchCheck size={26}/></div>
        <div><h2>CIO Lead Generation Agent <InfoTip text="Creates prospect leads from approved/manual/API-imported sources. It identifies CIO and CIO-equivalent roles, records source signals, and prepares an appointment email."/></h2></div>
      </div>

      <section className="agent-section">
        <div className="agent-section-title compact-tooltip-title"><span>01</span><div><strong>Select search mode <InfoTip text="CIO Discovery prioritises technology decision makers. General Signals finds broader project, role, expansion and innovation opportunities."/></strong></div></div>
        <div className="mode-grid spacious-mode"><label className={`mode-card ${mode==='cio'?'active':''}`}><input type="radio" checked={mode==='cio'} onChange={()=>setMode('cio')}/><strong>CIO Discovery</strong><span>CIO, CDO, CTO and Head of IT contacts.</span></label><label className={`mode-card ${mode==='general'?'active':''}`}><input type="radio" checked={mode==='general'} onChange={()=>setMode('general')}/><strong>General Signals</strong><span>Project, role, expansion and innovation leads.</span></label></div>
      </section>

      <section className="agent-section">
        <div className="agent-section-title compact-tooltip-title"><span>02</span><div><strong>Search focus <InfoTip text="Describe target companies, industries, titles, geography, initiative types, and project signals for the agent to prioritise."/></strong></div></div>
        <label className="field agent-field-block"><span>Search focus</span><input value={query} onChange={e=>setQuery(e.target.value)} /></label>
      </section>

      <section className="agent-section">
        <div className="agent-section-title compact-tooltip-title"><span>03</span><div><strong>Approved source posts / snippets / company updates <InfoTip text="Paste permitted LinkedIn Sales Navigator notes, social snippets, newsroom updates, RSS items or CRM imports. Separate each source with a line containing three dashes."/></strong></div></div>
        <label className="field agent-field-block"><span>Source text</span><textarea className="agent-source-box" value={sourceText} onChange={e=>setSourceText(e.target.value)} placeholder={`Paste LinkedIn/social/news/company snippets here. Separate each source with a line containing ---

Example:
Arjun Rao has joined Meridian Consumer Products as Chief Information Officer to lead ERP modernization, data platform and AI-enabled operations.
---
SouthBay Hospitals announced a new digital patient experience platform and appointed Meera Iyer as CIO.`}/></label>
      </section>

      <section className="agent-section sales-nav-section">
        <div className="agent-section-title compact-tooltip-title"><span>04</span><div><strong>LinkedIn Sales Navigator assisted import <InfoTip text="Paste Sales Navigator lead cards or CRM-synced rows. This is an assisted workflow and does not scrape LinkedIn."/></strong></div></div>
        <div className="form-grid upload-detail-grid">
          <label className="field"><span>Saved search / lead list name</span><input value={salesNavName} onChange={e=>setSalesNavName(e.target.value)}/></label>
          <label className="field"><span>Sales Navigator / CRM Sync URL</span><input value={salesNavUrl} onChange={e=>setSalesNavUrl(e.target.value)} placeholder="Optional reference URL"/></label>
          <label className="field wide-field"><span>Sales Navigator rows</span><textarea value={salesNavText} onChange={e=>setSalesNavText(e.target.value)} placeholder={`Example:
Meera Iyer, CIO, SouthBay Hospitals, Bengaluru, https://linkedin.com/in/example
Arjun Rao, Chief Information Officer, Meridian Consumer Products, Bengaluru, https://linkedin.com/in/example`}/></label>
        </div>
        <button className="secondary" type="button" disabled={loading || !salesNavText.trim()} onClick={importSalesNavigator}>Import Sales Navigator Leads</button>
      </section>

      <section className="agent-section agent-actions-section">
        <div className="agent-section-title compact-tooltip-title"><span>05</span><div><strong>Run and export <InfoTip text="Run the agent on pasted sources or demo data. Export the resulting prospect database as CSV for follow-up."/></strong></div></div>
        <div className="hero-actions agent-action-row"><button className="primary" onClick={()=>runAgent(mode,false)} disabled={loading}>{loading?'Running Agent...':mode==='cio'?'Find CIO Leads':'Run Lead Agent'}</button><button className="secondary" onClick={()=>{setSourceText('');runAgent('cio',true);}}>Run CIO Demo Scan</button><button className="secondary" onClick={()=>{setSourceText('');runAgent('general',true);}}>Run General Demo</button><a className="secondary link-button" href={exportUrl} target="_blank" rel="noreferrer">Export Prospects CSV</a></div>
        {notice&&<p className="notice">{notice}</p>}
      </section>

      <section className="agent-section agent-reference-section compact-reference">
        <div className="source-plan"><strong>Source coverage <InfoTip text="Production integrations should use approved sources such as Sales Navigator assisted import, CRM sync, company pages, news feeds, RSS, event lists and consented datasets."/></strong><div>{sourcePlan.map(src=><span key={src}>{src}</span>)}</div></div>
      </section>
    </div>
    <div className="admin-card prospect-list-card">
      <div className="row-heading"><div><h2>Prospect Lead Records</h2></div></div>
      <div className="prospect-list">{prospects.map(lead=><div className={`prospect-row ${selected?.id===lead.id?'selected':''}`} key={lead.id} onClick={()=>setSelected(lead)}><div><strong>{lead.organization}</strong><span>{lead.signal_type} • {lead.project}</span></div><div><small>{lead.contact_role}</small><b>{lead.confidence}%</b></div></div>)}{prospects.length===0&&<p>No prospect records yet. Run the demo scan or paste source snippets.</p>}</div>
    </div>
    <div className="admin-card prospect-detail-card">
      <h2>Lead Detail & Appointment Email</h2>
      {selected?<><div className="prospect-detail-grid"><p><strong>Organization</strong><span>{selected.organization}</span></p><p><strong>Signal</strong><span>{selected.signal_type}</span></p><p><strong>Project</strong><span>{selected.project}</span></p><p><strong>Suggested POC</strong><span>{selected.contact_name} — {selected.contact_role}</span></p><p><strong>Confidence</strong><span>{selected.confidence}%</span></p><p><strong>Status</strong><select value={selected.status} onChange={e=>updateStatus(selected.id,e.target.value)}><option>Draft</option><option>Verified</option><option>Contacted</option><option>Meeting Requested</option><option>Converted</option><option>Rejected</option></select></p></div><label className="field"><span>Why this is a lead</span><textarea readOnly value={selected.rationale}/></label><label className="field"><span>Source text</span><textarea readOnly value={selected.source_text}/></label><label className="field"><span>Email subject</span><input readOnly value={selected.email_subject}/></label><label className="field"><span>Introductory email</span><textarea className="email-draft-box" readOnly value={selected.email_body}/></label><button className="primary small" onClick={()=>copyEmail(selected)}><Copy size={16}/> Copy Email</button></>:<p>Select a prospect record to view the prepared introductory email.</p>}
    </div>
  </div>
}

function StatMetric({title,value,icon:Icon,sub}){return <div className="stat-metric-card"><div className="stat-metric-icon">{Icon&&<Icon size={22}/>}</div><div><span>{title}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div></div>}
function BarList({title,items,labelKey,valueKey,empty='No data yet'}){const max=Math.max(1,...items.map(i=>Number(i[valueKey]||0)));return <div className="admin-card stat-panel"><h3>{title}</h3><div className="bar-list">{items.length?items.map((item,idx)=><div className="bar-row" key={idx}><div className="bar-row-head"><span>{item[labelKey]||'Unknown'}</span><b>{item[valueKey]||0}</b></div><div className="bar-track"><i style={{width:`${Math.max(4,(Number(item[valueKey]||0)/max)*100)}%`}}></i></div></div>):<p className="muted">{empty}</p>}</div></div>}
function AdminStatistics({ token }){
  const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [err,setErr]=useState('');
  async function load(){setLoading(true);setErr('');try{setData(await apiGet('/api/admin/statistics',token));}catch(e){setErr('Could not load statistics. Please check backend logs.');}finally{setLoading(false)}}
  useEffect(()=>{load(); const t=setInterval(load,30000); return()=>clearInterval(t);},[token]);
  if(loading&&!data)return <p>Loading statistics...</p>;
  if(err&&!data)return <p className="error">{err}</p>;
  const s=data.summary||{};
  return <div className="statistics-page">
    <section className="admin-card stats-hero">
      <div><span className="admin-kicker">Statistics</span><h2>Site intelligence, audience behaviour and admin security</h2><p>Tracks page views, clicks, engagement time, whitepaper interest, contact/lead conversion, admin access, failed login attempts and suspicious probes. AI-style insights are generated from local analytics patterns.</p></div>
      <button className="secondary" onClick={load}>Refresh Statistics</button>
    </section>
    <section className="stats-metric-grid">
      <StatMetric title="Page views" value={s.page_views||0} icon={Eye}/>
      <StatMetric title="Clicks tracked" value={s.clicks||0} icon={MousePointer2}/>
      <StatMetric title="Unique visitors" value={s.unique_visitors||0} icon={Activity}/>
      <StatMetric title="Conversion rate" value={`${s.conversion_rate||0}%`} icon={TrendingUp} sub="Leads + enquiries / page views"/>
      <StatMetric title="Avg. engagement" value={`${s.avg_session_seconds||0}s`} icon={Gauge}/>
      <StatMetric title="Security signals" value={s.suspicious_events||0} icon={ShieldAlert} sub={`${s.admin_failed||0} failed admin logins`}/>
    </section>
    <section className="stats-grid-two">
      <div className="admin-card stat-panel ai-insight-panel"><h3>AI analytics insights</h3><div className="insight-list">{(data.ai_insights||[]).map((x,i)=><div className="insight-item" key={i}><BrainCircuit size={18}/><span>{x}</span></div>)}</div><div className="ml-score-row"><span>Engagement quality <b>{data.ml_scores?.engagement_quality||0}</b></span><span>Suspicion risk <b>{data.ml_scores?.suspicion_risk||0}</b></span><span>Content interest <b>{data.ml_scores?.content_interest_signal||0}</b></span></div></div>
      <BarList title="Most viewed pages / sections" items={data.top_pages||[]} labelKey="page" valueKey="views"/>
    </section>
    <section className="stats-grid-two">
      <BarList title="Click heat / CTA activity" items={data.click_targets||[]} labelKey="target" valueKey="clicks"/>
      <BarList title="Service-line interest" items={data.service_interest||[]} labelKey="interest_area" valueKey="leads"/>
    </section>
    <section className="admin-card stat-panel"><h3>Whitepaper interest by audience</h3><div className="stat-table-wrap"><table><thead><tr><th>No.</th><th>Whitepaper</th><th>Service line</th><th>Leads</th><th>Downloads</th><th>Urgent interest</th></tr></thead><tbody>{(data.whitepaper_interest||[]).map(w=><tr key={w.whitepaper_number+w.title}><td>{w.whitepaper_number}</td><td>{w.title}</td><td>{w.category}</td><td>{w.leads}</td><td>{w.downloads}</td><td>{w.urgent_interest}</td></tr>)}</tbody></table></div></section>
    <section className="stats-grid-two">
      <div className="admin-card stat-panel"><h3>Recent site activity text log</h3><div className="log-list">{(data.recent_site_activity||[]).map((r,i)=><div className="log-line" key={i}><span>{r.created_at}</span><b>{r.event_type}</b><em>{r.page||r.path||'site'}</em>{r.click_target&&<small>{r.click_target}</small>}</div>)}</div></div>
      <div className="admin-card stat-panel"><h3>Admin access and page activity log</h3><div className="log-list">{(data.admin_activity||[]).map((r,i)=><div className="log-line" key={i}><span>{r.created_at}</span><b>{r.action}</b><em>{r.status}</em><small>{r.path}</small></div>)}</div></div>
    </section>
    <section className="admin-card stat-panel security-panel"><h3><AlertTriangle size={18}/> Suspicious activity log</h3><div className="log-list">{(data.security_logs||[]).length?(data.security_logs||[]).map((r,i)=><div className="log-line danger-log" key={i}><span>{r.created_at}</span><b>{r.severity}</b><em>{r.event_type}</em><small>{r.details}</small></div>):<p className="muted">No suspicious activity recorded yet.</p>}</div></section>
  </div>
}

function Footer({ setPage, openContact }){return <footer className="footer"><div><strong>TRUFLUX TECHNOLOGIES</strong><p>Consulting • Data & Insights • Innovation • AI Products & Platforms</p><p className="copyright">© 2026 Truflux Technologies. All rights reserved.</p></div><div className="footer-meta"><span>Version: {APP_VERSION}</span><span>Last updated: {UPDATED_DATE}</span><button onClick={openContact}>Contact</button></div></footer>}

createRoot(document.getElementById('root')).render(<App/>);
