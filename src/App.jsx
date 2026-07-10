import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// ── FIREBASE CONFIG — Seagull ERP ──────────────────────────────
// المفتاح ده مخصص للتعريف بالمشروع فقط وليس سريًا، الحماية الحقيقية
// تكون من خلال Firestore Security Rules (راجع الملاحظة في آخر هذا الملف).
const firebaseConfig = {
  apiKey: "AIzaSyDBLL5zVXs8JYygk3NlEgXEI1tKmF_WfC0",
  authDomain: "seagull-erp.firebaseapp.com",
  projectId: "seagull-erp",
  storageBucket: "seagull-erp.firebasestorage.app",
  messagingSenderId: "159623230830",
  appId: "1:159623230830:web:e3b791c3f30b0665bebd7f",
  measurementId: "G-G4HWVP8T8D",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
// ملحوظة: بعد التجربة، لازم تظبط Firestore Rules من Firebase Console
// (Firestore Database -> Rules) عشان القاعدة متفضلش مفتوحة للجميع.

// ── THEME ──────────────────────────────────────────────────────
const C = {
  navy:   "#1B3A6B", navyL:  "#243F72", navyD:  "#142d54",
  gold:   "#C9A84C", goldL:  "#D4B86A", goldD:  "#A8883C",
  green:  "#1A7A4A", greenL: "#D5F0E3",
  red:    "#C0392B", redL:   "#FDECEA",
  orange: "#E67E22", orangeL:"#FEF3E2",
  purple: "#6C3483", purpleL:"#F0E6FA",
  gray:   "#6B7280", grayL:  "#F2F4F8",
  white:  "#FFFFFF", dark:   "#1a1a2e",
};

// ── DEFAULT USERS / ROLES (seed data — used only once on first run) ──
const DEFAULT_USERS = [
  { id:1, name:"د. عمر سعيد",    role:"CEO",      avatar:"🏢", color:C.navy,   password:"ceo123",
    title:"المدير التنفيذي", perms:["all"] },
  { id:2, name:"م. أحمد محمد",   role:"PM",       avatar:"👷", color:C.green,  password:"pm123",
    title:"مدير المشروع", project:"فيلا الشيخ زايد", perms:["projects","plan","orders","extracts","docs"] },
  { id:3, name:"م. كريم سعد",    role:"SITE_ENG", avatar:"⛑️", color:C.orange, password:"eng123",
    title:"مهندس الموقع", project:"فيلا الشيخ زايد", perms:["plan","orders","warehouse"] },
  { id:4, name:"م. محمود علي",   role:"PM",       avatar:"👷", color:C.green,  password:"pm2123",
    title:"مدير المشروع", project:"مجمع الأعمال",     perms:["projects","plan","orders","extracts","docs"] },
  { id:5, name:"أمين المخزن",    role:"STORE",    avatar:"🏭", color:C.purple, password:"store123",
    title:"أمين المخزن", perms:["warehouse"] },
  { id:6, name:"مقاول الباطن",   role:"SUB",      avatar:"🔧", color:C.gray,   password:"sub123",
    title:"مقاول الباطن", perms:["orders_view"] },
];

const ROLE_LABELS = {
  CEO:"مدير الشركة", PM:"مدير المشروع", SITE_ENG:"مهندس الموقع",
  STORE:"أمين المخزن", SUB:"مقاول الباطن"
};

// ── INITIAL DATA (seed data — used only once on first run) ─────
const INIT = {
  projects:[
    { id:1, name:"فيلا الشيخ زايد",  pm:"م. أحمد محمد",  status:"جاري",  progress:72, budget:850000,  spent:612000,  system:"صحي + تكييف",  gps:"30.0626,31.2497", geofence:200 },
    { id:2, name:"مجمع الأعمال",      pm:"م. محمود علي",  status:"جاري",  progress:45, budget:2100000, spent:945000,  system:"حريق + تكييف", gps:"30.0131,31.4745", geofence:300 },
    { id:3, name:"فندق الساحل",       pm:"م. خالد إبراهيم",status:"جاري", progress:31, budget:4500000, spent:1395000, system:"كامل",          gps:"31.0234,29.7821", geofence:250 },
    { id:4, name:"مصنع العبور",        pm:"م. سامي حسن",   status:"منتهٍ",  progress:98, budget:1200000, spent:1140000, system:"حريق",          gps:"30.2134,31.6543", geofence:200 },
  ],
  plan:[
    { id:1, project:"فيلا الشيخ زايد", item:"مواسير PVC 50mm",       system:"صحي",   unit:"م.ط", qty:500, planned:360, done:360, note:"" },
    { id:2, project:"فيلا الشيخ زايد", item:"تركيبات صحية حمامات",   system:"صحي",   unit:"طقم", qty:12,  planned:9,   done:7,   note:"" },
    { id:3, project:"فيلا الشيخ زايد", item:"وحدات FCU تكييف",       system:"تكييف", unit:"عدد", qty:24,  planned:20,  done:18,  note:"" },
    { id:4, project:"فيلا الشيخ زايد", item:"مواسير نحاس تغذية",     system:"صحي",   unit:"م.ط", qty:300, planned:290, done:280, note:"" },
    { id:5, project:"مجمع الأعمال",    item:"رشاشات Sprinkler",       system:"حريق",  unit:"عدد", qty:450, planned:200, done:190, note:"" },
    { id:6, project:"مجمع الأعمال",    item:"مضخة حريق 750GPM",      system:"حريق",  unit:"عدد", qty:2,   planned:1,   done:1,   note:"" },
    { id:7, project:"مجمع الأعمال",    item:"طفايات CO2",             system:"حريق",  unit:"عدد", qty:80,  planned:40,  done:35,  note:"" },
    { id:8, project:"فندق الساحل",     item:"أنابيق Chilled Water",   system:"تكييف", unit:"م.ط", qty:800, planned:250, done:240, note:"" },
  ],
  warehouse:[
    { id:1, code:"PVC-001", name:"ماسورة PVC 50mm",      formal:"PVC Pipe ⌀50mm",     system:"صحي",   unit:"م.ط", open:200, in:300, out:360, min:50 },
    { id:2, code:"PVC-002", name:"ماسورة PVC 110mm",     formal:"PVC Pipe ⌀110mm",    system:"صحي",   unit:"م.ط", open:150, in:200, out:180, min:30 },
    { id:3, code:"CPR-001", name:"بوري نحاس نص بوصة",   formal:"Copper Pipe 1/2\"",  system:"صحي",   unit:"م.ط", open:100, in:400, out:390, min:50 },
    { id:4, code:"FIT-001", name:"كوع 90 PVC 50mm",      formal:"Elbow 90° PVC 50mm", system:"صحي",   unit:"عدد", open:500, in:800, out:760, min:100 },
    { id:5, code:"FIT-002", name:"فلنشة PN16 DN80",      formal:"Flange PN16 DN80",   system:"صحي",   unit:"عدد", open:50,  in:60,  out:56,  min:20 },
    { id:6, code:"SPR-001", name:"رشاش 68 درجة",         formal:"Sprinkler Head 68°", system:"حريق",  unit:"عدد", open:300, in:500, out:490, min:100 },
    { id:7, code:"FCU-001", name:"فان كويل 2 طن",        formal:"FCU 2 Ton",          system:"تكييف", unit:"عدد", open:10,  in:30,  out:27,  min:5 },
    { id:8, code:"DUC-001", name:"طوبو 300×200",          formal:"Duct 300×200mm",     system:"تكييف", unit:"م.ط", open:200, in:500, out:450, min:50 },
  ],
  orders:[
    { id:1, date:"2024-06-01", time:"08:15", by:"م. أحمد محمد", byRole:"PM", to:"م. كريم سعد", toRole:"SITE_ENG",
      voice:"ركب بوري تليفون خمسين مم الدور التالت طول أربعين متر",
      formal:"تركيب ماسورة PVC ⌀50mm — 40 م.ط — الدور الثالث", status:"✅ منفذ", gps:"✅ في الموقع", sig:"✅ موقّع", project:"فيلا الشيخ زايد" },
    { id:2, date:"2024-06-01", time:"09:30", by:"م. أحمد محمد", byRole:"PM", to:"أمين المخزن", toRole:"STORE",
      voice:"صرف عشرين كوع تسعين DN100 لموقع B",
      formal:"صرف 20 عدد كوع 90° DN100 — موقع B", status:"✅ منفذ", gps:"✅ في الموقع", sig:"✅ موقّع", project:"فيلا الشيخ زايد" },
    { id:3, date:"2024-06-01", time:"10:45", by:"م. أحمد محمد", byRole:"PM", to:"مقاول الباطن", toRole:"SUB",
      voice:"كمّل تركيب وحدات الفان كويل في الدور الأول",
      formal:"استكمال تركيب وحدات FCU — الدور الأول", status:"🔄 جاري", gps:"✅ في الموقع", sig:"⏳ انتظار", project:"فيلا الشيخ زايد" },
    { id:4, date:"2024-06-01", time:"13:00", by:"م. أحمد محمد", byRole:"PM", to:"أمين المخزن", toRole:"STORE",
      voice:"محتاج فلنشة بي ان ستاشر DN80 ست حاجات عاجل",
      formal:"طلب عاجل: فلنشة PN16 DN80 — 6 عدد", status:"⚠️ نقص", gps:"✅ في الموقع", sig:"✅ موقّع", project:"فيلا الشيخ زايد" },
  ],
  extracts:[
    { id:1, project:"فيلا الشيخ زايد", num:"EXT-001", period:"يناير 2024", qty:100, price:850,  status:"✅ معتمد",           submittedBy:"م. أحمد محمد" },
    { id:2, project:"فيلا الشيخ زايد", num:"EXT-002", period:"فبراير 2024",qty:120, price:850,  status:"✅ معتمد",           submittedBy:"م. أحمد محمد" },
    { id:3, project:"مجمع الأعمال",    num:"EXT-001", period:"مارس 2024",  qty:200, price:1200, status:"⏳ قيد المراجعة",    submittedBy:"م. محمود علي" },
    { id:4, project:"فندق الساحل",     num:"EXT-001", period:"أبريل 2024", qty:80,  price:2100, status:"⚠️ اعتراض جزئي",   submittedBy:"م. خالد إبراهيم" },
  ],
  performance:[
    { name:"م. أحمد محمد",  role:"PM",       project:"فيلا الشيخ زايد", total:45, onTime:42, late:3 },
    { name:"م. كريم سعد",   role:"SITE_ENG", project:"فيلا الشيخ زايد", total:60, onTime:57, late:3 },
    { name:"م. محمود علي",  role:"PM",       project:"مجمع الأعمال",     total:38, onTime:32, late:6 },
    { name:"م. خالد إبراهيم",role:"PM",      project:"فندق الساحل",      total:30, onTime:25, late:5 },
    { name:"م. سامي حسن",   role:"PM",       project:"مصنع العبور",       total:52, onTime:51, late:1 },
    { name:"م. هاني فؤاد",  role:"SITE_ENG", project:"مجمع الأعمال",     total:55, onTime:44, late:11},
  ],
};

// ── HELPERS ────────────────────────────────────────────────────
const fmt = n => n?.toLocaleString("ar-EG") ?? "—";
const pct = (a,b) => b ? Math.round(a/b*100) : 0;
const statusColor = s => {
  if (!s) return C.gray;
  if (s.includes("✅")) return C.green;
  if (s.includes("⚠️")) return C.orange;
  if (s.includes("🔄")) return C.navy;
  if (s.includes("⏳")) return C.purple;
  return C.gray;
};
const Badge = ({s}) => (
  <span style={{
    background: statusColor(s)+"22", color: statusColor(s),
    borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700,
    border:`1px solid ${statusColor(s)}44`
  }}>{s}</span>
);

// ── PROGRESS BAR ───────────────────────────────────────────────
const Bar = ({value, max=100, color=C.navy, h=8}) => (
  <div style={{background:"#e5e7eb", borderRadius:h, height:h, overflow:"hidden", width:"100%"}}>
    <div style={{
      width:`${Math.min(100,pct(value,max))}%`, height:h,
      background: value/max < 0.5 ? C.red : value/max < 0.8 ? C.orange : C.green,
      borderRadius:h, transition:"width 0.6s ease"
    }}/>
  </div>
);

// ── KPI CARD ───────────────────────────────────────────────────
const KPI = ({icon, label, value, color, sub}) => (
  <div style={{
    background:C.white, borderRadius:12, padding:"14px 16px",
    boxShadow:"0 2px 8px rgba(0,0,0,0.08)", borderTop:`4px solid ${color}`,
    minWidth:0, flex:1
  }}>
    <div style={{fontSize:22, marginBottom:4}}>{icon}</div>
    <div style={{fontSize:22, fontWeight:800, color, lineHeight:1}}>{value}</div>
    <div style={{fontSize:11, color:C.gray, marginTop:4, fontWeight:600}}>{label}</div>
    {sub && <div style={{fontSize:10, color:C.gray, marginTop:2}}>{sub}</div>}
  </div>
);

// ── SECTION HEADER ─────────────────────────────────────────────
const SHdr = ({icon, title, color=C.navy}) => (
  <div style={{
    display:"flex", alignItems:"center", gap:8, marginBottom:12,
    padding:"8px 14px", background:`${color}11`, borderRadius:8,
    borderRight:`4px solid ${color}`
  }}>
    <span style={{fontSize:16}}>{icon}</span>
    <span style={{fontWeight:700, color, fontSize:14}}>{title}</span>
  </div>
);

// ── TABLE ──────────────────────────────────────────────────────
const Tbl = ({cols, rows, accent=C.navy}) => (
  <div style={{overflowX:"auto", borderRadius:10, border:`1px solid #e5e7eb`}}>
    <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
      <thead>
        <tr style={{background:accent}}>
          {cols.map((c,i)=>(
            <th key={i} style={{padding:"10px 10px", color:C.white, fontWeight:700,
              textAlign:"right", whiteSpace:"nowrap", fontSize:11}}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>(
          <tr key={i} style={{background: i%2===0 ? "#fafafa" : C.white,
            borderBottom:"1px solid #f0f0f0"}}>
            {r.map((cell,j)=>(
              <td key={j} style={{padding:"9px 10px", textAlign:"right",
                whiteSpace: j===3||j===4?"normal":"nowrap"}}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ══════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════

// ── LOGIN ──────────────────────────────────────────────────────
function LoginScreen({users, onLogin}) {
  const [sel, setSel] = useState(null);
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState("");

  const attempt = () => {
    if (!sel) return setErr("اختر مستخداً أولاً");
    if (pw !== sel.password) return setErr("كلمة المرور غير صحيحة");
    onLogin(sel);
  };

  return (
    <div style={{
      minHeight:"100vh", background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyD} 60%, #0a1628 100%)`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      padding:24, fontFamily:"'Cairo', 'Segoe UI', sans-serif"
    }}>
      {/* Logo */}
      <div style={{textAlign:"center", marginBottom:32}}>
        <div style={{fontSize:56, marginBottom:8}}>🦅</div>
        <div style={{color:C.gold, fontSize:24, fontWeight:800, letterSpacing:1}}>Seagull ERP</div>
        <div style={{color:"#94a3b8", fontSize:13, marginTop:4}}>النورس للخدمات الهندسية</div>
        <div style={{color:"#64748b", fontSize:11, marginTop:2}}>نظام إدارة المشاريع الإليكتروميكانيكال</div>
      </div>

      {!users.length ? (
        <div style={{color:"#94a3b8", fontSize:13}}>⏳ جاري تحميل بيانات المستخدمين...</div>
      ) : (
      <>
      {/* User cards */}
      <div style={{width:"100%", maxWidth:480, marginBottom:20}}>
        <div style={{color:"#94a3b8", fontSize:12, marginBottom:10, textAlign:"center"}}>اختر المستخدم</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8}}>
          {users.map(u=>(
            <button key={u.id} onClick={()=>{setSel(u);setErr("");}}
              style={{
                background: sel?.id===u.id ? u.color : "rgba(255,255,255,0.07)",
                border:`2px solid ${sel?.id===u.id ? u.color : "rgba(255,255,255,0.12)"}`,
                borderRadius:10, padding:"12px 8px", cursor:"pointer", transition:"all 0.2s",
                display:"flex", flexDirection:"column", alignItems:"center", gap:4
              }}>
              <span style={{fontSize:22}}>{u.avatar}</span>
              <span style={{color: sel?.id===u.id ? C.white : "#cbd5e1", fontSize:10, fontWeight:700, textAlign:"center"}}>{u.name}</span>
              <span style={{
                color: sel?.id===u.id ? "rgba(255,255,255,0.8)" : "#64748b",
                fontSize:9, textAlign:"center"
              }}>{ROLE_LABELS[u.role]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Password */}
      <div style={{width:"100%", maxWidth:480}}>
        <input
          type="password" placeholder="كلمة المرور"
          value={pw} onChange={e=>{setPw(e.target.value);setErr("");}}
          onKeyDown={e=>e.key==="Enter"&&attempt()}
          style={{
            width:"100%", padding:"12px 16px", borderRadius:10, border:"2px solid rgba(255,255,255,0.15)",
            background:"rgba(255,255,255,0.07)", color:C.white, fontSize:14, textAlign:"right",
            outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:8
          }}
        />
        {err && <div style={{color:"#f87171", fontSize:12, textAlign:"center", marginBottom:8}}>{err}</div>}
        <button onClick={attempt} style={{
          width:"100%", padding:"13px", borderRadius:10, border:"none",
          background:`linear-gradient(135deg, ${C.gold}, ${C.goldD})`,
          color:C.navyD, fontWeight:800, fontSize:15, cursor:"pointer",
          fontFamily:"inherit", letterSpacing:0.5
        }}>دخول ← الداشبورد</button>
      </div>
      </>
      )}
    </div>
  );
}

// ── CEO DASHBOARD ──────────────────────────────────────────────
function CEODashboard({data, user}) {
  const totalBudget = data.projects.reduce((a,p)=>a+p.budget,0);
  const totalSpent  = data.projects.reduce((a,p)=>a+p.spent,0);
  const lowStock = data.warehouse.filter(w=>(w.open+w.in-w.out)<=w.min).length;
  const avgProgress = Math.round(data.projects.reduce((a,p)=>a+p.progress,0)/data.projects.length);
  const pendingExt = data.extracts.filter(e=>e.status.includes("قيد")||e.status.includes("اعتراض")).length;

  return (
    <div>
      {/* KPIs */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20}}>
        <KPI icon="🏗️" label="المشاريع النشطة" value={data.projects.filter(p=>p.status==="جاري").length} color={C.navy}/>
        <KPI icon="📈" label="متوسط الإنجاز" value={`${avgProgress}%`} color={C.green}/>
        <KPI icon="💰" label="إجمالي الميزانيات" value={`${(totalBudget/1000000).toFixed(1)}م`} color={C.gold}/>
        <KPI icon="💸" label="المنصرف الكلي" value={`${(totalSpent/1000000).toFixed(1)}م`} color={C.orange}/>
        <KPI icon="⚠️" label="تنبيهات مخازن" value={lowStock} color={C.red}/>
        <KPI icon="📋" label="مستخلصات معلقة" value={pendingExt} color={C.purple}/>
      </div>

      {/* Projects */}
      <SHdr icon="📋" title="المشاريع — نظرة شاملة" color={C.navy}/>
      <div style={{display:"flex", flexDirection:"column", gap:10, marginBottom:20}}>
        {data.projects.map(p=>(
          <div key={p.id} style={{
            background:C.white, borderRadius:12, padding:14,
            boxShadow:"0 2px 8px rgba(0,0,0,0.07)", borderRight:`4px solid ${p.progress>70?C.green:p.progress>40?C.orange:C.red}`
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8}}>
              <div>
                <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{p.name}</div>
                <div style={{fontSize:11, color:C.gray}}>{p.pm} · {p.system}</div>
              </div>
              <div style={{textAlign:"left"}}>
                <div style={{fontWeight:800, fontSize:16, color:p.progress>70?C.green:p.progress>40?C.orange:C.red}}>{p.progress}%</div>
                <Badge s={p.status==="جاري"?"🔄 جاري":"✅ منتهٍ"}/>
              </div>
            </div>
            <Bar value={p.progress}/>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11}}>
              <span style={{color:C.gray}}>الميزانية: <b style={{color:C.navy}}>{fmt(p.budget)} ج</b></span>
              <span style={{color:C.gray}}>المنصرف: <b style={{color:p.spent/p.budget>p.progress/100+0.1?C.red:C.green}}>{fmt(p.spent)} ج</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance summary */}
      <SHdr icon="🏆" title="تقرير الأداء — سري" color={C.purple}/>
      <Tbl
        accent={C.purple}
        cols={["الاسم","الدور","المشروع","الالتزام","التقييم"]}
        rows={data.performance.map(p=>[
          p.name,
          ROLE_LABELS[p.role]||p.role,
          p.project,
          <div style={{display:"flex", flexDirection:"column", gap:3}}>
            <span style={{fontWeight:700, color:p.onTime/p.total>=0.95?C.green:p.onTime/p.total>=0.7?C.orange:C.red}}>
              {pct(p.onTime,p.total)}%
            </span>
            <Bar value={p.onTime} max={p.total}/>
          </div>,
          <span style={{fontWeight:700, color:p.onTime/p.total>=0.95?C.green:p.onTime/p.total>=0.85?C.orange:C.red}}>
            {p.onTime/p.total>=0.95?"🌟 ممتاز":p.onTime/p.total>=0.85?"✅ جيد جداً":p.onTime/p.total>=0.7?"⚠️ مقبول":"🔴 ضعيف"}
          </span>
        ])}
      />
    </div>
  );
}

// ── ORDERS SCREEN ──────────────────────────────────────────────
function OrdersScreen({data, setData, user, users}) {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft]         = useState(null);
  const [voiceText, setVoiceText] = useState("");
  const [confirm, setConfirm]     = useState(false);
  const [toUser, setToUser]       = useState("");

  const myOrders = data.orders.filter(o=> {
    if(user.role==="CEO") return true;
    if(user.role==="PM"||user.role==="SITE_ENG") return o.by===user.name || o.to===user.name || o.project===user.project;
    if(user.role==="STORE") return o.toRole==="STORE";
    if(user.role==="SUB")   return o.toRole==="SUB";
    return false;
  });

  const canIssue = ["CEO","PM","SITE_ENG"].includes(user.role);

  const glossary = {
    "بوري تليفون":"ماسورة PVC",    "بوري ستاند":"ماسورة PVC",
    "بوري نحاس":"ماسورة نحاسية",  "كوع تسعين":"وصلة 90°",
    "كوع 45":"وصلة 45°",           "فلنشة":"Flange",
    "رشاش":"Sprinkler",            "فان كويل":"FCU",
    "كيلر":"Chiller",              "تراب":"صرف أرضي",
    "سيفون":"Trap",                "مانع ارتداد":"Check Valve",
    "بوري جالفان":"ماسورة مجلفن", "طوبو":"Duct",
    "طفاية":"Extinguisher",        "عداد":"Water Meter",
  };

  const simulateVoice = () => {
    setRecording(true);
    setTimeout(()=>{
      const samples = [
        "ركب بوري تليفون خمسين مم الدور التالت طول أربعين متر",
        "صرف عشرين كوع تسعين DN100 لموقع B من المخزن",
        "اختبر منظومة الرشاشات في المنطقة C بضغط عشرة بار",
        "كمّل تركيب الفان كويل في الدور الأول الوحدات الأربعة",
      ];
      const v = samples[Math.floor(Math.random()*samples.length)];
      setVoiceText(v);
      let formal = v;
      Object.entries(glossary).forEach(([k,val])=>{
        formal = formal.replace(new RegExp(k,"gi"), val);
      });
      setDraft({voice:v, formal, status:"⏳ انتظار تأكيد"});
      setRecording(false);
      setConfirm(true);
    }, 2000);
  };

  const sendOrder = () => {
    if(!draft||!toUser) return;
    const rec = users.find(u=>u.name===toUser);
    const newOrder = {
      id: data.orders.length ? Math.max(...data.orders.map(o=>o.id))+1 : 1,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}),
      by: user.name, byRole: user.role,
      to: toUser, toRole: rec?.role||"",
      voice: draft.voice, formal: draft.formal,
      status:"🔄 جاري", gps:"✅ في الموقع", sig:"✅ موقّع",
      project: user.project||data.projects[0]?.name
    };
    setData(d=>({...d, orders:[newOrder,...d.orders]}));
    setDraft(null); setConfirm(false); setVoiceText(""); setToUser("");
  };

  return (
    <div>
      {canIssue && (
        <div style={{background:C.white, borderRadius:14, padding:16, marginBottom:20,
          boxShadow:"0 4px 16px rgba(0,0,0,0.1)", border:`2px solid ${C.gold}22`}}>
          <SHdr icon="🎤" title="إصدار أمر صوتي جديد" color={C.gold}/>

          {/* Recipient */}
          <div style={{marginBottom:12}}>
            <label style={{fontSize:12, color:C.gray, display:"block", marginBottom:6, fontWeight:600}}>المستلم</label>
            <select value={toUser} onChange={e=>setToUser(e.target.value)}
              style={{width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid #e5e7eb`,
                fontSize:13, textAlign:"right", fontFamily:"inherit", color:C.navy}}>
              <option value="">-- اختر المستلم --</option>
              {users.filter(u=>u.id!==user.id&&u.role!=="CEO").map(u=>(
                <option key={u.id} value={u.name}>{u.avatar} {u.name} — {ROLE_LABELS[u.role]}</option>
              ))}
            </select>
          </div>

          {/* Voice button */}
          <button onClick={simulateVoice} disabled={recording}
            style={{
              width:"100%", padding:"16px", borderRadius:12,
              background: recording ? C.red : `linear-gradient(135deg,${C.navy},${C.navyL})`,
              border:"none", color:C.white, fontWeight:800, fontSize:15,
              cursor: recording?"not-allowed":"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              transition:"all 0.3s", transform: recording?"scale(0.98)":"scale(1)"
            }}>
            <span style={{fontSize:22}}>{recording?"⏺️":"🎤"}</span>
            {recording ? "جاري التسجيل..." : "اضغط وتكلم"}
          </button>

          {/* Draft preview */}
          {confirm && draft && (
            <div style={{marginTop:14, background:`${C.gold}11`, borderRadius:10,
              padding:14, border:`1px solid ${C.gold}44`}}>
              <div style={{fontSize:11, color:C.gray, marginBottom:8, fontWeight:600}}>📝 النص المحوَّل — راجع قبل الإرسال</div>
              <div style={{background:C.white, borderRadius:8, padding:12, marginBottom:8, border:"1px solid #e5e7eb"}}>
                <div style={{fontSize:10, color:C.gray, marginBottom:3}}>لغة الموقع:</div>
                <div style={{fontSize:12, color:C.navy, fontStyle:"italic"}}>«{draft.voice}»</div>
              </div>
              <div style={{background:C.white, borderRadius:8, padding:12, marginBottom:12, border:`1px solid ${C.green}44`}}>
                <div style={{fontSize:10, color:C.green, marginBottom:3, fontWeight:700}}>المصطلح الرسمي (للمستخلص):</div>
                <div style={{fontSize:12, color:C.navy, fontWeight:600}}>«{draft.formal}»</div>
              </div>
              <div style={{display:"flex", gap:8}}>
                <button onClick={sendOrder}
                  style={{flex:1, padding:"11px", borderRadius:8, background:C.green,
                    border:"none", color:C.white, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13}}>
                  ✅ تأكيد وإرسال
                </button>
                <button onClick={()=>{setConfirm(false);setDraft(null);setVoiceText("");}}
                  style={{flex:1, padding:"11px", borderRadius:8, background:"#f1f5f9",
                    border:"none", color:C.gray, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13}}>
                  🔄 أعد التسجيل
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders list */}
      <SHdr icon="📢" title={`سجل الأوامر${user.role==="SUB"?" — أوامرك فقط":""}`} color={C.navy}/>
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {myOrders.map(o=>(
          <div key={o.id} style={{
            background:C.white, borderRadius:12, padding:14,
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            borderRight:`4px solid ${statusColor(o.status)}`
          }}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
              <div style={{fontSize:10, color:C.gray}}>{o.date} — {o.time}</div>
              <Badge s={o.status}/>
            </div>
            <div style={{fontSize:12, color:C.navy, fontWeight:700, marginBottom:4}}>
              {o.by} → {o.to}
            </div>
            <div style={{fontSize:11, color:C.gray, marginBottom:6, fontStyle:"italic"}}>
              «{o.voice}»
            </div>
            <div style={{fontSize:11, color:C.green, fontWeight:600, marginBottom:8,
              background:C.greenL, padding:"6px 10px", borderRadius:6}}>
              📋 {o.formal}
            </div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              <span style={{fontSize:10, color:C.green}}>📍 {o.gps}</span>
              <span style={{fontSize:10, color:C.navy}}>✍️ {o.sig}</span>
              <span style={{fontSize:10, color:C.gray}}>🏗️ {o.project}</span>
            </div>

            {user.role==="SITE_ENG" && o.to===user.name && o.status==="🔄 جاري" && (
              <button onClick={()=>setData(d=>({
                ...d,
                orders:d.orders.map(x=>x.id===o.id?{...x,status:"✅ منفذ",sig:"✅ موقّع"}:x)
              }))}
                style={{width:"100%", marginTop:10, padding:"9px", borderRadius:8,
                  background:C.green, border:"none", color:C.white,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12}}>
                ✅ تأكيد الإنجاز وتوقيع رقمي
              </button>
            )}

            {user.role==="STORE" && o.to===user.name && o.status==="🔄 جاري" && (
              <button onClick={()=>setData(d=>({
                ...d,
                orders:d.orders.map(x=>x.id===o.id?{...x,status:"✅ منفذ",sig:"✅ موقّع"}:x)
              }))}
                style={{width:"100%", marginTop:10, padding:"9px", borderRadius:8,
                  background:C.purple, border:"none", color:C.white,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12}}>
                ✅ تأكيد الصرف من المخزن
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PLAN SCREEN ────────────────────────────────────────────────
function PlanScreen({data, setData, user}) {
  const items = data.plan.filter(p=>
    user.role==="CEO" || p.project===user.project
  );

  const updateDone = (id, val) => {
    setData(d=>({...d, plan:d.plan.map(p=>p.id===id?{...p,done:Number(val)}:p)}));
  };

  const summary = {
    total: items.length,
    done:  items.filter(p=>pct(p.done,p.qty)>=100).length,
    delayed: items.filter(p=>pct(p.done,p.planned)<80).length,
    avgPct: items.length ? Math.round(items.reduce((a,p)=>a+pct(p.done,p.qty),0)/items.length) : 0,
  };

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16}}>
        <KPI icon="📋" label="البنود الكلية" value={summary.total} color={C.navy}/>
        <KPI icon="✅" label="مكتملة" value={summary.done} color={C.green}/>
        <KPI icon="🔴" label="متأخرة" value={summary.delayed} color={C.red}/>
        <KPI icon="📈" label="متوسط الإنجاز" value={`${summary.avgPct}%`} color={C.gold}/>
      </div>

      <SHdr icon="📅" title="خطة التنفيذ التفصيلية" color={C.navy}/>
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {items.map(p=>{
          const prog = pct(p.done, p.qty);
          const planPct = pct(p.planned, p.qty);
          const st = prog>=100?"✅ مكتمل":prog>=planPct*0.9?"🔄 في الموعد":prog>=planPct*0.6?"⚠️ تأخير":  "🔴 متأخر";
          return (
            <div key={p.id} style={{
              background:C.white, borderRadius:12, padding:14,
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              borderRight:`4px solid ${statusColor(st)}`
            }}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{p.item}</div>
                  <div style={{fontSize:11, color:C.gray}}>{p.project} · {p.system}</div>
                </div>
                <Badge s={st}/>
              </div>

              <div style={{marginBottom:8}}>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:C.gray, marginBottom:4}}>
                  <span>المنفذ: <b style={{color:C.navy}}>{p.done}</b>/{p.qty} {p.unit}</span>
                  <span style={{fontWeight:700, color:statusColor(st)}}>{prog}%</span>
                </div>
                <Bar value={p.done} max={p.qty}/>
                <div style={{position:"relative", marginTop:3}}>
                  <div style={{fontSize:10, color:C.orange}}>
                    الهدف المخطط: {p.planned} {p.unit} ({planPct}%)
                  </div>
                </div>
              </div>

              {(user.role==="PM"||user.role==="SITE_ENG") && p.project===user.project && (
                <div style={{display:"flex", gap:8, alignItems:"center", marginTop:8,
                  background:"#f8fafc", borderRadius:8, padding:"8px 10px"}}>
                  <span style={{fontSize:11, color:C.gray, whiteSpace:"nowrap"}}>تحديث المنفذ:</span>
                  <input type="number" min={0} max={p.qty} defaultValue={p.done}
                    onBlur={e=>updateDone(p.id, e.target.value)}
                    style={{width:70, padding:"5px 8px", borderRadius:6, border:"1px solid #e5e7eb",
                      fontSize:12, textAlign:"center", fontFamily:"inherit"}}
                  />
                  <span style={{fontSize:11, color:C.gray}}>{p.unit}</span>
                  <button onClick={e=>{
                    const inp = e.target.parentElement.querySelector("input");
                    updateDone(p.id, inp.value);
                  }} style={{marginRight:"auto", padding:"5px 12px", borderRadius:6,
                    background:C.navy, border:"none", color:C.white,
                    fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit"}}>
                    حفظ
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WAREHOUSE SCREEN ───────────────────────────────────────────
function WarehouseScreen({data, setData, user}) {
  const [filter, setFilter] = useState("الكل");

  const items = data.warehouse.filter(w=>
    filter==="الكل" || w.system===filter
  );

  const updateStock = (id, field, val) => {
    setData(d=>({...d, warehouse:d.warehouse.map(w=>w.id===id?{...w,[field]:Number(val)}:w)}));
  };

  const getStatus = w => {
    const bal = w.open+w.in-w.out;
    if(bal<=0) return "🔴 نفذ";
    if(bal<=w.min) return "⚠️ أمر شراء";
    return "✅ كافٍ";
  };

  const systems = ["الكل","صحي","حريق","تكييف"];

  return (
    <div>
      <div style={{display:"flex", gap:8, marginBottom:16, overflowX:"auto"}}>
        {systems.map(s=>(
          <button key={s} onClick={()=>setFilter(s)}
            style={{
              padding:"8px 16px", borderRadius:20, border:"none", fontFamily:"inherit",
              fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap",
              background: filter===s ? C.navy : "#f1f5f9",
              color: filter===s ? C.white : C.gray,
              transition:"all 0.2s"
            }}>{s}</button>
        ))}
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16}}>
        <KPI icon="✅" label="كافٍ" value={data.warehouse.filter(w=>getStatus(w)==="✅ كافٍ").length} color={C.green}/>
        <KPI icon="⚠️" label="أمر شراء" value={data.warehouse.filter(w=>getStatus(w)==="⚠️ أمر شراء").length} color={C.orange}/>
        <KPI icon="🔴" label="نفذ" value={data.warehouse.filter(w=>getStatus(w)==="🔴 نفذ").length} color={C.red}/>
      </div>

      <SHdr icon="🏭" title="كروت الصنف" color={C.purple}/>
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {items.map(w=>{
          const bal = w.open+w.in-w.out;
          const st = getStatus(w);
          return (
            <div key={w.id} style={{
              background:C.white, borderRadius:12, padding:14,
              boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
              borderRight:`4px solid ${statusColor(st)}`
            }}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{w.name}</div>
                  <div style={{fontSize:10, color:C.gray}}>{w.code} · {w.system} · {w.formal}</div>
                </div>
                <Badge s={st}/>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10}}>
                {[
                  {label:"افتتاحي", val:w.open, color:C.gray},
                  {label:"وارد",    val:w.in,   color:C.green},
                  {label:"منصرف",   val:w.out,  color:C.orange},
                  {label:"رصيد",    val:bal,    color:bal<=0?C.red:bal<=w.min?C.orange:C.green},
                ].map((item,i)=>(
                  <div key={i} style={{textAlign:"center", padding:"8px 4px",
                    background:`${item.color}11`, borderRadius:8, border:`1px solid ${item.color}33`}}>
                    <div style={{fontSize:15, fontWeight:800, color:item.color}}>{item.val}</div>
                    <div style={{fontSize:10, color:C.gray}}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11, color:C.gray}}>الحد الأدنى: <b style={{color:C.orange}}>{w.min} {w.unit}</b></div>

              {(user.role==="STORE"||user.role==="CEO") && (
                <div style={{marginTop:10, background:"#f8fafc", borderRadius:8, padding:10}}>
                  <div style={{fontSize:11, color:C.gray, marginBottom:8, fontWeight:600}}>تحديث المخزون</div>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                    <div>
                      <label style={{fontSize:10, color:C.green, display:"block", marginBottom:3}}>وارد جديد</label>
                      <input type="number" min={0} defaultValue={0}
                        onBlur={e=>e.target.value>0&&updateStock(w.id,"in",w.in+Number(e.target.value))}
                        style={{width:"100%", padding:"7px", borderRadius:6, border:`1px solid ${C.green}44`,
                          fontSize:12, textAlign:"center", boxSizing:"border-box", fontFamily:"inherit"}}/>
                    </div>
                    <div>
                      <label style={{fontSize:10, color:C.orange, display:"block", marginBottom:3}}>صرف جديد</label>
                      <input type="number" min={0} defaultValue={0}
                        onBlur={e=>e.target.value>0&&updateStock(w.id,"out",w.out+Number(e.target.value))}
                        style={{width:"100%", padding:"7px", borderRadius:6, border:`1px solid ${C.orange}44`,
                          fontSize:12, textAlign:"center", boxSizing:"border-box", fontFamily:"inherit"}}/>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── EXTRACTS SCREEN ────────────────────────────────────────────
function ExtractsScreen({data, setData, user}) {
  const [newExt, setNewExt] = useState(false);
  const [form, setForm]     = useState({project:"",period:"",qty:"",price:""});

  const items = data.extracts.filter(e=>
    user.role==="CEO" || e.project===user.project || e.submittedBy===user.name
  );

  const total = items.reduce((a,e)=>a+e.qty*e.price,0);
  const approved = items.filter(e=>e.status.includes("معتمد")).reduce((a,e)=>a+e.qty*e.price,0);

  const submit = () => {
    if(!form.project||!form.period||!form.qty||!form.price) return;
    setData(d=>({...d, extracts:[...d.extracts,{
      id: d.extracts.length ? Math.max(...d.extracts.map(e=>e.id))+1 : 1, ...form,
      qty:Number(form.qty), price:Number(form.price),
      status:"⏳ قيد المراجعة", submittedBy:user.name
    }]}));
    setForm({project:"",period:"",qty:"",price:""}); setNewExt(false);
  };

  const approve = (id) => {
    setData(d=>({...d, extracts:d.extracts.map(e=>e.id===id?{...e,status:"✅ معتمد"}:e)}));
  };

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16}}>
        <KPI icon="💰" label="إجمالي المستخلصات" value={`${(total/1000).toFixed(0)}ك`} color={C.navy}/>
        <KPI icon="✅" label="المعتمد" value={`${(approved/1000).toFixed(0)}ك`} color={C.green}/>
      </div>

      {(user.role==="PM"||user.role==="CEO") && (
        <button onClick={()=>setNewExt(!newExt)}
          style={{width:"100%", padding:"12px", borderRadius:10, marginBottom:16,
            background:`linear-gradient(135deg,${C.gold},${C.goldD})`, border:"none",
            color:C.navyD, fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit"}}>
          + رفع مستخلص جديد
        </button>
      )}

      {newExt && (
        <div style={{background:C.white, borderRadius:12, padding:16, marginBottom:16,
          boxShadow:"0 4px 16px rgba(0,0,0,0.1)", border:`2px solid ${C.gold}44`}}>
          <SHdr icon="📄" title="مستخلص جديد" color={C.gold}/>
          {[
            {key:"project", label:"المشروع", type:"select",
             opts: data.projects.map(p=>p.name)},
            {key:"period",  label:"الفترة",   type:"text",   ph:"يناير 2024"},
            {key:"qty",     label:"الكمية",   type:"number", ph:"100"},
            {key:"price",   label:"سعر الوحدة",type:"number",ph:"850"},
          ].map(f=>(
            <div key={f.key} style={{marginBottom:10}}>
              <label style={{fontSize:11, color:C.gray, display:"block", marginBottom:4, fontWeight:600}}>{f.label}</label>
              {f.type==="select" ? (
                <select value={form[f.key]} onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                  style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e5e7eb",
                    fontSize:13, fontFamily:"inherit", color:C.navy}}>
                  <option value="">--</option>
                  {f.opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type} placeholder={f.ph} value={form[f.key]}
                  onChange={e=>setForm(x=>({...x,[f.key]:e.target.value}))}
                  style={{width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #e5e7eb",
                    fontSize:13, fontFamily:"inherit", color:C.navy, boxSizing:"border-box"}}/>
              )}
            </div>
          ))}
          {form.qty && form.price && (
            <div style={{background:`${C.gold}11`, borderRadius:8, padding:"8px 12px", marginBottom:12,
              border:`1px solid ${C.gold}33`, fontSize:12, color:C.navy, fontWeight:700}}>
              💰 القيمة الإجمالية: {fmt(Number(form.qty)*Number(form.price))} جنيه
            </div>
          )}
          <div style={{display:"flex", gap:8}}>
            <button onClick={submit}
              style={{flex:1, padding:"10px", borderRadius:8, background:C.green, border:"none",
                color:C.white, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13}}>
              رفع للاعتماد
            </button>
            <button onClick={()=>setNewExt(false)}
              style={{flex:1, padding:"10px", borderRadius:8, background:"#f1f5f9", border:"none",
                color:C.gray, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13}}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      <SHdr icon="💰" title="المستخلصات" color={C.navy}/>
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {items.map(e=>(
          <div key={e.id} style={{
            background:C.white, borderRadius:12, padding:14,
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            borderRight:`4px solid ${statusColor(e.status)}`
          }}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
              <div>
                <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{e.project}</div>
                <div style={{fontSize:11, color:C.gray}}>{e.num} · {e.period}</div>
              </div>
              <Badge s={e.status}/>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14, fontWeight:800, color:C.navy}}>{fmt(e.qty)}</div>
                <div style={{fontSize:10, color:C.gray}}>الكمية</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14, fontWeight:800, color:C.orange}}>{fmt(e.price)}</div>
                <div style={{fontSize:10, color:C.gray}}>سعر الوحدة</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14, fontWeight:800, color:C.green}}>{fmt(e.qty*e.price)}</div>
                <div style={{fontSize:10, color:C.gray}}>الإجمالي</div>
              </div>
            </div>
            <div style={{fontSize:11, color:C.gray}}>رُفع بواسطة: {e.submittedBy}</div>

            {user.role==="CEO" && (e.status.includes("قيد")||e.status.includes("اعتراض")) && (
              <button onClick={()=>approve(e.id)}
                style={{width:"100%", marginTop:10, padding:"9px", borderRadius:8,
                  background:C.green, border:"none", color:C.white,
                  fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:12}}>
                ✅ اعتماد المستخلص
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DOCS SCREEN ────────────────────────────────────────────────
function DocsScreen({data, setData, user}) {
  const docs = [
    { id:1, project:"فيلا الشيخ زايد", item:"مواسير PVC الدور الثالث", deliveredTo:"الاستشاري",
      deliveryDate:"2024-06-01", photo:"📸 محضر_001.jpg",
      consultantReply:"✅ معتمد", replyDate:"2024-06-03", replyPhoto:"📸 رد_001.jpg", status:"✅ معتمد" },
    { id:2, project:"فيلا الشيخ زايد", item:"تركيبات صحية حمام رئيسي", deliveredTo:"الاستشاري",
      deliveryDate:"2024-06-02", photo:"📸 محضر_002.jpg",
      consultantReply:"⚠️ ملاحظة: إحكام العزل", replyDate:"2024-06-04", replyPhoto:"📸 رد_002.jpg", status:"⚠️ بشرط تلافي الملاحظة" },
    { id:3, project:"مجمع الأعمال",    item:"رشاشات Sprinkler المنطقة A", deliveredTo:"الاستشاري",
      deliveryDate:"2024-06-01", photo:"📸 محضر_003.jpg",
      consultantReply:"✅ معتمد", replyDate:"2024-06-02", replyPhoto:"📸 رد_003.jpg", status:"✅ معتمد" },
    { id:4, project:"مجمع الأعمال",    item:"مضخة حريق 750GPM", deliveredTo:"الاستشاري",
      deliveryDate:"2024-06-03", photo:"📸 محضر_004.jpg",
      consultantReply:"⏳ قيد المراجعة", replyDate:"—", replyPhoto:"—", status:"⏳ انتظار رد" },
  ];

  const filtered = docs.filter(d=>
    user.role==="CEO" || d.project===user.project
  );

  return (
    <div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16}}>
        <KPI icon="✅" label="معتمدة" value={filtered.filter(d=>d.status.includes("معتمد")).length} color={C.green}/>
        <KPI icon="⚠️" label="بملاحظات" value={filtered.filter(d=>d.status.includes("بشرط")).length} color={C.orange}/>
        <KPI icon="⏳" label="انتظار رد" value={filtered.filter(d=>d.status.includes("انتظار")).length} color={C.purple}/>
      </div>

      <SHdr icon="📁" title="سجل التسليم للاستشاري" color={C.navy}/>
      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {filtered.map(d=>(
          <div key={d.id} style={{
            background:C.white, borderRadius:12, padding:14,
            boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
            borderRight:`4px solid ${statusColor(d.status)}`
          }}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
              <div>
                <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{d.item}</div>
                <div style={{fontSize:11, color:C.gray}}>{d.project}</div>
              </div>
              <Badge s={d.status}/>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
              <div style={{background:"#f8fafc", borderRadius:8, padding:"8px 10px"}}>
                <div style={{fontSize:10, color:C.navy, fontWeight:700, marginBottom:4}}>📤 التسليم</div>
                <div style={{fontSize:11}}>{d.deliveryDate}</div>
                <div style={{fontSize:11, color:C.navy, fontWeight:600}}>{d.photo}</div>
              </div>
              <div style={{background: d.consultantReply.includes("✅") ? C.greenL :
                           d.consultantReply.includes("⚠️") ? C.orangeL : "#f8fafc",
                borderRadius:8, padding:"8px 10px"}}>
                <div style={{fontSize:10, color:C.green, fontWeight:700, marginBottom:4}}>📥 رد الاستشاري</div>
                <div style={{fontSize:11, fontWeight:600}}>{d.consultantReply}</div>
                <div style={{fontSize:10, color:C.gray}}>{d.replyDate}</div>
                {d.replyPhoto!=="—" && <div style={{fontSize:11, color:C.navy}}>{d.replyPhoto}</div>}
              </div>
            </div>

            {(user.role==="PM"||user.role==="SITE_ENG") && (
              <button style={{width:"100%", padding:"8px", borderRadius:8,
                background:"#f1f5f9", border:"1px dashed #d1d5db",
                color:C.gray, fontWeight:600, cursor:"pointer", fontFamily:"inherit", fontSize:11}}>
                📸 إرفاق / تحديث صورة المستند
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── USERS MANAGEMENT SCREEN (CEO only) ──────────────────────────
function UsersScreen({users, setUsers}) {
  const [form, setForm] = useState({name:"", role:"PM", title:"", project:"", password:""});
  const roles = ["PM","SITE_ENG","STORE","SUB"];
  const roleColor = { PM:C.green, SITE_ENG:C.orange, STORE:C.purple, SUB:C.gray };

  const addUser = () => {
    if(!form.name || !form.password) return;
    const newUser = {
      id: Date.now(),
      name: form.name, role: form.role,
      avatar: form.role==="PM"?"👷":form.role==="SITE_ENG"?"⛑️":form.role==="STORE"?"🏭":"🔧",
      color: roleColor[form.role], password: form.password,
      title: form.title || ROLE_LABELS[form.role],
      project: form.project || undefined,
      perms: []
    };
    setUsers(list=>[...list, newUser]);
    setForm({name:"", role:"PM", title:"", project:"", password:""});
  };

  const updatePassword = (id, newPw) => {
    if(!newPw) return;
    setUsers(list=>list.map(u=>u.id===id?{...u,password:newPw}:u));
  };

  const removeUser = (id) => {
    setUsers(list=>list.filter(u=>u.id!==id));
  };

  return (
    <div>
      <SHdr icon="👥" title="إدارة المستخدمين وكلمات المرور" color={C.purple}/>

      <div style={{background:C.white, borderRadius:12, padding:16, marginBottom:16, boxShadow:"0 2px 8px rgba(0,0,0,0.07)", border:`2px solid ${C.gold}22`}}>
        <div style={{fontSize:12, fontWeight:700, color:C.navy, marginBottom:10}}>+ إضافة مستخدم جديد</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10}}>
          <input placeholder="اسم المستخدم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            style={{padding:"9px 10px", borderRadius:8, border:"1px solid #e5e7eb", fontFamily:"inherit", fontSize:12, boxSizing:"border-box"}}/>
          <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
            style={{padding:"9px 10px", borderRadius:8, border:"1px solid #e5e7eb", fontFamily:"inherit", fontSize:12}}>
            {roles.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <input placeholder="المسمى الوظيفي (اختياري)" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            style={{padding:"9px 10px", borderRadius:8, border:"1px solid #e5e7eb", fontFamily:"inherit", fontSize:12, boxSizing:"border-box"}}/>
          <input placeholder="المشروع (اختياري)" value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))}
            style={{padding:"9px 10px", borderRadius:8, border:"1px solid #e5e7eb", fontFamily:"inherit", fontSize:12, boxSizing:"border-box"}}/>
          <input placeholder="كلمة المرور" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
            style={{padding:"9px 10px", borderRadius:8, border:"1px solid #e5e7eb", fontFamily:"inherit", fontSize:12, boxSizing:"border-box", gridColumn:"span 2"}}/>
        </div>
        <button onClick={addUser} style={{width:"100%", padding:"10px", borderRadius:8, background:C.green, border:"none", color:C.white, fontWeight:700, cursor:"pointer", fontFamily:"inherit", fontSize:13}}>
          إضافة المستخدم
        </button>
      </div>

      <div style={{display:"flex", flexDirection:"column", gap:10}}>
        {users.map(u=>(
          <div key={u.id} style={{background:C.white, borderRadius:12, padding:14, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", borderRight:`4px solid ${u.color}`}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div>
                <div style={{fontWeight:700, fontSize:13, color:C.navy}}>{u.avatar} {u.name}</div>
                <div style={{fontSize:11, color:C.gray}}>{ROLE_LABELS[u.role]}{u.project?` · ${u.project}`:""}</div>
              </div>
              {u.role!=="CEO" && (
                <button onClick={()=>removeUser(u.id)}
                  style={{background:C.redL, color:C.red, border:"none", borderRadius:6, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer"}}>
                  حذف
                </button>
              )}
            </div>
            <div style={{display:"flex", gap:8, alignItems:"center", background:"#f8fafc", borderRadius:8, padding:"8px 10px"}}>
              <span style={{fontSize:11, color:C.gray, whiteSpace:"nowrap"}}>كلمة المرور:</span>
              <input defaultValue={u.password} onBlur={e=>updatePassword(u.id, e.target.value)}
                style={{flex:1, padding:"6px 10px", borderRadius:6, border:"1px solid #e5e7eb", fontSize:12, fontFamily:"inherit"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────
export default function SeagullERP() {
  const [user,    setUser]    = useState(null);
  const [tab,     setTab]     = useState("dashboard");
  const [data,    setDataLocal] = useState(INIT);
  const [users,   setUsersLocal] = useState([]);
  const [ready,   setReady]   = useState(false);

  // ── Firestore: بيانات المشاريع/الأوامر/المخازن... — تتزامن لحظيًا بين كل الأجهزة
  useEffect(()=>{
    const dataRef = doc(db, "erp", "data");
    const unsub = onSnapshot(dataRef, snap=>{
      if (snap.exists()) {
        setDataLocal(snap.data());
      } else {
        setDoc(dataRef, INIT); // أول تشغيل فقط: نزرع البيانات الافتراضية
      }
      setReady(true);
    });
    return unsub;
  },[]);

  // ── Firestore: قائمة المستخدمين وكلمات المرور — يتحكم فيها الـ CEO فقط
  useEffect(()=>{
    const usersRef = doc(db, "erp", "users");
    const unsub = onSnapshot(usersRef, snap=>{
      if (snap.exists()) {
        setUsersLocal(snap.data().list || []);
      } else {
        setDoc(usersRef, { list: DEFAULT_USERS }); // أول تشغيل فقط
      }
    });
    return unsub;
  },[]);

  // setData بنفس الشكل المستخدم في كل الشاشات، لكنه الآن يكتب في Firestore
  // بدل useState المحلي فقط — التحديث هيرجع تلقائيًا لكل الأجهزة عن طريق onSnapshot.
  const setData = (updater) => {
    setDataLocal(prev=>{
      const next = typeof updater==="function" ? updater(prev) : updater;
      setDoc(doc(db,"erp","data"), next);
      return next;
    });
  };

  const setUsers = (updater) => {
    setUsersLocal(prev=>{
      const next = typeof updater==="function" ? updater(prev) : updater;
      setDoc(doc(db,"erp","users"), { list: next });
      return next;
    });
  };

  // Define tabs per role
  const allTabs = [
    { id:"dashboard", icon:"📊", label:"الداشبورد",  roles:["CEO","PM","SITE_ENG","STORE","SUB"] },
    { id:"orders",    icon:"🎤", label:"الأوامر",    roles:["CEO","PM","SITE_ENG","STORE","SUB"] },
    { id:"plan",      icon:"📅", label:"الخطة",      roles:["CEO","PM","SITE_ENG"] },
    { id:"warehouse", icon:"🏭", label:"المخازن",    roles:["CEO","PM","SITE_ENG","STORE"] },
    { id:"extracts",  icon:"💰", label:"المستخلصات", roles:["CEO","PM"] },
    { id:"docs",      icon:"📁", label:"المستندات",  roles:["CEO","PM","SITE_ENG"] },
    { id:"users",     icon:"👥", label:"المستخدمين", roles:["CEO"] },
  ];

  const myTabs = user ? allTabs.filter(t=>t.roles.includes(user.role)) : [];

  useEffect(()=>{
    if(user && myTabs.length && !myTabs.find(t=>t.id===tab)){
      setTab(myTabs[0].id);
    }
  },[user]);

  if(!ready) {
    return (
      <div style={{minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:`linear-gradient(135deg, ${C.navy} 0%, ${C.navyD} 60%, #0a1628 100%)`,
        color:"#94a3b8", fontFamily:"'Cairo','Segoe UI',sans-serif", fontSize:14}}>
        🦅 جاري الاتصال بقاعدة البيانات...
      </div>
    );
  }

  if(!user) return <LoginScreen users={users} onLogin={u=>{setUser(u);setTab("dashboard");}}/>;

  // إذا كان المستخدم الحالي محذوفًا/معدَّلًا من CEO أثناء الجلسة، حدّثه من القائمة الحية
  const liveUser = users.find(u=>u.id===user.id) || user;

  const lowStock = data.warehouse.filter(w=>(w.open+w.in-w.out)<=w.min).length;
  const pendingOrders = data.orders.filter(o=>o.status.includes("جاري")).length;

  return (
    <div style={{
      minHeight:"100vh", background:"#f1f5f9",
      fontFamily:"'Cairo','Segoe UI',sans-serif", direction:"rtl",
      maxWidth:480, margin:"0 auto", position:"relative"
    }}>
      {/* TOP BAR */}
      <div style={{
        background:`linear-gradient(135deg,${C.navy},${C.navyD})`,
        padding:"12px 16px", position:"sticky", top:0, zIndex:100,
        boxShadow:"0 4px 16px rgba(0,0,0,0.2)"
      }}>
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <span style={{fontSize:24}}>🦅</span>
            <div>
              <div style={{color:C.gold, fontWeight:800, fontSize:14, lineHeight:1}}>Seagull ERP</div>
              <div style={{color:"rgba(255,255,255,0.6)", fontSize:10}}>
                {liveUser.name} · {ROLE_LABELS[liveUser.role]}
                {liveUser.project && ` · ${liveUser.project}`}
              </div>
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{position:"relative"}}>
              <div style={{
                background:"rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 10px",
                color:C.white, fontSize:16, cursor:"pointer"
              }}>🔔</div>
              {(lowStock+pendingOrders)>0 && (
                <div style={{
                  position:"absolute", top:-4, right:-4,
                  background:C.red, color:C.white, borderRadius:10,
                  width:18, height:18, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:10, fontWeight:800
                }}>{lowStock+pendingOrders}</div>
              )}
            </div>
            <button onClick={()=>{setUser(null);setTab("dashboard");}}
              style={{background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8,
                padding:"6px 10px", color:C.white, cursor:"pointer", fontSize:12,
                fontFamily:"inherit", fontWeight:600}}>
              خروج
            </button>
          </div>
        </div>

        <div style={{marginTop:8, display:"flex", alignItems:"center", gap:6,
          background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"4px 10px"}}>
          <span style={{fontSize:10}}>📍</span>
          <span style={{color:"#86efac", fontSize:10, fontWeight:600}}>GPS: في نطاق الموقع ✅</span>
          <span style={{color:"rgba(255,255,255,0.4)", fontSize:10, marginRight:"auto"}}>
            {new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"16px 14px 100px"}}>
        <div style={{
          background:liveUser.color, color:C.white, borderRadius:10, padding:"8px 14px",
          marginBottom:16, display:"flex", alignItems:"center", gap:8,
          boxShadow:`0 4px 12px ${liveUser.color}44`
        }}>
          <span style={{fontSize:20}}>{liveUser.avatar}</span>
          <div>
            <div style={{fontWeight:800, fontSize:13}}>{liveUser.name}</div>
            <div style={{fontSize:10, opacity:0.8}}>
              {ROLE_LABELS[liveUser.role]}
              {liveUser.project ? ` — ${liveUser.project}` : " — جميع المشاريع"}
            </div>
          </div>
          {lowStock>0 && (
            <div style={{marginRight:"auto", background:C.red, borderRadius:8,
              padding:"4px 10px", fontSize:10, fontWeight:700}}>
              ⚠️ {lowStock} تنبيه مخزن
            </div>
          )}
        </div>

        {tab==="dashboard" && (liveUser.role==="CEO"
          ? <CEODashboard data={data} user={liveUser}/>
          : <div>
              <SHdr icon="📊" title="لمحة سريعة" color={liveUser.color}/>
              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16}}>
                <KPI icon="📅" label="بنود الخطة"
                  value={data.plan.filter(p=>liveUser.project?p.project===liveUser.project:true).length}
                  color={C.navy}/>
                <KPI icon="📢" label="أوامري اليوم"
                  value={data.orders.filter(o=>o.by===liveUser.name||o.to===liveUser.name).length}
                  color={liveUser.color}/>
                <KPI icon="📦" label="تنبيهات"
                  value={lowStock+pendingOrders}
                  color={lowStock+pendingOrders>0?C.red:C.green}/>
              </div>

              <SHdr icon="📢" title="آخر الأوامر" color={C.gold}/>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {data.orders.filter(o=>
                  liveUser.role==="STORE"?o.toRole==="STORE":
                  liveUser.role==="SUB"?o.toRole==="SUB":
                  o.project===liveUser.project
                ).slice(0,4).map(o=>(
                  <div key={o.id} style={{
                    background:C.white, borderRadius:10, padding:12,
                    boxShadow:"0 2px 6px rgba(0,0,0,0.06)",
                    borderRight:`3px solid ${statusColor(o.status)}`
                  }}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                      <span style={{fontSize:11, color:C.gray}}>{o.time} — {o.by}</span>
                      <Badge s={o.status}/>
                    </div>
                    <div style={{fontSize:12, color:C.navy, fontWeight:600}}>{o.formal}</div>
                  </div>
                ))}
              </div>

              {liveUser.project && (
                <>
                  <div style={{marginTop:16}}/>
                  <SHdr icon="📅" title="إنجاز الخطة" color={C.navy}/>
                  {data.plan.filter(p=>p.project===liveUser.project).slice(0,4).map(p=>{
                    const prog = pct(p.done,p.qty);
                    return (
                      <div key={p.id} style={{background:C.white, borderRadius:10, padding:12,
                        marginBottom:8, boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}>
                        <div style={{display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6}}>
                          <span style={{fontWeight:600, color:C.navy}}>{p.item}</span>
                          <span style={{fontWeight:700, color:prog>=80?C.green:C.orange}}>{prog}%</span>
                        </div>
                        <Bar value={p.done} max={p.qty}/>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
        )}
        {tab==="orders"    && <OrdersScreen    data={data} setData={setData} user={liveUser} users={users}/>}
        {tab==="plan"      && <PlanScreen      data={data} setData={setData} user={liveUser}/>}
        {tab==="warehouse" && <WarehouseScreen data={data} setData={setData} user={liveUser}/>}
        {tab==="extracts"  && <ExtractsScreen  data={data} setData={setData} user={liveUser}/>}
        {tab==="docs"      && <DocsScreen      data={data} setData={setData} user={liveUser}/>}
        {tab==="users"     && liveUser.role==="CEO" && <UsersScreen users={users} setUsers={setUsers}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position:"fixed", bottom:0, right:0, left:0, maxWidth:480, margin:"0 auto",
        background:C.white, borderTop:"1px solid #e5e7eb",
        display:"flex", boxShadow:"0 -4px 16px rgba(0,0,0,0.1)",
        zIndex:200
      }}>
        {myTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{
              flex:1, padding:"8px 2px", border:"none", background:"transparent",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              cursor:"pointer", transition:"all 0.2s",
              borderTop: tab===t.id ? `3px solid ${liveUser.color}` : "3px solid transparent"
            }}>
            <span style={{fontSize:18, filter:tab===t.id?"none":"grayscale(0.5)"}}>{t.icon}</span>
            <span style={{fontSize:9, fontWeight:700, fontFamily:"inherit",
              color: tab===t.id ? liveUser.color : C.gray}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
