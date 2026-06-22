from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from pathlib import Path
import sqlite3, uuid, json, shutil, csv, re, os
from datetime import datetime, timezone
from typing import Optional, Any
from io import StringIO

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "truflux_demo.db"
STORAGE = BASE_DIR / "storage"
UPLOADS = STORAGE / "uploads"
POSTERS = STORAGE / "posters"
UPLOADS.mkdir(parents=True, exist_ok=True)
POSTERS.mkdir(parents=True, exist_ok=True)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "truflux@123")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "demo-admin-token-change-before-production")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://127.0.0.1:5173")

app = FastAPI(title="Truflux Website First Build API", version="1.0.23")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(STORAGE)), name="uploads")

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(row):
    return None if row is None else {k: row[k] for k in row.keys()}

def require_admin(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing admin token")
    token = authorization.replace("Bearer ", "", 1).strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")

def init_db():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS whitepapers (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, summary TEXT NOT NULL, description TEXT,
            category TEXT, seo_title TEXT, meta_description TEXT, status TEXT DEFAULT 'Draft',
            launch_at TEXT, created_at TEXT, updated_at TEXT, pdf_path TEXT, poster_path TEXT,
            linkedin_copy TEXT, downloads INTEGER DEFAULT 0,
            whitepaper_no INTEGER
        )
    """)
    # Migration for older local databases created before running numbers were added.
    try:
        cur.execute("ALTER TABLE whitepapers ADD COLUMN whitepaper_no INTEGER")
    except sqlite3.OperationalError:
        pass
    existing_without_no = cur.execute("SELECT id FROM whitepapers WHERE whitepaper_no IS NULL ORDER BY created_at ASC").fetchall()
    next_no = cur.execute("SELECT COALESCE(MAX(whitepaper_no),0) + 1 AS n FROM whitepapers").fetchone()["n"]
    for row in existing_without_no:
        cur.execute("UPDATE whitepapers SET whitepaper_no=? WHERE id=?", (next_no, row["id"]))
        next_no += 1
    cur.execute("""
        CREATE TABLE IF NOT EXISTS leads (
            id TEXT PRIMARY KEY, whitepaper_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
            mobile TEXT, company TEXT, designation TEXT, industry TEXT, location TEXT, linkedin_profile TEXT,
            interest_area TEXT, business_challenge TEXT, timeline TEXT, consent INTEGER, newsletter INTEGER,
            source TEXT, utm TEXT, referrer TEXT, device TEXT, token TEXT UNIQUE, created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payload TEXT, created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, mobile TEXT,
            company TEXT, designation TEXT, industry TEXT, interest_area TEXT, message TEXT,
            consent INTEGER, source TEXT, utm TEXT, referrer TEXT, device TEXT, created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS prospect_leads (
            id TEXT PRIMARY KEY, source_platform TEXT, source_url TEXT, source_text TEXT,
            signal_type TEXT, organization TEXT, project TEXT, contact_name TEXT, contact_role TEXT,
            confidence INTEGER, rationale TEXT, recommended_action TEXT,
            email_subject TEXT, email_body TEXT, status TEXT DEFAULT 'Draft', created_at TEXT, updated_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lead_agent_runs (
            id TEXT PRIMARY KEY, query TEXT, source_count INTEGER, created_count INTEGER,
            notes TEXT, created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sales_navigator_imports (
            id TEXT PRIMARY KEY, saved_search_name TEXT, saved_search_url TEXT,
            pasted_count INTEGER, created_count INTEGER, notes TEXT, created_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS job_runs (
            id TEXT PRIMARY KEY, job_type TEXT NOT NULL, job_name TEXT NOT NULL,
            status TEXT NOT NULL, result TEXT, created_at TEXT
        )
    """)
    conn.commit(); conn.close(); seed_demo_content()

def simple_pdf(path: Path, title: str, body: str):
    def esc(s: str) -> str:
        return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    lines = [title, "", *body.split("\n")]
    text_ops = ["BT", "/F1 18 Tf", "72 760 Td", f"({esc(lines[0])}) Tj", "/F1 11 Tf"]
    for line in lines[2:22]:
        text_ops.append("0 -18 Td")
        text_ops.append(f"({esc(line[:90])}) Tj")
    text_ops.append("ET")
    stream = "\n".join(text_ops).encode("latin-1", errors="ignore")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        f"5 0 obj << /Length {len(stream)} >> stream\n".encode() + stream + b"\nendstream endobj\n",
    ]
    content = b"%PDF-1.4\n"; offsets = [0]
    for obj in objects:
        offsets.append(len(content)); content += obj
    xref_start = len(content)
    content += f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode()
    for off in offsets[1:]: content += f"{off:010d} 00000 n \n".encode()
    content += f"trailer << /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode()
    path.write_bytes(content)

def poster_svg(path: Path, title: str, subtitle: str):
    # Clean launch poster: no chevron, no heavy frame, only Truflux gradient and editorial copy.
    import html
    safe_title = html.escape(title)
    safe_subtitle = html.escape(subtitle)
    svg = f"""<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='628' viewBox='0 0 1200 628'>
  <defs>
    <linearGradient id='bg' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0' stop-color='#0B0835'/>
      <stop offset='0.42' stop-color='#0838B8'/>
      <stop offset='1' stop-color='#0878F8'/>
    </linearGradient>
    <radialGradient id='soft' cx='18%' cy='18%' r='70%'>
      <stop offset='0' stop-color='#83C7FF' stop-opacity='0.26'/>
      <stop offset='1' stop-color='#071225' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='1200' height='628' fill='url(#bg)'/>
  <rect width='1200' height='628' fill='url(#soft)'/>
  <circle cx='1020' cy='92' r='260' fill='#FFFFFF' opacity='0.06'/>
  <circle cx='960' cy='560' r='360' fill='#071225' opacity='0.20'/>
  <text x='90' y='126' fill='#F8F8F8' font-size='31' font-family='Arial' letter-spacing='7'>TRUFLUX TECHNOLOGIES</text>
  <line x1='90' y1='168' x2='330' y2='168' stroke='#83C7FF' stroke-width='3' opacity='0.8'/>
  <text x='90' y='302' fill='#FFFFFF' font-size='52' font-family='Arial' font-weight='700'>{safe_title}</text>
  <text x='90' y='378' fill='#DDE8FF' font-size='27' font-family='Arial'>{safe_subtitle}</text>
  <text x='90' y='510' fill='#DDE8FF' font-size='24' font-family='Arial'>Strategy-led. Data-driven. AI-enabled. Outcome-focused.</text>
</svg>"""
    path.write_text(svg, encoding="utf-8")

def seed_demo_content():
    conn = get_conn(); cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM whitepapers")
    if cur.fetchone()["c"] > 0:
        conn.close(); return
    samples = [
        ("From Campaigns to Buyer-Facing Platforms", "How enterprises can move beyond marketing activity into measurable digital sales journeys.", "Buyer-Facing Platforms", "This paper explains how campaigns can become structured digital platforms that capture intent, convert prospects, and measure sales outcomes.", "Most organizations run campaigns. Fewer build buyer-facing platforms that convert interest into measurable outcomes.", "from-campaigns-to-platforms"),
        ("Building an AI-Ready Data Foundation", "Why dashboards alone are not enough, and how data foundations enable AI-led decisions.", "Data and Insights", "A practical view on data quality, KPI frameworks, analytics layers, and decision intelligence foundations for AI-enabled enterprises.", "AI readiness starts before the model. It starts with data discipline, governance, decision layers, and insight design.", "ai-ready-data-foundation"),
        ("Consulting-Led Product Engineering", "How to convert strategic ideas into working platforms with discipline, speed, and governance.", "Consulting and Innovation", "A Truflux perspective on combining consulting rigor and product engineering to build practical, usable and measurable platforms.", "The strongest digital products are not only engineered well. They are framed well, governed well, and measured well.", "consulting-led-product-engineering"),
    ]
    for idx, (title, summary, category, desc, linkedin, slug) in enumerate(samples, start=1):
        wp_id = str(uuid.uuid4()); pdf = UPLOADS / f"{slug}.pdf"; poster = POSTERS / f"{slug}.svg"
        simple_pdf(pdf, title, desc + "\n\nThis is a demo placeholder whitepaper for local testing. Upload the real Truflux PDF from the Admin panel.")
        poster_svg(poster, title, summary[:85])
        cur.execute("""
            INSERT INTO whitepapers
            (id, title, summary, description, category, seo_title, meta_description, status, launch_at, created_at, updated_at, pdf_path, poster_path, linkedin_copy, downloads, whitepaper_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Published', ?, ?, ?, ?, ?, ?, 0, ?)
        """, (wp_id, title, summary, desc, category, title + " | Truflux Technologies", summary, now_iso(), now_iso(), now_iso(), str(pdf.relative_to(STORAGE)), str(poster.relative_to(STORAGE)), linkedin, idx))
    conn.commit(); conn.close()

class LoginRequest(BaseModel):
    username: str
    password: str
class LeadRequest(BaseModel):
    whitepaper_id: str
    name: str
    email: str
    mobile: Optional[str] = ""
    company: Optional[str] = ""
    designation: Optional[str] = ""
    industry: Optional[str] = ""
    location: Optional[str] = ""
    linkedin_profile: Optional[str] = ""
    interest_area: Optional[str] = ""
    business_challenge: Optional[str] = ""
    timeline: Optional[str] = "Exploring"
    consent: bool
    newsletter: bool = False
    source: Optional[str] = "website"
    utm: Optional[str] = ""
    referrer: Optional[str] = ""
    device: Optional[str] = ""
class ContactRequest(BaseModel):
    name: str
    email: str
    mobile: Optional[str] = ""
    company: Optional[str] = ""
    designation: Optional[str] = ""
    industry: Optional[str] = ""
    interest_area: Optional[str] = ""
    message: str
    consent: bool
    source: Optional[str] = "contact_page"
    utm: Optional[str] = ""
    referrer: Optional[str] = ""
    device: Optional[str] = ""
class EventRequest(BaseModel):
    event_type: str
    payload: dict[str, Any] = {}
class StatusRequest(BaseModel):
    status: str

class LeadAgentSource(BaseModel):
    platform: Optional[str] = "LinkedIn / Social"
    url: Optional[str] = ""
    text: str
class LeadAgentRunRequest(BaseModel):
    query: Optional[str] = "new projects, new roles, expansions and platform launches"
    sources: list[LeadAgentSource] = []
    mode: Optional[str] = "general"
class ProspectStatusRequest(BaseModel):
    status: str

class SalesNavigatorImportRequest(BaseModel):
    saved_search_name: Optional[str] = "Sales Navigator CIO Search"
    saved_search_url: Optional[str] = ""
    pasted_records: str = ""
    notes: Optional[str] = ""

class JobRunRequest(BaseModel):
    job_type: str
    mode: Optional[str] = "run_now"


@app.on_event("startup")
def startup_event(): init_db()

@app.get("/api/health")
def health(): return {"status":"ok", "service":"Truflux Website First Build API", "version":"1.0.23"}

@app.post("/api/admin/login")
def admin_login(payload: LoginRequest):
    if payload.username == ADMIN_USERNAME and payload.password == ADMIN_PASSWORD:
        return {"token": ADMIN_TOKEN, "name": "Truflux Admin"}
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

@app.get("/api/settings")
def public_settings():
    return {"brand":"Truflux Technologies", "tagline":"Strategy-led. Data-driven. AI-enabled. Outcome-focused.", "primary_color":"#0B0835", "accent_color":"#0878F8", "version":"1.0.23"}

@app.get("/api/whitepapers")
def list_public_whitepapers():
    conn = get_conn(); rows = conn.execute("SELECT * FROM whitepapers WHERE status = 'Published' ORDER BY created_at DESC").fetchall(); conn.close()
    result=[]
    for row in rows:
        d=with_whitepaper_display_fields(row_to_dict(row))
        d.pop("pdf_path", None); result.append(d)
    return result

@app.get("/api/admin/whitepapers")
def list_admin_whitepapers(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    conn = get_conn(); rows = conn.execute("SELECT * FROM whitepapers ORDER BY whitepaper_no DESC, created_at DESC").fetchall(); conn.close()
    return [with_whitepaper_display_fields(row_to_dict(r)) for r in rows]



def extract_pdf_text_for_ai(pdf_file: UploadFile) -> str:
    """Extract text from an uploaded PDF for local AI-style metadata generation.
    Uses pypdf when installed. Falls back to an empty string with a clear response.
    """
    raw = pdf_file.file.read()
    pdf_file.file.seek(0)
    try:
        from pypdf import PdfReader
        from io import BytesIO
        reader = PdfReader(BytesIO(raw))
        parts = []
        for page in reader.pages[:8]:
            try:
                parts.append(page.extract_text() or "")
            except Exception:
                continue
        return "\n".join(parts).strip()
    except Exception:
        return ""

def clean_text_block(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    return text

def infer_category(text: str) -> str:
    t = text.lower()
    category_rules = [
        ("Data and Insights", ["data", "analytics", "dashboard", "kpi", "insight", "decision intelligence", "reporting", "mis"]),
        ("AI Products and Platforms", ["ai", "agentic", "automation", "machine learning", "platform", "llm", "intelligent"]),
        ("Innovation", ["innovation", "prototype", "pilot", "immersive", "experience center", "emerging technology"]),
        ("Consulting", ["consulting", "strategy", "roadmap", "transformation", "operating model", "governance"]),
    ]
    scores = [(cat, sum(1 for k in keys if k in t)) for cat, keys in category_rules]
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[0][0] if scores and scores[0][1] else "Insights"

def generate_whitepaper_metadata(text: str, fallback_name: str = "") -> dict:
    clean = clean_text_block(text)
    lines = [clean_text_block(x) for x in (text or "").splitlines() if clean_text_block(x)]
    candidates = [x for x in lines[:20] if 8 <= len(x) <= 90 and not x.lower().startswith(("page ", "www.", "http"))]
    title = candidates[0] if candidates else Path(fallback_name or "Whitepaper").stem.replace("-", " ").replace("_", " ").title()
    title = re.sub(r"\s+", " ", title).strip()[:90]
    category = infer_category(clean)
    sentences = re.split(r"(?<=[.!?])\s+", clean)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 35]
    if sentences:
        summary = " ".join(sentences[:2])[:320]
        description = " ".join(sentences[:6])[:1200]
    else:
        summary = f"A Truflux perspective on {title.lower()}, prepared for leaders exploring consulting, data, innovation and AI-led platform outcomes."
        description = f"This whitepaper examines {title.lower()} from a Truflux Technologies perspective, highlighting business context, execution considerations, data and technology implications, and practical next steps for decision-makers."
    meta = summary[:155].rstrip(" ,.;")
    seo_title = f"{title} | Truflux Technologies"
    linkedin_copy = (
        f"New Truflux Technologies insight: {title}\n\n"
        f"{summary[:240].rstrip()}\n\n"
        "This whitepaper is intended for leaders evaluating consulting-led, data-driven and AI-enabled execution."
    )
    return {
        "title": title,
        "category": category,
        "summary": summary,
        "description": description,
        "seo_title": seo_title,
        "meta_description": meta,
        "linkedin_copy": linkedin_copy,
        "confidence": 82 if clean else 35,
        "extracted_characters": len(clean),
        "note": "Generated using local PDF text extraction and rule-based AI-style summarisation. Production can connect this endpoint to an LLM for deeper extraction."
    }

def save_upload(file: UploadFile, target_dir: Path) -> str:
    if not file.filename: raise HTTPException(status_code=400, detail="Uploaded file has no filename")
    ext = Path(file.filename).suffix.lower(); safe_name = f"{uuid.uuid4().hex}{ext}"; target_path = target_dir / safe_name
    with target_path.open("wb") as out: shutil.copyfileobj(file.file, out)
    return str(target_path.relative_to(STORAGE))


def with_whitepaper_display_fields(d: dict) -> dict:
    no = d.get("whitepaper_no") or 0
    d["whitepaper_number"] = f"WP-{int(no):04d}" if no else "WP-0000"
    if d.get("poster_path"):
        d["poster_url"] = f"http://127.0.0.1:8000/uploads/{d['poster_path']}"
    return d

def next_whitepaper_no(conn) -> int:
    row = conn.execute("SELECT COALESCE(MAX(whitepaper_no),0) + 1 AS n FROM whitepapers").fetchone()
    return int(row["n"] or 1)


@app.post("/api/admin/whitepapers/analyze")
def analyze_whitepaper(authorization: Optional[str] = Header(None), whitepaper_pdf: UploadFile = File(...)):
    require_admin(authorization)
    if not whitepaper_pdf.filename or not whitepaper_pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF whitepaper for AI analysis")
    text = extract_pdf_text_for_ai(whitepaper_pdf)
    metadata = generate_whitepaper_metadata(text, whitepaper_pdf.filename)
    # Defensive logging: the AI fill must still return metadata even if the local
    # demo database is not initialized yet or logging fails.
    try:
        init_db()
        conn = get_conn()
        conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()), "whitepaper_ai_metadata_generated", json.dumps({"filename": whitepaper_pdf.filename, "title": metadata.get("title"), "confidence": metadata.get("confidence")}), now_iso()))
        conn.commit(); conn.close()
    except Exception:
        pass
    return metadata

@app.post("/api/admin/whitepapers")
def create_whitepaper(
    authorization: Optional[str] = Header(None), title: str = Form(""), summary: str = Form(""), description: str = Form(""),
    category: str = Form("Insights"), seo_title: str = Form(""), meta_description: str = Form(""), status: str = Form("Draft"),
    launch_at: str = Form(""), linkedin_copy: str = Form(""), whitepaper_pdf: Optional[UploadFile] = File(None), poster: Optional[UploadFile] = File(None),
):
    require_admin(authorization)
    title = (title or "").strip()
    summary = (summary or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    if not summary:
        raise HTTPException(status_code=400, detail="Short Summary is required")
    if not whitepaper_pdf or not whitepaper_pdf.filename:
        raise HTTPException(status_code=400, detail="Whitepaper PDF is required")
    if not whitepaper_pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Selected whitepaper file must be a PDF")
    status = status if status in ["Draft", "Scheduled", "Published"] else "Draft"
    try:
        pdf_path = save_upload(whitepaper_pdf, UPLOADS)
        poster_path = save_upload(poster, POSTERS) if poster and poster.filename else ""
        wp_id = str(uuid.uuid4())
        conn=get_conn()
        wp_no = next_whitepaper_no(conn)
        conn.execute("""
            INSERT INTO whitepapers (id,title,summary,description,category,seo_title,meta_description,status,launch_at,created_at,updated_at,pdf_path,poster_path,linkedin_copy,downloads,whitepaper_no)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)
        """, (wp_id,title,summary,description,category,seo_title,meta_description,status,launch_at,now_iso(),now_iso(),pdf_path,poster_path,linkedin_copy,wp_no))
        conn.commit(); conn.close()
        return {"id": wp_id, "message":"Whitepaper created", "status": status, "whitepaper_number": f"WP-{wp_no:04d}"}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Whitepaper upload failed: {type(exc).__name__}")

@app.put("/api/admin/whitepapers/{whitepaper_id}")
def update_whitepaper(
    whitepaper_id: str, authorization: Optional[str] = Header(None), title: str = Form(""), summary: str = Form(""), description: str = Form(""),
    category: str = Form("Insights"), seo_title: str = Form(""), meta_description: str = Form(""), status: str = Form("Draft"),
    launch_at: str = Form(""), linkedin_copy: str = Form(""), whitepaper_pdf: Optional[UploadFile] = File(None), poster: Optional[UploadFile] = File(None),
):
    require_admin(authorization)
    title = (title or "").strip(); summary = (summary or "").strip()
    if not title: raise HTTPException(status_code=400, detail="Title is required")
    if not summary: raise HTTPException(status_code=400, detail="Short Summary is required")
    if status not in ["Draft", "Scheduled", "Published"]: status = "Draft"
    conn=get_conn(); existing=conn.execute("SELECT * FROM whitepapers WHERE id=?", (whitepaper_id,)).fetchone()
    if not existing:
        conn.close(); raise HTTPException(status_code=404, detail="Whitepaper not found")
    pdf_path = existing["pdf_path"]
    poster_path = existing["poster_path"] or ""
    if whitepaper_pdf and whitepaper_pdf.filename:
        if not whitepaper_pdf.filename.lower().endswith(".pdf"):
            conn.close(); raise HTTPException(status_code=400, detail="Selected whitepaper file must be a PDF")
        pdf_path = save_upload(whitepaper_pdf, UPLOADS)
    if poster and poster.filename:
        poster_path = save_upload(poster, POSTERS)
    conn.execute("""
        UPDATE whitepapers
        SET title=?, summary=?, description=?, category=?, seo_title=?, meta_description=?, status=?, launch_at=?, updated_at=?, pdf_path=?, poster_path=?, linkedin_copy=?
        WHERE id=?
    """, (title,summary,description,category,seo_title,meta_description,status,launch_at,now_iso(),pdf_path,poster_path,linkedin_copy,whitepaper_id))
    conn.commit(); conn.close()
    return {"message":"Whitepaper updated", "id": whitepaper_id, "status": status}

@app.delete("/api/admin/whitepapers/{whitepaper_id}")
def delete_whitepaper(whitepaper_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    conn=get_conn(); existing=conn.execute("SELECT * FROM whitepapers WHERE id=?", (whitepaper_id,)).fetchone()
    if not existing:
        conn.close(); raise HTTPException(status_code=404, detail="Whitepaper not found")
    # Keep captured leads for audit/history, but remove the whitepaper from public/admin library.
    conn.execute("DELETE FROM whitepapers WHERE id=?", (whitepaper_id,))
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),"whitepaper_deleted",json.dumps({"whitepaper_id":whitepaper_id,"title":existing["title"]}),now_iso()))
    conn.commit(); conn.close()
    return {"message":"Whitepaper deleted", "id": whitepaper_id}

@app.put("/api/admin/whitepapers/{whitepaper_id}/status")
def update_status(whitepaper_id: str, payload: StatusRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    if payload.status not in ["Draft", "Scheduled", "Published"]: raise HTTPException(status_code=400, detail="Invalid status")
    conn=get_conn(); conn.execute("UPDATE whitepapers SET status=?, updated_at=? WHERE id=?", (payload.status, now_iso(), whitepaper_id)); conn.commit(); conn.close()
    return {"message":"Status updated"}

@app.post("/api/leads")
def create_lead(payload: LeadRequest, request: Request):
    if not payload.consent: raise HTTPException(status_code=400, detail="Consent is required before unlocking the whitepaper")
    conn=get_conn(); wp=conn.execute("SELECT * FROM whitepapers WHERE id=? AND status='Published'", (payload.whitepaper_id,)).fetchone()
    if not wp: conn.close(); raise HTTPException(status_code=404, detail="Whitepaper not available")
    lead_id=str(uuid.uuid4()); token=uuid.uuid4().hex; ua=request.headers.get("user-agent", "")
    conn.execute("""
        INSERT INTO leads (id,whitepaper_id,name,email,mobile,company,designation,industry,location,linkedin_profile,interest_area,business_challenge,timeline,consent,newsletter,source,utm,referrer,device,token,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (lead_id,payload.whitepaper_id,payload.name,payload.email,payload.mobile,payload.company,payload.designation,payload.industry,payload.location,payload.linkedin_profile,payload.interest_area,payload.business_challenge,payload.timeline,int(payload.consent),int(payload.newsletter),payload.source,payload.utm,payload.referrer,payload.device or ua[:220],token,now_iso()))
    conn.execute("UPDATE whitepapers SET downloads = downloads + 1 WHERE id=?", (payload.whitepaper_id,))
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),"whitepaper_lead_submit",json.dumps({"whitepaper_id":payload.whitepaper_id,"lead_id":lead_id}),now_iso()))
    conn.commit(); conn.close()
    return {"message":"Whitepaper unlocked", "lead_id":lead_id, "download_url": f"http://127.0.0.1:8000/api/download/whitepaper/{payload.whitepaper_id}?lead_token={token}"}

@app.get("/api/download/whitepaper/{whitepaper_id}")
def download_whitepaper(whitepaper_id: str, lead_token: str):
    conn=get_conn(); lead=conn.execute("SELECT * FROM leads WHERE whitepaper_id=? AND token=?", (whitepaper_id, lead_token)).fetchone(); wp=conn.execute("SELECT * FROM whitepapers WHERE id=?", (whitepaper_id,)).fetchone()
    if not lead or not wp: conn.close(); raise HTTPException(status_code=403, detail="Invalid or expired download link")
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),"whitepaper_download",json.dumps({"whitepaper_id":whitepaper_id,"lead_id":lead["id"]}),now_iso()))
    conn.commit(); conn.close(); path=STORAGE / wp["pdf_path"]
    if not path.exists(): raise HTTPException(status_code=404, detail="PDF file not found")
    return FileResponse(path, media_type="application/pdf", filename=path.name)


@app.post("/api/contact")
def create_contact(payload: ContactRequest, request: Request):
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent is required before submitting the enquiry")
    contact_id=str(uuid.uuid4()); ua=request.headers.get("user-agent", "")
    conn=get_conn()
    conn.execute("""
        INSERT INTO contacts (id,name,email,mobile,company,designation,industry,interest_area,message,consent,source,utm,referrer,device,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, (contact_id,payload.name,payload.email,payload.mobile,payload.company,payload.designation,payload.industry,payload.interest_area,payload.message,int(payload.consent),payload.source,payload.utm,payload.referrer,payload.device or ua[:220],now_iso()))
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),"contact_submit",json.dumps({"contact_id":contact_id,"interest_area":payload.interest_area}),now_iso()))
    conn.commit(); conn.close()
    return {"message":"Contact enquiry captured", "contact_id": contact_id}

@app.get("/api/admin/contacts")
def list_contacts(authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn(); rows=conn.execute("SELECT * FROM contacts ORDER BY created_at DESC").fetchall(); conn.close(); return [row_to_dict(r) for r in rows]

@app.get("/api/admin/leads")
def list_leads(authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn(); rows=conn.execute("""
        SELECT leads.*, whitepapers.title AS whitepaper_title FROM leads LEFT JOIN whitepapers ON whitepapers.id=leads.whitepaper_id ORDER BY leads.created_at DESC
    """).fetchall(); conn.close(); return [row_to_dict(r) for r in rows]

@app.post("/api/events")
def create_event(payload: EventRequest):
    conn=get_conn(); conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),payload.event_type,json.dumps(payload.payload),now_iso())); conn.commit(); conn.close(); return {"message":"event recorded"}

@app.get("/api/admin/analytics")
def analytics(authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn()
    total_leads=conn.execute("SELECT COUNT(*) AS c FROM leads").fetchone()["c"]; total_contacts=conn.execute("SELECT COUNT(*) AS c FROM contacts").fetchone()["c"]; total_whitepapers=conn.execute("SELECT COUNT(*) AS c FROM whitepapers").fetchone()["c"]
    published=conn.execute("SELECT COUNT(*) AS c FROM whitepapers WHERE status='Published'").fetchone()["c"]; scheduled=conn.execute("SELECT COUNT(*) AS c FROM whitepapers WHERE status='Scheduled'").fetchone()["c"]
    downloads=conn.execute("SELECT COALESCE(SUM(downloads),0) AS c FROM whitepapers").fetchone()["c"]; events=conn.execute("SELECT event_type, COUNT(*) AS count FROM events GROUP BY event_type ORDER BY count DESC").fetchall()
    top=conn.execute("SELECT title, category, downloads FROM whitepapers ORDER BY downloads DESC, created_at DESC LIMIT 5").fetchall(); conn.close()
    return {"total_leads":total_leads,"total_contacts":total_contacts,"total_whitepapers":total_whitepapers,"published_whitepapers":published,"scheduled_whitepapers":scheduled,"downloads":downloads,"events":[row_to_dict(r) for r in events],"top_whitepapers":[row_to_dict(r) for r in top]}

@app.get("/api/admin/launches")
def launch_queue(authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn(); rows=conn.execute("SELECT * FROM whitepapers ORDER BY COALESCE(launch_at, created_at) ASC").fetchall(); conn.close(); result=[]
    for row in rows:
        d=row_to_dict(row); d["public_url"]=f"{PUBLIC_BASE_URL}/?whitepaper={d['id']}&utm_source=linkedin&utm_medium=social&utm_campaign=whitepaper_launch"
        if d.get("poster_path"): d["poster_url"] = f"http://127.0.0.1:8000/uploads/{d['poster_path']}"
        result.append(d)
    return result

@app.post("/api/admin/launches/process-due")
def process_due_launches(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = process_due_whitepaper_launches()
    return {"published_count": result["published_count"], "published_ids": result["published_ids"]}

@app.get("/api/admin/linkedin/post/{whitepaper_id}")
def linkedin_post(whitepaper_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn(); wp=conn.execute("SELECT * FROM whitepapers WHERE id=?", (whitepaper_id,)).fetchone(); conn.close()
    if not wp: raise HTTPException(status_code=404, detail="Whitepaper not found")
    d=row_to_dict(wp); campaign=(d.get("category") or "whitepaper").lower().replace(" ", "_").replace("&", "and")
    tracking_url=f"{PUBLIC_BASE_URL}/?whitepaper={d['id']}&utm_source=linkedin&utm_medium=social&utm_campaign={campaign}_launch"
    copy=d.get("linkedin_copy") or f"New Truflux Technologies whitepaper: {d['title']}\n\n{d['summary']}"
    post=f"{copy}\n\nDownload the whitepaper: {tracking_url}\n\n#TrufluxTechnologies #AI #DataAndInsights #Innovation #TechnologyConsulting"
    poster_url=f"http://127.0.0.1:8000/uploads/{d['poster_path']}" if d.get("poster_path") else ""
    return {"post_text":post,"tracking_url":tracking_url,"poster_url":poster_url}


LEAD_SIGNAL_KEYWORDS = {
    "New Project": ["new project", "launch", "launched", "rollout", "implementation", "opening", "greenfield", "expansion", "new facility", "digital transformation"],
    "New Role": ["joined as", "appointed", "promoted", "new role", "chief", "head of", "vp", "director", "cxo", "lead"],
    "Funding / Growth": ["funding", "raised", "series", "investment", "growth", "scale", "expanding"],
    "Technology Initiative": ["ai", "data", "analytics", "platform", "automation", "digital", "cloud", "customer experience", "cx", "insights"]
}
ROLE_PRIORITY = ["chief information officer", "cio", "chief digital officer", "chief technology officer", "cto", "cdo", "chief data officer", "chief ai officer", "head of information technology", "head of it", "head of digital", "head of technology", "head of data", "head of innovation", "head of transformation", "vp technology", "director technology", "founder", "ceo"]

CIO_SEARCH_SOURCES = [
    "LinkedIn Sales Navigator saved searches and lead lists (assisted import / approved CRM sync)",
    "LinkedIn company and people posts (approved/manual/API import)",
    "Company websites and leadership pages",
    "Press releases and newsroom posts",
    "Startup/project announcement feeds",
    "Industry association updates",
    "Job/role announcement posts",
    "CRM and event attendee imports",
    "RSS/news feed imports",
]

def normalize_org_name(name: str) -> str:
    name = clean_text(name).strip(' .,-:;')
    bad_prefixes = ['the ', 'a ', 'an ']
    for prefix in bad_prefixes:
        if name.lower().startswith(prefix):
            name = name[len(prefix):]
    return name[:90] or 'Organization to verify'

def infer_person_name(text: str) -> str:
    # Common role-announcement patterns: "Jane Rao joined Acme as CIO" or "Acme appoints Jane Rao as CIO".
    patterns = [
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:has\s+)?(?:joined|appointed|promoted|named|takes over|assumes)",
        r"(?:appoints|names|promotes|hires)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s+(?:as|to)",
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*,?\s+(?:Chief Information Officer|CIO|Chief Digital Officer|Chief Technology Officer|CTO)",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return clean_text(m.group(1))
    return 'To be identified'

def infer_cio_contact(text: str) -> tuple[str, str, int]:
    lower = text.lower()
    name = infer_person_name(text)
    if 'chief information officer' in lower or re.search(r"\bcio\b", lower):
        return name, 'Chief Information Officer (CIO)', 92 if name != 'To be identified' else 82
    if 'chief digital officer' in lower:
        return name, 'Chief Digital Officer / CIO equivalent', 86
    if 'chief technology officer' in lower or re.search(r"\bcto\b", lower):
        return name, 'Chief Technology Officer / CIO equivalent', 84
    if 'head of it' in lower or 'head of information technology' in lower:
        return name, 'Head of IT / CIO equivalent', 78
    if any(k in lower for k in ['digital transformation', 'enterprise technology', 'erp', 'cloud', 'ai platform', 'data platform', 'analytics', 'automation']):
        return 'To be identified', 'Chief Information Officer (CIO) / Technology Decision Owner', 72
    return 'To be identified', 'Chief Information Officer (CIO) to verify', 62

def infer_cio_company(text: str) -> str:
    # More CIO-centric organization extraction.
    patterns = [
        r"(?:at|with|for|from)\s+([A-Z][A-Za-z0-9&.\- ]{2,70})\s+(?:as|to|where|announced|has|will|is|,)" ,
        r"([A-Z][A-Za-z0-9&.\- ]{2,70})\s+(?:appoints|names|hires|promotes|announced|launches|starts|opens|selects)",
        r"(?:CIO|Chief Information Officer)\s+(?:of|at)\s+([A-Z][A-Za-z0-9&.\- ]{2,70})",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return normalize_org_name(re.split(r"\b(today|has|have|will|to|for|with|as|on|in|and)\b", m.group(1))[0])
    return infer_company(text)

def build_cio_intro_email(company: str, contact_name: str, contact_role: str, signal: str, project: str) -> tuple[str, str]:
    recipient = contact_name if contact_name and contact_name != 'To be identified' else contact_role
    subject = f"Introductory conversation on data, AI and platform execution for {company}"
    body = f"""Dear {recipient},

I noticed the recent {signal.lower()} connected to {project} at {company}. Truflux Technologies supports CIOs and technology leadership teams with consulting-led product engineering, Data & Insights platforms, innovation pilots, and AI-enabled execution systems.

Where useful, we help teams move from strategy and business requirements into working platforms, dashboards, automation workflows and measurable outcomes.

Would you be open to a short 20-minute introductory conversation next week to explore whether Truflux can support your current priorities?

Warm regards,
Truflux Technologies"""
    return subject, body

def create_cio_prospect_from_source(source: dict[str, str]) -> dict[str, Any]:
    text = clean_text(source.get('text', ''))
    signal = infer_signal(text)
    organization = infer_cio_company(text)
    contact_name, contact_role, role_confidence = infer_cio_contact(text)
    project = infer_project(text)
    confidence = min(96, role_confidence + (8 if organization != 'Organization to verify' else 0))
    rationale = f"CIO discovery mode identified a technology-leadership buying signal from {source.get('platform','imported source')}. The recommended contact is the CIO or CIO-equivalent because the signal relates to data, AI, digital transformation, platform execution or enterprise technology ownership."
    action = "Verify the CIO/contact identity and email from approved sources, then send the appointment request."
    subject, body = build_cio_intro_email(organization, contact_name, contact_role, signal, project)
    return {"id": str(uuid.uuid4()), "source_platform": source.get("platform", "CIO Finder / Imported Source"), "source_url": source.get("url", ""), "source_text": text, "signal_type": "CIO Discovery - " + signal, "organization": organization, "project": project, "contact_name": contact_name, "contact_role": contact_role, "confidence": confidence, "rationale": rationale, "recommended_action": action, "email_subject": subject, "email_body": body, "status": "Draft", "created_at": now_iso(), "updated_at": now_iso()}

def demo_cio_sources() -> list[dict[str, str]]:
    return [
        {"platform":"LinkedIn / demo", "url":"", "text":"Arjun Rao has joined Meridian Consumer Products as Chief Information Officer to lead the company-wide ERP modernization, data platform and AI-enabled sales operations program."},
        {"platform":"Company Newsroom / demo", "url":"", "text":"SouthBay Hospitals announced a new digital patient experience platform and appointed Meera Iyer as CIO to accelerate analytics, cloud and automation across the group."},
        {"platform":"Industry News / demo", "url":"", "text":"Vistara Realty launches a new mixed-use township and is investing in immersive buyer engagement, CRM integration, and digital experience platforms under its enterprise technology office."},
        {"platform":"Press Release / demo", "url":"", "text":"NorthGrid Manufacturing names Ravi Menon as Chief Digital Officer to lead plant analytics, connected operations and AI workflow execution across 18 sites."},
        {"platform":"Social / demo", "url":"", "text":"Kaveri Retail Group opens 40 new stores and announces customer intelligence, POS analytics and supply-chain visibility as top technology priorities for the year."},
    ]

def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "")).strip()

def infer_signal(text: str) -> str:
    lower = text.lower()
    scores = []
    for signal, keywords in LEAD_SIGNAL_KEYWORDS.items():
        scores.append((sum(1 for k in keywords if k in lower), signal))
    scores.sort(reverse=True)
    return scores[0][1] if scores and scores[0][0] > 0 else "Market Signal"

def infer_company(text: str) -> str:
    patterns = [r"(?:at|for|with|by|from)\s+([A-Z][A-Za-z0-9&.\- ]{2,55})", r"([A-Z][A-Za-z0-9&.\- ]{2,55})\s+(?:announced|launches|launched|appoints|opens|starts|wins)"]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            company = clean_text(m.group(1)).strip(" .,-")
            stop = re.split(r"(today|has|have|is|will|to|for|with|as|on|in)", company)[0].strip()
            return stop[:80] or company[:80]
    return "Organization to verify"

def infer_contact(text: str) -> tuple[str, str]:
    lower = text.lower()
    for role in ROLE_PRIORITY:
        if role in lower:
            return "To be identified", role.title()
    if "new role" in lower or "joined as" in lower or "appointed" in lower:
        m = re.search(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}).{0,80}(?:joined|appointed|promoted|new role|as)", text)
        if m: return m.group(1), "Recently announced role holder"
    return "To be identified", "Head of Digital / Data / Innovation / Transformation"

def infer_project(text: str) -> str:
    text = clean_text(text)
    phrases = ["new project", "digital transformation", "AI", "data platform", "customer experience", "analytics", "expansion", "automation"]
    for phrase in phrases:
        if phrase.lower() in text.lower():
            return phrase.title()
    return text[:90] + ("..." if len(text) > 90 else "")

def build_intro_email(company: str, contact_role: str, signal: str, project: str) -> tuple[str, str]:
    subject = f"Exploring {project} support for {company}"
    body = f"""Dear {contact_role},

I noticed the recent {signal.lower()} around {project} at {company}. Truflux Technologies works with leadership teams on consulting-led product engineering, Data & Insights, innovation programs, and AI-enabled platforms that move from concept to measurable execution.

It would be useful to understand whether there is an opportunity to support your team with strategy, solution design, dashboards, platform engineering, or AI workflow implementation.

Would you be open to a short 20-minute introductory conversation next week?

Warm regards,
Truflux Technologies"""
    return subject, body

def demo_social_sources() -> list[dict[str, str]]:
    return [
        {"platform":"LinkedIn / demo", "url":"", "text":"Acme Realty announced a new premium township project and is investing in digital buyer engagement and immersive sales experiences for the launch."},
        {"platform":"LinkedIn / demo", "url":"", "text":"Priya Menon has joined NorthGrid Manufacturing as Head of Digital Transformation to lead plant analytics, automation and enterprise data initiatives."},
        {"platform":"Social / demo", "url":"", "text":"CityCare Hospitals is launching a new patient experience platform with AI-enabled appointment flows, dashboards and operational reporting."},
        {"platform":"News / demo", "url":"", "text":"Kaveri Retail Group opens 40 new stores and announces investment in customer intelligence, POS analytics and supply-chain visibility."}
    ]

def create_prospect_from_source(source: dict[str, str]) -> dict[str, Any]:
    text = clean_text(source.get("text", ""))
    signal = infer_signal(text); organization = infer_company(text); contact_name, contact_role = infer_contact(text); project = infer_project(text)
    confidence = 86 if organization != "Organization to verify" else 62
    rationale = f"Detected {signal.lower()} based on public/source text. Suggested contact is the likely budget or program owner for consulting, data, innovation or AI platform work."
    action = "Verify contact details, personalize note, then send appointment request."
    subject, body = build_intro_email(organization, contact_role, signal, project)
    return {"id": str(uuid.uuid4()), "source_platform": source.get("platform", "Social / Web"), "source_url": source.get("url", ""), "source_text": text, "signal_type": signal, "organization": organization, "project": project, "contact_name": contact_name, "contact_role": contact_role, "confidence": confidence, "rationale": rationale, "recommended_action": action, "email_subject": subject, "email_body": body, "status": "Draft", "created_at": now_iso(), "updated_at": now_iso()}


SALES_NAVIGATOR_SEARCH_TEMPLATES = [
    {
        "name": "CIO / Technology Decision Makers",
        "filters": "Title: CIO OR Chief Information Officer OR Chief Digital Officer OR CTO OR Head of IT; Seniority: CXO, VP, Director; Geography: India / target markets; Company headcount: 200+",
        "use_case": "Find technology owners for consulting, data, AI platform and innovation conversations."
    },
    {
        "name": "New Role Signals",
        "filters": "Posted on LinkedIn in last 30 days; keywords: joined, appointed, promoted, CIO, digital transformation, data platform, AI",
        "use_case": "Detect leaders who recently moved into decision-making roles and may be setting the agenda."
    },
    {
        "name": "Project / Expansion Signals",
        "filters": "Company news keywords: launch, expansion, new project, platform, modernization, automation, analytics, customer experience",
        "use_case": "Identify companies starting initiatives that may require Truflux consulting and platform execution."
    },
    {
        "name": "Account List Follow-up",
        "filters": "Saved accounts + technology titles + recent activity + mutual connections",
        "use_case": "Prioritize relationship-led outreach and appointment requests."
    }
]

def split_sales_nav_records(text: str) -> list[str]:
    text = (text or '').replace('\r\n','\n').strip()
    if not text:
        return []
    if '\n---\n' in text:
        return [b.strip() for b in text.split('\n---\n') if b.strip()]
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    # CSV/TSV export-like paste is not officially available from standard Sales Navigator, but users often paste table-like rows from approved CRM sync exports.
    if len(lines) > 1 and any(sep in lines[0].lower() for sep in [',', '\t', '|']):
        return lines[1:] if any(h in lines[0].lower() for h in ['name','company','title','role']) else lines
    # Group every non-empty line as a record for copy/paste from Sales Navigator lead cards.
    return lines

def parse_sales_nav_record(block: str) -> dict[str, str]:
    raw = clean_text(block)
    result = {"raw": raw, "name": "To be identified", "title": "Chief Information Officer (CIO) / Technology Decision Owner", "company": "Organization to verify", "location": "", "profile_url": ""}
    if not raw:
        return result
    if raw.startswith('http'):
        result['profile_url'] = raw.split()[0]
    # Try delimited records: Name, Title, Company, Location, URL
    sep = '\t' if '\t' in block else ('|' if '|' in block else ',')
    parts = [clean_text(x) for x in block.split(sep)] if sep in block else []
    if len(parts) >= 3:
        result['name'] = parts[0] or result['name']
        result['title'] = parts[1] or result['title']
        result['company'] = parts[2] or result['company']
        if len(parts) > 3: result['location'] = parts[3]
        if len(parts) > 4 and parts[4].startswith('http'): result['profile_url'] = parts[4]
        return result
    # Natural language / copied card patterns.
    name = infer_person_name(raw)
    if name != 'To be identified':
        result['name'] = name
    title_patterns = [
        r"(Chief Information Officer|CIO|Chief Digital Officer|Chief Technology Officer|CTO|Head of IT|Head of Technology|VP Technology|Director Technology)",
        r"(?:Title|Role)[:\-]\s*([^,|;]{3,80})"
    ]
    for pat in title_patterns:
        m=re.search(pat, raw, re.I)
        if m:
            result['title']=clean_text(m.group(1)); break
    org = infer_cio_company(raw)
    if org and org != 'Organization to verify':
        result['company'] = org
    m = re.search(r"(?:Company|Account)[:\-]\s*([^,|;]{2,90})", raw, re.I)
    if m: result['company'] = normalize_org_name(m.group(1))
    m = re.search(r"https?://\S+", raw)
    if m: result['profile_url'] = m.group(0)
    return result

def create_sales_nav_prospect(record: dict[str, str], saved_search_name: str, saved_search_url: str) -> dict[str, Any]:
    raw = record.get('raw','')
    company = normalize_org_name(record.get('company') or 'Organization to verify')
    contact_name = clean_text(record.get('name') or 'To be identified')
    contact_role = clean_text(record.get('title') or 'Chief Information Officer (CIO) / Technology Decision Owner')
    project = infer_project(raw) if raw else 'Sales Navigator CIO account / lead review'
    signal = 'Sales Navigator CIO Lead'
    confidence = 88 if company != 'Organization to verify' and contact_name != 'To be identified' else (76 if company != 'Organization to verify' else 64)
    rationale = f"Imported from LinkedIn Sales Navigator workflow: {saved_search_name or 'CIO / technology decision maker search'}. The contact is relevant because the Sales Navigator filter targets CIO/CIO-equivalent decision owners for Data & Insights, AI products, innovation and platform execution discussions."
    action = "Open the Sales Navigator lead/profile, verify the person and company context, check recent activity/mutual connections, then send the appointment request through email or LinkedIn according to your outreach policy."
    subject, body = build_cio_intro_email(company, contact_name, contact_role, signal, project)
    return {"id": str(uuid.uuid4()), "source_platform": "LinkedIn Sales Navigator / Approved Import", "source_url": record.get('profile_url') or saved_search_url or "", "source_text": raw, "signal_type": signal, "organization": company, "project": project, "contact_name": contact_name, "contact_role": contact_role, "confidence": confidence, "rationale": rationale, "recommended_action": action, "email_subject": subject, "email_body": body, "status": "Draft", "created_at": now_iso(), "updated_at": now_iso()}

@app.get("/api/admin/sales-navigator/playbook")
def sales_navigator_playbook(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return {
        "integration_mode": "Sales Navigator assisted workflow / approved CRM sync import",
        "templates": SALES_NAVIGATOR_SEARCH_TEMPLATES,
        "workflow": [
            "Create saved searches in Sales Navigator for CIO/CIO-equivalent roles and target account lists.",
            "Review lead cards, recent job changes, account news and shared connections inside Sales Navigator.",
            "Paste approved lead/account snippets or CRM-synced records into this admin module.",
            "The Truflux agent normalizes the lead, identifies the likely point of contact and prepares an appointment email.",
            "Verify the record before outreach and mark the status as Verified / Contacted / Meeting Requested."
        ],
        "note": "This local build does not scrape LinkedIn. It supports Sales Navigator assisted import and can later be connected to official LinkedIn/SNAP/CRM sync permissions where available."
    }

@app.post("/api/admin/sales-navigator/import")
def import_sales_navigator(payload: SalesNavigatorImportRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    blocks = split_sales_nav_records(payload.pasted_records)
    prospects = [create_sales_nav_prospect(parse_sales_nav_record(b), payload.saved_search_name or 'Sales Navigator CIO Search', payload.saved_search_url or '') for b in blocks]
    conn = get_conn(); created = 0
    for p in prospects:
        duplicate = None
        if p.get('source_url'):
            duplicate = conn.execute("SELECT id FROM prospect_leads WHERE source_url=? AND contact_name=? LIMIT 1", (p['source_url'], p['contact_name'])).fetchone()
        if not duplicate:
            duplicate = conn.execute("SELECT id FROM prospect_leads WHERE source_text=? LIMIT 1", (p['source_text'],)).fetchone()
        if duplicate:
            continue
        conn.execute("""
            INSERT INTO prospect_leads (id,source_platform,source_url,source_text,signal_type,organization,project,contact_name,contact_role,confidence,rationale,recommended_action,email_subject,email_body,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (p["id"],p["source_platform"],p["source_url"],p["source_text"],p["signal_type"],p["organization"],p["project"],p["contact_name"],p["contact_role"],p["confidence"],p["rationale"],p["recommended_action"],p["email_subject"],p["email_body"],p["status"],p["created_at"],p["updated_at"]))
        created += 1
    conn.execute("INSERT INTO sales_navigator_imports (id,saved_search_name,saved_search_url,pasted_count,created_count,notes,created_at) VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), payload.saved_search_name or '', payload.saved_search_url or '', len(blocks), created, payload.notes or '', now_iso()))
    conn.execute("INSERT INTO lead_agent_runs (id,query,source_count,created_count,notes,created_at) VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), payload.saved_search_name or 'Sales Navigator import', len(blocks), created, 'Sales Navigator assisted import', now_iso()))
    conn.commit(); conn.close()
    return {"pasted_count": len(blocks), "created_count": created, "message": "Sales Navigator leads imported into prospect database"}

@app.post("/api/admin/lead-agent/run")
def run_lead_agent(payload: LeadAgentRunRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    cio_mode = (payload.mode or "general").lower() in ["cio", "cio_discovery", "find_cios"]
    raw_sources = [s.dict() for s in payload.sources if clean_text(s.text)] or (demo_cio_sources() if cio_mode else demo_social_sources())
    prospects = [create_cio_prospect_from_source(src) if cio_mode else create_prospect_from_source(src) for src in raw_sources]
    conn=get_conn()
    created=0
    for p in prospects:
        duplicate = conn.execute("SELECT id FROM prospect_leads WHERE source_text=? LIMIT 1", (p["source_text"],)).fetchone()
        if duplicate:
            continue
        conn.execute("""
            INSERT INTO prospect_leads (id,source_platform,source_url,source_text,signal_type,organization,project,contact_name,contact_role,confidence,rationale,recommended_action,email_subject,email_body,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (p["id"],p["source_platform"],p["source_url"],p["source_text"],p["signal_type"],p["organization"],p["project"],p["contact_name"],p["contact_role"],p["confidence"],p["rationale"],p["recommended_action"],p["email_subject"],p["email_body"],p["status"],p["created_at"],p["updated_at"]))
        created += 1
    conn.execute("INSERT INTO lead_agent_runs (id,query,source_count,created_count,notes,created_at) VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), payload.query or "", len(raw_sources), created, "Local demo run. Use official APIs/imports for production monitoring.", now_iso()))
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()),"lead_agent_run",json.dumps({"source_count":len(raw_sources),"created_count":created}),now_iso()))
    conn.commit(); conn.close()
    return {"source_count": len(raw_sources), "created_count": created, "message": "Lead agent run completed", "mode": "cio_discovery" if cio_mode else "manual/import demo"}


@app.get("/api/admin/lead-agent/source-plan")
def lead_agent_source_plan(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    return {"sources": CIO_SEARCH_SOURCES, "note": "Use approved APIs, RSS feeds, CRM imports, company pages, public news feeds, and manual/imported LinkedIn/social snippets. This local build does not scrape LinkedIn or bypass site terms."}

@app.get("/api/admin/prospect-leads")
def list_prospect_leads(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    conn=get_conn(); rows=conn.execute("SELECT * FROM prospect_leads ORDER BY created_at DESC").fetchall(); conn.close()
    return [row_to_dict(r) for r in rows]

@app.put("/api/admin/prospect-leads/{lead_id}/status")
def update_prospect_status(lead_id: str, payload: ProspectStatusRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    allowed=["Draft","Verified","Contacted","Meeting Requested","Converted","Rejected"]
    if payload.status not in allowed: raise HTTPException(status_code=400, detail="Invalid status")
    conn=get_conn(); conn.execute("UPDATE prospect_leads SET status=?, updated_at=? WHERE id=?", (payload.status, now_iso(), lead_id)); conn.commit(); conn.close()
    return {"message":"Prospect status updated"}

@app.get("/api/admin/export/prospect-leads.csv")
def export_prospect_leads(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    conn=get_conn(); rows=conn.execute("SELECT * FROM prospect_leads ORDER BY created_at DESC").fetchall(); conn.close(); out=StringIO(); writer=csv.writer(out)
    headers=["created_at","source_platform","source_url","signal_type","organization","project","contact_name","contact_role","confidence","status","rationale","recommended_action","email_subject","email_body","source_text"]
    writer.writerow(headers)
    for row in rows: writer.writerow([row[h] for h in headers])
    export_path=STORAGE / "prospect_leads_export.csv"; export_path.write_bytes(out.getvalue().encode("utf-8")); return FileResponse(export_path, media_type="text/csv", filename="truflux_prospect_leads_export.csv")

@app.get("/api/admin/export/leads.csv")
def export_leads(authorization: Optional[str] = Header(None)):
    require_admin(authorization); conn=get_conn(); rows=conn.execute("""
        SELECT leads.created_at, whitepapers.title AS whitepaper, leads.name, leads.email, leads.mobile, leads.company, leads.designation, leads.industry, leads.location, leads.linkedin_profile, leads.interest_area, leads.business_challenge, leads.timeline, leads.newsletter, leads.source, leads.utm, leads.referrer
        FROM leads LEFT JOIN whitepapers ON whitepapers.id = leads.whitepaper_id ORDER BY leads.created_at DESC
    """).fetchall(); conn.close(); out=StringIO(); writer=csv.writer(out)
    headers=["created_at","whitepaper","name","email","mobile","company","designation","industry","location","linkedin_profile","interest_area","business_challenge","timeline","newsletter","source","utm","referrer"]
    writer.writerow(headers)
    for row in rows: writer.writerow([row[h] for h in headers])
    export_path=STORAGE / "leads_export.csv"; export_path.write_bytes(out.getvalue().encode("utf-8")); return FileResponse(export_path, media_type="text/csv", filename="truflux_leads_export.csv")



def log_job_run(job_type: str, job_name: str, status: str, result: dict[str, Any]) -> dict[str, Any]:
    record = {"id": str(uuid.uuid4()), "job_type": job_type, "job_name": job_name, "status": status, "result": result, "created_at": now_iso()}
    conn = get_conn()
    conn.execute("INSERT INTO job_runs (id,job_type,job_name,status,result,created_at) VALUES (?,?,?,?,?,?)", (record["id"], job_type, job_name, status, json.dumps(result), record["created_at"]))
    conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()), "job_run", json.dumps({"job_type": job_type, "status": status, **result}), now_iso()))
    conn.commit(); conn.close()
    return record

def process_due_whitepaper_launches() -> dict[str, Any]:
    now = now_iso()
    conn = get_conn()
    rows = conn.execute("SELECT id,title,launch_at FROM whitepapers WHERE status='Scheduled' AND launch_at!='' AND launch_at <= ?", (now,)).fetchall()
    ids = [r["id"] for r in rows]
    for wp_id in ids:
        conn.execute("UPDATE whitepapers SET status='Published', updated_at=? WHERE id=?", (now_iso(), wp_id))
        conn.execute("INSERT INTO events (id,event_type,payload,created_at) VALUES (?,?,?,?)", (str(uuid.uuid4()), "whitepaper_scheduled_launch", json.dumps({"whitepaper_id": wp_id}), now_iso()))
    conn.commit(); conn.close()
    return {"published_count": len(ids), "published_ids": ids, "message": "Due scheduled whitepapers processed"}

def run_linkedin_discovery_job() -> dict[str, Any]:
    # Safe local job: uses demo/approved-source style snippets. It does not scrape LinkedIn or bypass platform terms.
    raw_sources = demo_cio_sources()
    prospects = [create_cio_prospect_from_source(src) for src in raw_sources]
    conn = get_conn(); created = 0
    for p in prospects:
        duplicate = conn.execute("SELECT id FROM prospect_leads WHERE source_text=? LIMIT 1", (p["source_text"],)).fetchone()
        if duplicate:
            continue
        conn.execute("""
            INSERT INTO prospect_leads (id,source_platform,source_url,source_text,signal_type,organization,project,contact_name,contact_role,confidence,rationale,recommended_action,email_subject,email_body,status,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (p["id"],p["source_platform"],p["source_url"],p["source_text"],p["signal_type"],p["organization"],p["project"],p["contact_name"],p["contact_role"],p["confidence"],p["rationale"],p["recommended_action"],p["email_subject"],p["email_body"],p["status"],p["created_at"],p["updated_at"]))
        created += 1
    conn.execute("INSERT INTO lead_agent_runs (id,query,source_count,created_count,notes,created_at) VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), "Scheduled CIO discovery / approved LinkedIn-social source review", len(raw_sources), created, "Safe demo job; production should connect only to approved APIs/imports.", now_iso()))
    conn.commit(); conn.close()
    return {"source_count": len(raw_sources), "created_count": created, "message": "CIO discovery job completed using approved/import-safe sample sources"}

@app.get("/api/admin/jobs")
def list_jobs(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    conn = get_conn()
    due = conn.execute("SELECT id,title,status,launch_at,whitepaper_no FROM whitepapers WHERE status='Scheduled' ORDER BY launch_at ASC").fetchall()
    runs = conn.execute("SELECT * FROM job_runs ORDER BY created_at DESC LIMIT 25").fetchall()
    due_count = conn.execute("SELECT COUNT(*) AS c FROM whitepapers WHERE status='Scheduled' AND launch_at!='' AND launch_at <= ?", (now_iso(),)).fetchone()["c"]
    conn.close()
    jobs = [
        {
            "job_type": "whitepaper_launch",
            "job_name": "Whitepaper Scheduled Launch",
            "schedule": "Manual / Due-date processor",
            "status": "Due" if due_count else "Ready",
            "due_count": due_count,
            "description": "Publishes whitepapers whose scheduled launch date/time has arrived."
        },
        {
            "job_type": "linkedin_discovery",
            "job_name": "LinkedIn / Social CIO Discovery",
            "schedule": "Manual approved-source run",
            "status": "Ready",
            "due_count": 0,
            "description": "Runs CIO discovery using approved/imported snippets or official integrations. This local build does not scrape LinkedIn."
        }
    ]
    return {"jobs": jobs, "scheduled_whitepapers": [with_whitepaper_display_fields(row_to_dict(r)) for r in due], "recent_runs": [row_to_dict(r) for r in runs]}

@app.post("/api/admin/jobs/run")
def run_job(payload: JobRunRequest, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    job_type = (payload.job_type or "").strip().lower()
    try:
        if job_type == "whitepaper_launch":
            result = process_due_whitepaper_launches()
            log_job_run(job_type, "Whitepaper Scheduled Launch", "Success", result)
            return result
        if job_type == "linkedin_discovery":
            result = run_linkedin_discovery_job()
            log_job_run(job_type, "LinkedIn / Social CIO Discovery", "Success", result)
            return result
        raise HTTPException(status_code=400, detail="Unknown job type")
    except HTTPException:
        raise
    except Exception as exc:
        result = {"error": str(exc)}
        log_job_run(job_type or "unknown", "Job Execution", "Failed", result)
        raise HTTPException(status_code=500, detail=str(exc))

# ---- Production SPA serving for Railway/Docker ----
# When the frontend is built, FastAPI serves the Vite dist folder from the same Railway service.
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"
if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_ASSETS)), name="frontend-assets")

@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    """Serve the built React app for production routes such as /admin and /whitepapers."""
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        raise HTTPException(status_code=404, detail="Not found")
    requested = FRONTEND_DIST / full_path
    if FRONTEND_DIST.exists() and requested.is_file():
        return FileResponse(requested)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Truflux API is running. Frontend dist not found. Run `cd frontend && npm run build` or use Docker/Railway build."}
