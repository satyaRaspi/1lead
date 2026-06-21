import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, BarChart3, BrainCircuit, CalendarClock, CheckCircle2, Download, FileText, Gauge, LockKeyhole, Mail, MapPin, Phone, Rocket, Send, UploadCloud, X, SearchCheck, Copy } from 'lucide-react';
import { API_BASE, apiGet, apiPost, apiPut, track } from './api';
import './styles.css';

const APP_VERSION = 'First Build v1.0.16';
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
    <nav>{nav.map(([key,label])=><button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}>{label}</button>)}<button onClick={openContact}>Contact</button></nav>
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

function Services() {
  return <main className="page-wrap page-top"><div className="section-heading wide"><p className="eyebrow">Services</p><h1>Consulting, data, innovation and AI platforms designed as one execution system.</h1><p>Each service line can stand alone, but the real strength of Truflux is the combination: strategy that becomes insight, insight that becomes design, and design that becomes a working platform.</p></div><div className="service-detail-grid">{SERVICES.map(service=><ServiceDetail key={service.title} service={service}/>)}</div></main>;
}
function ServiceCard({ service }) { const Icon=service.icon; return <article className="service-card"><div className="card-icon"><Icon size={24}/></div><h3>{service.title}</h3><p>{service.body}</p><ul>{service.points.map(p=><li key={p}>{p}</li>)}</ul></article>; }
function ServiceDetail({ service }) { const Icon=service.icon; return <article className="service-detail"><div className="card-icon"><Icon size={28}/></div><h2>{service.title}</h2><p>{service.body}</p><div className="pill-list">{service.points.map(p=><span key={p}>{p}</span>)}</div></article>; }

function Whitepapers({ whitepapers, setSelected }) { return <main className="page-wrap page-top"><div className="section-heading wide"><p className="eyebrow">Whitepapers</p><h1>Insight-led content that helps qualify audience interest.</h1><p>Visitors unlock whitepapers by sharing their business profile, area of interest, timeline and consent. Admin can view leads, downloads and campaign source data.</p></div><div className="whitepaper-grid">{whitepapers.map(wp=><WhitepaperCard key={wp.id} wp={wp} onUnlock={()=>setSelected(wp)}/>)}</div></main>; }
function WhitepaperCard({ wp, onUnlock }) { return <article className="whitepaper-card gradient-tile clean-paper-tile"><div className="tile-glow" aria-hidden="true"></div><div className="whitepaper-topline gradient-topline"><span className="report-tag">Whitepaper</span><span className="category soft">{wp.category}</span></div><div className="tile-content"><div className="tile-mark simple-doc-mark"><FileText size={30}/></div><h3>{wp.title}</h3><p>{wp.summary}</p></div><button className="tile-access clean-access" onClick={()=>{track('whitepaper_download_start',{whitepaper_id:wp.id,title:wp.title}); onUnlock();}}><span><LockKeyhole size={15}/> Request Access</span></button></article>; }

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
      <div className="admin-content">{tab==='dashboard'&&<AdminDashboard token={token}/>} {tab==='upload'&&<AdminUpload token={token}/>} {tab==='library'&&<AdminLibrary token={token}/>} {tab==='leads'&&<AdminLeads token={token}/>} {tab==='contacts'&&<AdminContacts token={token}/>} {tab==='leadagent'&&<AdminLeadAgent token={token}/>} {tab==='linkedin'&&<AdminLinkedIn token={token}/>}</div>
    </section>
  </main>;
}
function AdminDashboard({ token }) { const [data,setData]=useState(null); useEffect(()=>{apiGet('/api/admin/analytics',token).then(setData).catch(console.error)},[token]); if(!data)return <p>Loading analytics...</p>; return <div className="dashboard-grid"><Metric title="Whitepaper Leads" value={data.total_leads}/><Metric title="Contact Enquiries" value={data.total_contacts||0}/><Metric title="Downloads / Unlocks" value={data.downloads}/><Metric title="Published" value={data.published_whitepapers}/><Metric title="Scheduled" value={data.scheduled_whitepapers}/><div className="admin-card span-2"><h3>Top Whitepapers</h3><table><tbody>{data.top_whitepapers.map(w=><tr key={w.title}><td>{w.title}</td><td>{w.category}</td><td>{w.downloads}</td></tr>)}</tbody></table></div><div className="admin-card span-2"><h3>Events</h3><table><tbody>{data.events.map(e=><tr key={e.event_type}><td>{e.event_type}</td><td>{e.count}</td></tr>)}</tbody></table></div></div>; }
function Metric({title,value}){return <div className="metric"><p>{title}</p><strong>{value}</strong></div>}
function AdminUpload({ token }) {
  const [msg,setMsg]=useState('');
  const [loading,setLoading]=useState(false);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiNote,setAiNote]=useState('');
  const formRef = useRef(null);

  function fillField(name, value) {
    const el = formRef.current?.elements?.[name];
    if (el && value !== undefined && value !== null) el.value = value;
  }

  async function analyzeFile(file) {
    if (!file) return;
    setAiNote('');
    setAiLoading(true);
    const fd = new FormData();
    fd.append('whitepaper_pdf', file);
    try {
      const data = await apiPost('/api/admin/whitepapers/analyze', fd, token);
      fillField('title', data.title);
      fillField('category', data.category);
      fillField('summary', data.summary);
      fillField('description', data.description);
      fillField('seo_title', data.seo_title);
      fillField('meta_description', data.meta_description);
      fillField('linkedin_copy', data.linkedin_copy);
      setAiNote(`AI filled the whitepaper details from the PDF. Confidence: ${data.confidence}%. Extracted characters: ${data.extracted_characters}.`);
    } catch (e) {
      setAiNote('AI analysis failed. The file may be scanned/image-only or unreadable. You can still enter details manually.');
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(e){
    e.preventDefault();
    setMsg('');
    setLoading(true);
    const fd=new FormData(e.currentTarget);
    try{
      const res=await apiPost('/api/admin/whitepapers',fd,token);
      setMsg(`Created whitepaper with status: ${res.status}`);
      e.currentTarget.reset();
      setAiNote('');
    }catch(e){
      setMsg('Upload failed. Please check that a PDF is selected and required fields are filled.');
    }finally{setLoading(false)}
  }

  return <form ref={formRef} className="admin-card upload-form" onSubmit={submit}>
    <div className="form-title"><UploadCloud/><div><h2>Upload whitepaper, poster and launch schedule</h2><p>Upload the PDF first. The local AI assistant reads the document and pre-fills title, category, summary, SEO metadata and LinkedIn copy.</p></div></div>
    <div className="ai-fill-panel"><div><h3>AI Whitepaper Detail Fill</h3><p>Select a PDF and the system will extract text, infer the service line, create a summary, meta description and launch copy. You can edit everything before saving.</p></div><button type="button" className="secondary" disabled={aiLoading} onClick={()=>analyzeFile(formRef.current?.elements?.whitepaper_pdf?.files?.[0])}>{aiLoading?'Reading PDF...':'AI Fill Details'}</button></div>
    {aiNote&&<p className="notice ai-note">{aiNote}</p>}
    <div className="form-grid"><label className="field"><span>Title *</span><input name="title" required placeholder="Building an AI-Ready Data Foundation"/></label><label className="field"><span>Category</span><input name="category" defaultValue="Data and Insights"/></label><label className="field"><span>SEO Title</span><input name="seo_title" placeholder="Whitepaper title | Truflux Technologies"/></label><label className="field"><span>Meta Description</span><input name="meta_description" placeholder="Short SEO description"/></label><label className="field"><span>Status</span><select name="status" defaultValue="Draft"><option>Draft</option><option>Scheduled</option><option>Published</option></select></label><label className="field"><span>Launch Date / Time</span><input type="datetime-local" name="launch_at"/></label><label className="field"><span>Whitepaper PDF *</span><input name="whitepaper_pdf" type="file" accept="application/pdf" required onChange={e=>analyzeFile(e.target.files?.[0])}/></label><label className="field"><span>Poster / LinkedIn Creative</span><input name="poster" type="file" accept="image/*,.svg"/></label></div><label className="field"><span>Short Summary *</span><textarea name="summary" required placeholder="Short card summary"/></label><label className="field"><span>Long Description</span><textarea name="description" placeholder="Landing page description"/></label><label className="field"><span>LinkedIn Post Copy</span><textarea name="linkedin_copy" placeholder="Write the launch post. The system will add tracking link and hashtags."/></label><button className="primary" disabled={loading}>{loading?'Uploading...':'Save Whitepaper'}</button>{msg&&<p className="notice">{msg}</p>}</form>
}
function AdminLibrary({ token }){const [items,setItems]=useState([]);async function load(){setItems(await apiGet('/api/admin/whitepapers',token))} useEffect(()=>{load().catch(console.error)},[token]);async function updateStatus(id,status){await apiPut(`/api/admin/whitepapers/${id}/status`,{status},token);await load()} return <div className="admin-card"><h2>Whitepaper Library</h2><table className="admin-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Launch</th><th>Downloads</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.title}</td><td>{item.category}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{item.launch_at||'-'}</td><td>{item.downloads}</td><td><select value={item.status} onChange={e=>updateStatus(item.id,e.target.value)}><option>Draft</option><option>Scheduled</option><option>Published</option></select></td></tr>)}</tbody></table></div>}
function AdminLeads({ token }){const [leads,setLeads]=useState([]);useEffect(()=>{apiGet('/api/admin/leads',token).then(setLeads).catch(console.error)},[token]);const exportUrl=`${API_BASE}/api/admin/export/leads.csv`;function exportCsv(e){e.preventDefault();fetch(exportUrl,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.blob()).then(blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='truflux_leads_export.csv';a.click();URL.revokeObjectURL(url);});} return <div className="admin-card"><div className="row-heading"><div><h2>Audience Leads</h2><p>Captured after whitepaper unlock.</p></div><a className="secondary link-button" href={exportUrl} onClick={exportCsv}>Export CSV</a></div><div className="lead-list">{leads.map(lead=><div className="lead-row" key={lead.id}><strong>{lead.name}</strong><span>{lead.email}</span><span>{lead.company||'-'}</span><span>{lead.designation||'-'}</span><small>{lead.whitepaper_title}</small><small>{lead.timeline} • {lead.industry||'Industry not set'}</small></div>)}{leads.length===0&&<p>No leads yet. Unlock a whitepaper from the public site to test the flow.</p>}</div></div>}
function AdminContacts({ token }){const [contacts,setContacts]=useState([]);useEffect(()=>{apiGet('/api/admin/contacts',token).then(setContacts).catch(console.error)},[token]);return <div className="admin-card"><div className="row-heading"><div><h2>Contact Enquiries</h2><p>Captured from the public contact dialog.</p></div></div><div className="lead-list">{contacts.map(c=><div className="lead-row" key={c.id}><strong>{c.name}</strong><span>{c.email}</span><span>{c.company||'-'}</span><span>{c.interest_area||'-'}</span><small>{c.mobile||'Mobile not set'} • {c.designation||'Designation not set'}</small><small>{c.message||'No message'}</small></div>)}{contacts.length===0&&<p>No contact enquiries yet. Submit the public contact dialog to test the flow.</p>}</div></div>}
function AdminLinkedIn({ token }){const [items,setItems]=useState([]);const [selectedPost,setSelectedPost]=useState(null);const [notice,setNotice]=useState('');async function load(){setItems(await apiGet('/api/admin/launches',token))} useEffect(()=>{load().catch(console.error)},[token]);async function generate(id){setSelectedPost(await apiGet(`/api/admin/linkedin/post/${id}`,token))} async function processDue(){const res=await apiPost('/api/admin/launches/process-due',{},token);setNotice(`Processed due launches. Published count: ${res.published_count}`);await load()} async function copyText(text){await navigator.clipboard.writeText(text);setNotice('Copied LinkedIn post text to clipboard.')} return <div className="linkedin-layout"><div className="admin-card"><div className="row-heading"><div><h2>Launch & LinkedIn Queue</h2><p>Generate LinkedIn-ready posts with UTM tracking links.</p></div><button className="primary small" onClick={processDue}><CalendarClock size={16}/> Process Due Launches</button></div>{notice&&<p className="notice">{notice}</p>}<table className="admin-table"><thead><tr><th>Title</th><th>Status</th><th>Launch</th><th>LinkedIn</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.title}</td><td><span className={`status ${item.status.toLowerCase()}`}>{item.status}</span></td><td>{item.launch_at||'-'}</td><td><button className="secondary tiny" onClick={()=>generate(item.id)}>Generate</button></td></tr>)}</tbody></table></div><div className="admin-card linkedin-preview"><h2>LinkedIn Post Preview</h2>{selectedPost?<>{selectedPost.poster_url&&<img src={selectedPost.poster_url} alt="LinkedIn poster"/>}<textarea readOnly value={selectedPost.post_text}/><div className="hero-actions"><button className="primary small" onClick={()=>copyText(selectedPost.post_text)}>Copy Post</button><a className="secondary link-button small" href={selectedPost.tracking_url} target="_blank" rel="noreferrer">Open Tracking Link</a></div></>:<p>Select a whitepaper and click Generate. This first build prepares the post and tracking link for manual LinkedIn publishing.</p>}</div></div>}

function AdminLeadAgent({ token }){
  const [sourceText,setSourceText]=useState('');
  const [query,setQuery]=useState('Identify CIOs and technology decision owners at companies announcing new projects, new roles, data, AI, platform and transformation initiatives');
  const [mode,setMode]=useState('cio');
  const [sourcePlan,setSourcePlan]=useState([]);
  const [salesPlan,setSalesPlan]=useState(null);
  const [salesNavText,setSalesNavText]=useState('');
  const [salesNavName,setSalesNavName]=useState('CIO / Technology Decision Makers');
  const [salesNavUrl,setSalesNavUrl]=useState('');
  const [prospects,setProspects]=useState([]);
  const [selected,setSelected]=useState(null);
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);
  async function load(){setProspects(await apiGet('/api/admin/prospect-leads',token));}
  useEffect(()=>{load().catch(console.error);apiGet('/api/admin/lead-agent/source-plan',token).then(r=>setSourcePlan(r.sources||[])).catch(()=>{});apiGet('/api/admin/sales-navigator/playbook',token).then(r=>setSalesPlan(r)).catch(()=>{})},[token]);
  function parseSources(){
    return sourceText.split('\n---\n').map(block=>block.trim()).filter(Boolean).map(block=>{
      const lines=block.split('\n');
      const first=lines[0]||'';
      const isUrl=first.startsWith('http');
      return {platform:'Manual LinkedIn / Social Import', url:isUrl?first:'', text:isUrl?lines.slice(1).join('\n'):block};
    });
  }
  async function runAgent(runMode=mode, useDemo=false){
    setLoading(true); setNotice('');
    try{
      const sources = useDemo ? [] : parseSources();
      const res=await apiPost('/api/admin/lead-agent/run',{query,sources,mode:runMode},token);
      setMode(runMode);
      setNotice(`${runMode==='cio'?'CIO discovery':'Lead agent'} completed. Sources checked: ${res.source_count}. New lead records created: ${res.created_count}.`);
      await load();
    }catch(e){setNotice('Lead agent run failed. Please check backend logs.');}
    finally{setLoading(false);}
  }
  async function importSalesNavigator(){
    setLoading(true); setNotice('');
    try{
      const res=await apiPost('/api/admin/sales-navigator/import',{saved_search_name:salesNavName,saved_search_url:salesNavUrl,pasted_records:salesNavText,notes:'Imported from Admin Lead Agent Sales Navigator panel'},token);
      setNotice(`Sales Navigator import completed. Records read: ${res.pasted_count}. New lead records created: ${res.created_count}.`);
      setSalesNavText('');
      await load();
    }catch(e){setNotice('Sales Navigator import failed. Please check the pasted data and backend logs.');}
    finally{setLoading(false);}
  }
  async function updateStatus(id,status){await apiPut(`/api/admin/prospect-leads/${id}/status`,{status},token);await load();}
  async function copyEmail(lead){await navigator.clipboard.writeText(`Subject: ${lead.email_subject}\n\n${lead.email_body}`);setNotice('Introductory email copied to clipboard.');}
  const exportUrl=`${API_BASE}/api/admin/export/prospect-leads.csv`;
  return <div className="lead-agent-layout">
    <div className="admin-card lead-agent-runner">
      <div className="form-title"><SearchCheck/><div><h2>CIO Lead Generation Agent</h2><p>Identify CIOs and CIO-equivalent technology decision owners from approved/imported LinkedIn, social, newsroom, RSS, CRM and event sources. The records are stored as prospect leads with appointment emails.</p></div></div>
      <div className="mode-grid"><label className={`mode-card ${mode==='cio'?'active':''}`}><input type="radio" checked={mode==='cio'} onChange={()=>setMode('cio')}/><strong>CIO Discovery</strong><span>Prioritise CIO, Chief Digital Officer, CTO and Head of IT contacts.</span></label><label className={`mode-card ${mode==='general'?'active':''}`}><input type="radio" checked={mode==='general'} onChange={()=>setMode('general')}/><strong>General Signals</strong><span>Find project, role, expansion and innovation leads.</span></label></div>
      <label className="field"><span>Search focus</span><input value={query} onChange={e=>setQuery(e.target.value)} /></label>
      <label className="field"><span>Approved source posts / snippets / company updates</span><textarea className="agent-source-box" value={sourceText} onChange={e=>setSourceText(e.target.value)} placeholder={'Paste LinkedIn/social/news/company snippets here. Separate each source with a line containing ---\n\nExample:\nArjun Rao has joined Meridian Consumer Products as Chief Information Officer to lead ERP modernization, data platform and AI-enabled operations.\n---\nSouthBay Hospitals announced a new digital patient experience platform and appointed Meera Iyer as CIO.'}/></label>
      <div className="hero-actions"><button className="primary" onClick={()=>runAgent(mode,false)} disabled={loading}>{loading?'Running Agent...':mode==='cio'?'Find CIO Leads':'Run Lead Agent'}</button><button className="secondary" onClick={()=>{setSourceText('');runAgent('cio',true);}}>Run CIO Demo Scan</button><button className="secondary" onClick={()=>{setSourceText('');runAgent('general',true);}}>Run General Demo</button><a className="secondary link-button" href={exportUrl} target="_blank" rel="noreferrer">Export Prospects CSV</a></div>
      {notice&&<p className="notice">{notice}</p>}
      <div className="source-plan"><strong>Source coverage for production</strong><div>{sourcePlan.map(src=><span key={src}>{src}</span>)}</div></div>
      <div className="agent-note"><strong>Compliance note:</strong> This local build creates the agent workflow and database. Production monitoring should use Sales Navigator assisted workflows, approved CRM Sync/SNAP permissions where available, RSS/news feeds, company pages, CRM/event imports, and consented data sources. It should not scrape LinkedIn or bypass platform terms.</div>
    </div>
    <div className="admin-card prospect-list-card">
      <div className="row-heading"><div><h2>Prospect Lead Records</h2><p>Each record includes source signal, CIO/CIO-equivalent point of contact, recommended action and appointment email.</p></div></div>
      <div className="prospect-list">{prospects.map(lead=><div className={`prospect-row ${selected?.id===lead.id?'selected':''}`} key={lead.id} onClick={()=>setSelected(lead)}><div><strong>{lead.organization}</strong><span>{lead.signal_type} • {lead.project}</span></div><div><small>{lead.contact_role}</small><b>{lead.confidence}%</b></div></div>)}{prospects.length===0&&<p>No prospect records yet. Run the demo scan or paste source snippets.</p>}</div>
    </div>
    <div className="admin-card prospect-detail-card">
      <h2>Lead Detail & Appointment Email</h2>
      {selected?<><div className="prospect-detail-grid"><p><strong>Organization</strong><span>{selected.organization}</span></p><p><strong>Signal</strong><span>{selected.signal_type}</span></p><p><strong>Project</strong><span>{selected.project}</span></p><p><strong>Suggested POC</strong><span>{selected.contact_name} — {selected.contact_role}</span></p><p><strong>Confidence</strong><span>{selected.confidence}%</span></p><p><strong>Status</strong><select value={selected.status} onChange={e=>updateStatus(selected.id,e.target.value)}><option>Draft</option><option>Verified</option><option>Contacted</option><option>Meeting Requested</option><option>Converted</option><option>Rejected</option></select></p></div><label className="field"><span>Why this is a lead</span><textarea readOnly value={selected.rationale}/></label><label className="field"><span>Source text</span><textarea readOnly value={selected.source_text}/></label><label className="field"><span>Email subject</span><input readOnly value={selected.email_subject}/></label><label className="field"><span>Introductory email</span><textarea className="email-draft-box" readOnly value={selected.email_body}/></label><button className="primary small" onClick={()=>copyEmail(selected)}><Copy size={16}/> Copy Email</button></>:<p>Select a prospect record to view the prepared introductory email.</p>}
    </div>
  </div>
}

function Footer({ setPage, openContact }){return <footer className="footer"><div><strong>TRUFLUX TECHNOLOGIES</strong><p>Consulting • Data & Insights • Innovation • AI Products & Platforms</p><p className="copyright">© 2026 Truflux Technologies. All rights reserved.</p></div><div className="footer-meta"><span>Version: {APP_VERSION}</span><span>Last updated: {UPDATED_DATE}</span><button onClick={openContact}>Contact</button></div></footer>}

createRoot(document.getElementById('root')).render(<App/>);
