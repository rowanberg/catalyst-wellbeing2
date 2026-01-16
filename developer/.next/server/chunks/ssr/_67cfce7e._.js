module.exports=[1027,a=>{"use strict";let b=(0,a.i(70106).default)("Zap",[["polygon",{points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2",key:"45s27k"}]]);a.s(["Zap",()=>b],1027)},50522,a=>{"use strict";let b=(0,a.i(70106).default)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);a.s(["ChevronRight",()=>b],50522)},33441,a=>{"use strict";let b=(0,a.i(70106).default)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);a.s(["Check",()=>b],33441)},5151,a=>{"use strict";let b=(0,a.i(70106).default)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);a.s(["Copy",()=>b],5151)},69520,a=>{"use strict";let b=(0,a.i(70106).default)("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);a.s(["RefreshCw",()=>b],69520)},80386,a=>{"use strict";let b=(0,a.i(70106).default)("Terminal",[["polyline",{points:"4 17 10 11 4 5",key:"akl6gq"}],["line",{x1:"12",x2:"20",y1:"19",y2:"19",key:"q2wloq"}]]);a.s(["Terminal",()=>b],80386)},5112,a=>{"use strict";let b=(0,a.i(70106).default)("Github",[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]]);a.s(["Github",()=>b],5112)},32220,a=>{"use strict";var b=a.i(87924),c=a.i(72131),d=a.i(46271),e=a.i(38246),f=a.i(80386),g=a.i(5151),h=a.i(33441),i=a.i(52495),j=a.i(50522);let k=(0,a.i(70106).default)("Package",[["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);var l=a.i(1027),m=a.i(3314),n=a.i(69520),o=a.i(63917),p=a.i(53722),q=a.i(5112);let r=[{id:"javascript",name:"JavaScript / TypeScript",package:"@catalystwells/sdk",install:"npm install @catalystwells/sdk",link:"https://www.npmjs.com/package/@catalystwells/sdk",github:"https://github.com/catalystwells/sdk-javascript",color:"from-yellow-500 to-amber-500",bgColor:"bg-yellow-500/10",borderColor:"border-yellow-500/20",textColor:"text-yellow-400",example:`import { CatalystWells } from '@catalystwells/sdk';

// Initialize the client
const client = new CatalystWells({
  clientId: process.env.CATALYSTWELLS_CLIENT_ID,
  clientSecret: process.env.CATALYSTWELLS_CLIENT_SECRET,
  environment: 'sandbox' // or 'production'
});

// OAuth: Get authorization URL
const authUrl = client.auth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['profile.read', 'student.profile.read'],
  state: 'random_state_string'
});

// Exchange code for tokens
const tokens = await client.auth.exchangeCode({
  code: authorizationCode,
  redirectUri: 'https://yourapp.com/callback'
});

// Make authenticated requests
const student = await client.students.get('me');
console.log(\`Hello, \${student.name}!\`);

// Get attendance
const attendance = await client.attendance.list({
  studentId: student.id,
  from: '2026-01-01',
  to: '2026-01-31'
});

// Webhooks
client.webhooks.on('attendance.updated', (event) => {
  console.log('Attendance updated:', event.data);
});`},{id:"python",name:"Python",package:"catalystwells",install:"pip install catalystwells",link:"https://pypi.org/project/catalystwells",github:"https://github.com/catalystwells/sdk-python",color:"from-blue-500 to-cyan-500",bgColor:"bg-blue-500/10",borderColor:"border-blue-500/20",textColor:"text-blue-400",example:`from catalystwells import CatalystWells
import os

# Initialize the client
client = CatalystWells(
    client_id=os.environ['CATALYSTWELLS_CLIENT_ID'],
    client_secret=os.environ['CATALYSTWELLS_CLIENT_SECRET'],
    environment='sandbox'  # or 'production'
)

# OAuth: Get authorization URL
auth_url = client.auth.get_authorization_url(
    redirect_uri='https://yourapp.com/callback',
    scopes=['profile.read', 'student.profile.read'],
    state='random_state_string'
)

# Exchange code for tokens
tokens = client.auth.exchange_code(
    code=authorization_code,
    redirect_uri='https://yourapp.com/callback'
)

# Make authenticated requests
student = client.students.get('me')
print(f"Hello, {student.name}!")

# Get attendance
attendance = client.attendance.list(
    student_id=student.id,
    from_date='2026-01-01',
    to_date='2026-01-31'
)

# Async support
import asyncio
async def main():
    student = await client.students.get_async('me')
    print(student.name)`},{id:"flutter",name:"Flutter / Dart",package:"catalystwells_sdk",install:"flutter pub add catalystwells_sdk",link:"https://pub.dev/packages/catalystwells_sdk",github:"https://github.com/catalystwells/sdk-flutter",color:"from-cyan-500 to-teal-500",bgColor:"bg-cyan-500/10",borderColor:"border-cyan-500/20",textColor:"text-cyan-400",example:`import 'package:catalystwells_sdk/catalystwells_sdk.dart';

// Initialize the client
final client = CatalystWells(
  clientId: 'your_client_id',
  environment: Environment.sandbox, // or Environment.production
);

// OAuth: Get authorization URL
final authUrl = client.auth.getAuthorizationUrl(
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['profile.read', 'student.profile.read'],
  state: 'random_state_string',
);

// Exchange code for tokens
final tokens = await client.auth.exchangeCode(
  code: authorizationCode,
  redirectUri: 'https://yourapp.com/callback',
);

// Make authenticated requests
final student = await client.students.get('me');
print('Hello, \${student.name}!');

// Get attendance with error handling
try {
  final attendance = await client.attendance.list(
    studentId: student.id,
    from: DateTime(2026, 1, 1),
    to: DateTime(2026, 1, 31),
  );
  print('Total records: \${attendance.length}');
} on CatalystWellsException catch (e) {
  print('Error: \${e.message}');
}`}],s=[{icon:l.Zap,title:"Type-Safe",description:"Full TypeScript/Dart type definitions for better development experience"},{icon:n.RefreshCw,title:"Auto Token Refresh",description:"Automatically refreshes expired tokens without intervention"},{icon:m.Shield,title:"Secure by Default",description:"Built-in best practices for secure credential handling"},{icon:k,title:"Lightweight",description:"Minimal dependencies with small bundle sizes"}];function t(){let[a,k]=(0,c.useState)(r[0]),[l,m]=(0,c.useState)(null),n=async(a,b)=>{await navigator.clipboard.writeText(a),m(b),setTimeout(()=>m(null),2e3)};return(0,b.jsxs)("div",{className:"max-w-6xl mx-auto space-y-10",children:[(0,b.jsxs)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},children:[(0,b.jsx)("h1",{className:"text-3xl sm:text-4xl font-bold text-white mb-4",children:"Official SDKs"}),(0,b.jsx)("p",{className:"text-lg text-slate-400 max-w-3xl",children:"Get started quickly with our official client libraries. Each SDK provides full API coverage with type safety, automatic token management, and comprehensive documentation."})]}),(0,b.jsx)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.1},className:"grid grid-cols-2 md:grid-cols-4 gap-4",children:s.map((a,c)=>(0,b.jsxs)("div",{className:"bg-slate-800/30 border border-slate-700/50 rounded-xl p-4",children:[(0,b.jsx)(a.icon,{className:"w-6 h-6 text-blue-400 mb-2"}),(0,b.jsx)("h3",{className:"font-medium text-white text-sm",children:a.title}),(0,b.jsx)("p",{className:"text-xs text-slate-400 mt-1",children:a.description})]},c))}),(0,b.jsx)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.15},className:"grid md:grid-cols-3 gap-4",children:r.map(c=>(0,b.jsxs)("button",{onClick:()=>k(c),className:`p-5 rounded-xl border text-left transition-all ${a.id===c.id?`${c.bgColor} ${c.borderColor.replace("20","40")}`:"bg-slate-800/30 border-slate-700/50 hover:border-slate-600"}`,children:[(0,b.jsx)("div",{className:`w-10 h-10 ${c.bgColor} rounded-lg flex items-center justify-center mb-3`,children:(0,b.jsx)(f.Terminal,{className:`w-5 h-5 ${c.textColor}`})}),(0,b.jsx)("h3",{className:"font-semibold text-white mb-1",children:c.name}),(0,b.jsx)("code",{className:"text-xs text-slate-400 font-mono",children:c.package})]},c.id))}),(0,b.jsxs)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},className:"space-y-6",children:[(0,b.jsxs)("div",{className:`${a.bgColor} border ${a.borderColor} rounded-2xl p-6`,children:[(0,b.jsx)("h2",{className:"text-xl font-semibold text-white mb-4",children:"Installation"}),(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)("div",{className:"flex-1 bg-slate-900/80 rounded-xl px-4 py-3 font-mono text-sm",children:(0,b.jsx)("code",{className:"text-slate-300",children:a.install})}),(0,b.jsx)("button",{onClick:()=>n(a.install,"install"),className:`p-3 rounded-xl transition-colors ${a.bgColor} ${a.borderColor.replace("20","40")} border hover:opacity-80`,children:"install"===l?(0,b.jsx)(h.Check,{className:"w-5 h-5 text-green-400"}):(0,b.jsx)(g.Copy,{className:`w-5 h-5 ${a.textColor}`})})]}),(0,b.jsxs)("div",{className:"flex items-center gap-6 mt-4",children:[(0,b.jsxs)("a",{href:a.link,target:"_blank",rel:"noopener noreferrer",className:`text-sm ${a.textColor} hover:opacity-80 flex items-center gap-1`,children:["View Package",(0,b.jsx)(i.ExternalLink,{className:"w-3 h-3"})]}),(0,b.jsxs)("a",{href:a.github,target:"_blank",rel:"noopener noreferrer",className:"text-sm text-slate-400 hover:text-white flex items-center gap-1",children:[(0,b.jsx)(q.Github,{className:"w-4 h-4"}),"GitHub"]})]})]}),(0,b.jsxs)("div",{className:"bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden",children:[(0,b.jsxs)("div",{className:"flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50",children:[(0,b.jsxs)("div",{className:"flex items-center gap-3",children:[(0,b.jsx)(o.Code2,{className:`w-5 h-5 ${a.textColor}`}),(0,b.jsx)("h3",{className:"font-semibold text-white",children:"Quick Start Example"})]}),(0,b.jsx)("button",{onClick:()=>n(a.example,"example"),className:"flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors",children:"example"===l?(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(h.Check,{className:"w-4 h-4 text-green-400"}),(0,b.jsx)("span",{className:"text-green-400",children:"Copied!"})]}):(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)(g.Copy,{className:"w-4 h-4"}),(0,b.jsx)("span",{children:"Copy"})]})})]}),(0,b.jsx)("pre",{className:"p-6 overflow-x-auto max-h-[500px] overflow-y-auto sidebar-scroll",children:(0,b.jsx)("code",{className:"text-sm text-slate-300 font-mono leading-relaxed",children:a.example})})]})]},a.id),(0,b.jsxs)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.3},className:"grid md:grid-cols-2 gap-6",children:[(0,b.jsxs)(e.default,{href:"/dashboard/docs/api",className:"bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all group",children:[(0,b.jsx)(p.BookOpen,{className:"w-8 h-8 text-blue-400 mb-4"}),(0,b.jsx)("h3",{className:"text-lg font-semibold text-white mb-2 group-hover:text-blue-400",children:"API Reference"}),(0,b.jsx)("p",{className:"text-sm text-slate-400 mb-4",children:"Complete documentation for all API endpoints, parameters, and responses."}),(0,b.jsxs)("span",{className:"inline-flex items-center gap-1 text-sm text-blue-400",children:["View Reference ",(0,b.jsx)(j.ChevronRight,{className:"w-4 h-4"})]})]}),(0,b.jsxs)(e.default,{href:"/dashboard/playground",className:"bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all group",children:[(0,b.jsx)(f.Terminal,{className:"w-8 h-8 text-purple-400 mb-4"}),(0,b.jsx)("h3",{className:"text-lg font-semibold text-white mb-2 group-hover:text-purple-400",children:"API Playground"}),(0,b.jsx)("p",{className:"text-sm text-slate-400 mb-4",children:"Test API endpoints interactively with our sandbox environment."}),(0,b.jsxs)("span",{className:"inline-flex items-center gap-1 text-sm text-purple-400",children:["Try Playground ",(0,b.jsx)(j.ChevronRight,{className:"w-4 h-4"})]})]})]}),(0,b.jsxs)(d.motion.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{delay:.4},className:"text-center py-6",children:[(0,b.jsx)("p",{className:"text-slate-400 mb-4",children:"Need help with SDK integration? We're here for you."}),(0,b.jsxs)("div",{className:"flex items-center justify-center gap-6",children:[(0,b.jsx)(e.default,{href:"/dashboard/support",className:"text-blue-400 hover:text-blue-300 font-medium",children:"Contact Support"}),(0,b.jsxs)("a",{href:"https://github.com/catalystwells",target:"_blank",rel:"noopener noreferrer",className:"text-slate-400 hover:text-white flex items-center gap-1",children:[(0,b.jsx)(q.Github,{className:"w-4 h-4"}),"Report Issues"]})]})]})]})}a.s(["default",()=>t],32220)}];

//# sourceMappingURL=_67cfce7e._.js.map