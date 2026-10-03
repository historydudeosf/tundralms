// Tundra Academy LMS: a single-page, no-build classroom app.
// All data lives in this browser's localStorage unless the Claude-hosted db is available.
const K = "schoolhouse_v2",
  $ = (s) => document.querySelector(s),
  uid = () => Math.random().toString(36).slice(2, 8);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const TODAY = "2026-10-02",
  IC = { assignment: "📝", test: "🧪", link: "🔗", page: "📄", folder: "📁" };
function seed() {
  const nm = ["Alex Rivera", "Bea Okafor", "Cam Nguyen", "Dara Patel", "Eli Brooks", "Fay Morales"],
    ids = nm.map((n, i) => "s" + (i + 1));
  const users = [
    { id: "a1", name: "Principal Hayes", role: "admin" },
    { id: "t1", name: "Ms. Carter", role: "teacher" },
    ...nm.map((n, i) => ({ id: ids[i], name: n, role: "student" })),
  ];
  const mk = (n, sec, col, items) => ({
    id: uid(),
    name: n,
    sec,
    col,
    teacher: "t1",
    enrolled: ids.slice(),
    updates: [{ id: uid(), text: "Welcome to the course!", time: TODAY }],
    items,
  });
  const c1 = mk("Algebra I", "Period 2", "#2b6be0", [
    {
      id: uid(),
      type: "assignment",
      title: "Chapter 3 homework",
      due: "2026-10-09",
      pts: 10,
      text: "Do problems 1-20.",
    },
    { id: uid(), type: "link", title: "Khan Academy: slope", url: "https://www.khanacademy.org" },
    {
      id: uid(),
      type: "test",
      title: "Linear equations quiz",
      due: "2026-10-12",
      questions: [
        { t: "mc", q: "Slope of y = 3x + 2?", opts: ["2", "3", "5"], a: "3" },
        { t: "tf", q: "A line can have two y-intercepts.", opts: ["True", "False"], a: "False" },
        { t: "sa", q: "Solve 2x = 10. x = ?", opts: [], a: "5" },
      ],
    },
  ]);
  const c2 = mk("English 9", "Period 4", "#d4572a", [
    { id: uid(), type: "page", title: "Syllabus", text: "Reading, response journals, one essay per unit." },
    { id: uid(), type: "assignment", title: "Reading response: Ch. 5", due: "2026-10-06", pts: 15, text: "One page." },
  ]);
  return {
    school: { name: "🏫 Schoolhouse", color: "#17325f" },
    users,
    courses: [c1, c2],
    groups: [
      {
        id: uid(),
        name: "Robotics Club",
        members: ["s1", "s2", "s3"],
        posts: [{ id: uid(), by: "t1", text: "First meeting is Thursday!", time: TODAY }],
      },
    ],
    sub: {},
  };
}
let S;
try {
  S = JSON.parse(localStorage.getItem(K));
} catch (e) {}
if (!S) S = seed();
const save = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
  pushDb();
};
fix();
let U = {
  role: "admin",
  view: "home",
  cid: null,
  tab: "materials",
  item: null,
  menu: false,
  form: null,
  gid: null,
  folder: null,
  banner: false,
};
const me = () => S.users.find((u) => u.id === U.user) || { id: "x", name: U.role, role: U.role },
  C = (id) => S.courses.find((c) => c.id === id),
  nm = (id) => (S.users.find((u) => u.id === id) || { name: "Unknown" }).name;
const staff = () => U.role !== "student",
  sg = (c, i, s) => S.sub[c + ":" + i + ":" + s] || {},
  pts = (i) => (i.type === "test" ? i.questions.reduce((a, q) => a + qp(q), 0) : i.pts),
  graded = (c) => c.items.filter((i) => (i.type === "assignment" || i.type === "test") && (staff() || live(c, i)));
const kid = (c, p) => c.items.filter((i) => (i.parent || null) === p),
  live = (c, i) => {
    while (i) {
      if (i.pub === false) return false;
      const p = i.parent;
      i = c.items.find((x) => x.id === p);
    }
    return true;
  },
  shown = (c, i) => staff() || live(c, i);
const vis = () =>
  S.courses.filter(
    (c) => U.role === "admin" || (U.role === "teacher" ? c.teacher === me().id : c.enrolled.includes(me().id)),
  );
const hasG = (g) => g !== undefined && g !== "";
const ltr = (p) => (p == null ? "–" : gradeLetter(p)),
  fmt = (p) => (p == null ? "No grades yet" : p + "% (" + ltr(p) + ")");
const go = (v, c, t) => {
  U.view = v;
  U.cid = c || null;
  U.tab = t || "materials";
  U.item = null;
  U.menu = false;
  U.form = null;
  U.folder = null;
  U.banner = false;
  render();
  scrollTo(0, 0);
};
function edit(k, id, f, v) {
  S[k].find((x) => x.id === id)[f] = v;
  save();
  render();
}
function tog(k, id, f, v) {
  const o = S[k].find((x) => x.id === id);
  o[f] = o[f].includes(v) ? o[f].filter((x) => x !== v) : [...o[f], v];
  save();
  render();
}
const studs = () => S.users.filter((u) => u.role === "student");
function home() {
  const ups = vis()
    .flatMap((c) => c.updates.map((u) => ({ ...u, c })))
    .sort((a, b) => b.time.localeCompare(a.time));
  const due = vis()
    .flatMap((c) => c.items.filter((i) => i.due && i.due >= TODAY && live(c, i)).map((i) => ({ ...i, c })))
    .sort((a, b) => a.due.localeCompare(b.due));
  return `<h2>Recent activity</h2><div class="grid2"><div class="card">${ups.map((u) => `<div class="item"><span style="width:10px;height:36px;border-radius:4px;background:${u.c.col}"></span><div><b>${esc(u.c.name)}</b> <span class="mut">${u.time}</span><div>${esc(u.text)}</div></div></div>`).join("") || '<p class="mut">No updates yet. Open a course and post one.</p>'}</div>
<div class="card"><h3>Upcoming</h3>${due.map((a) => `<div class="item"><div>${IC[a.type]} <b>${esc(a.title)}</b><div class="mut">${esc(a.c.name)} · due ${a.due}</div></div></div>`).join("") || '<p class="mut">Nothing due.</p>'}</div></div>`;
}
function course() {
  const c = C(U.cid);
  if (!c) return enr();
  return `<div class="banner" style="background:${bg(c)};min-height:120px"><div class="row" style="margin:0;justify-content:space-between"><h2>${esc(c.name)}</h2>${staff() ? `<button class="btn" style="background:rgba(255,255,255,.25)" onclick="U.banner=!U.banner;render()">${U.banner ? "Done" : "Edit banner"}</button>` : ""}</div><div>${esc(c.sec)} · ${esc(nm(c.teacher))}</div>${U.banner && staff() ? `<div class="row"><input value="${esc(c.name)}" aria-label="Course name" onchange="edit('courses','${c.id}','name',this.value)"><input value="${esc(c.sec)}" aria-label="Section" onchange="edit('courses','${c.id}','sec',this.value)"><input type="color" value="${c.col}" aria-label="Banner color" onchange="edit('courses','${c.id}','col',this.value)"><input type="file" accept="image/*" aria-label="Banner image" onchange="setImg('${c.id}',this)">${c.img ? `<button class="btn x" onclick="C('${c.id}').img='';save();render()">Remove image</button>` : ""}</div>` : ""}</div><div class="tabs">${[
    ["materials", "Materials"],
    ["updates", "Updates"],
    ["grades", "Grades"],
    ["members", "Members"],
  ]
    .map(
      (t) =>
        `<button class="${U.tab === t[0] ? "on" : ""}" onclick="U.tab='${t[0]}';U.item=null;U.folder=null;render()">${t[1]}</button>`,
    )
    .join("")}</div>${tabv(c)}`;
}
function tabv(c) {
  const t = U.tab;
  if (t === "materials") return U.item ? itemView(c) : mats(c);
  if (t === "updates")
    return (
      (staff()
        ? `<div class="card"><textarea id="ut" placeholder="Post an update to this course"></textarea><div class="row"><button class="btn" onclick="postU('${c.id}')">Post update</button></div></div>`
        : "") +
      `<div class="card">${
        c.updates
          .slice()
          .reverse()
          .map((u) => `<div class="item"><div><span class="mut">${u.time}</span><div>${esc(u.text)}</div></div></div>`)
          .join("") || '<p class="mut">No updates yet.</p>'
      }</div>`
    );
  if (t === "members")
    return `<div class="card"><h3>${esc(nm(c.teacher))} <span class="pill">Teacher</span></h3>${staff() ? `<div class="row" style="justify-content:space-between;margin:0 0 8px"><span class="mut">${c.enrolled.length} students</span><button class="btn" onclick="pick('courses','${c.id}','enrolled','students','Add students')">Add members</button></div>${c.enrolled.map((id) => `<div class="item">${esc(nm(id))}</div>`).join("") || '<p class="mut">No students enrolled yet.</p>'}` : c.enrolled.map((id) => `<div class="item">${esc(nm(id))}</div>`).join("") || '<p class="mut">No students enrolled yet.</p>'}</div>`;
  if (!staff())
    return `<div class="card"><h3>Your grade: ${fmt(avg(c, me().id))}</h3>${graded(c)
      .map((i) => {
        const g = sg(c.id, i.id, me().id).grade;
        return `<div class="item"><span>${IC[i.type]}</span><b style="flex:1">${esc(i.title)}</b>${hasG(g) ? g + "/" + pts(i) : "–"}</div>`;
      })
      .join("")}</div>`;
  return (
    wts(c) +
    `<div class="card tw"><table><tr><th>Student</th>${graded(c)
      .map((i) => `<th>${esc(i.title)}<div class="mut">/${pts(i)}</div></th>`)
      .join("")}<th>Average</th></tr>${c.enrolled
      .map(
        (s) =>
          `<tr><td><b>${esc(nm(s))}</b></td>${graded(c)
            .map(
              (i) =>
                `<td><input type="number" min="0" max="${pts(i)}" value="${esc(sg(c.id, i.id, s).grade ?? "")}" aria-label="${esc(nm(s))} ${esc(i.title)}" onchange="setG('${c.id}','${i.id}','${s}',this.value)"></td>`,
            )
            .join("")}<td><b>${avg(c, s) == null ? "–" : avg(c, s) + "% " + ltr(avg(c, s))}</b></td></tr>`,
      )
      .join("")}</table></div>`
  );
}
function itemView(c) {
  const i = c.items.find((x) => x.id === U.item);
  if (!i) {
    U.item = null;
    return mats(c);
  }
  const s = me().id,
    sb = sg(c.id, i.id, s);
  let h = `<div class="card"><button class="link" onclick="U.item=null;render()">‹ Back to materials</button><h2 style="margin-top:8px">${IC[i.type]} ${esc(i.title)}</h2>`;
  if (i.type === "link")
    h += `<p><a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.url)}</a></p>`;
  if (i.type === "page") h += `<p style="white-space:pre-wrap">${esc(i.text)}</p>`;
  if (i.type === "assignment") {
    h += `<p class="mut">${pts(i)} points · due ${i.due}</p><p style="white-space:pre-wrap">${esc(i.text)}</p>`;
    if (staff())
      h += c.enrolled
        .map(
          (id) =>
            `<div class="item"><b style="width:140px">${esc(nm(id))}</b><span class="${sg(c.id, i.id, id).text ? "ok" : "mut"}">${sg(c.id, i.id, id).text ? esc(sg(c.id, i.id, id).text) : "Not submitted"}</span></div>`,
        )
        .join("");
    else
      h += sb.text
        ? `<p class="ok">Submitted: ${esc(sb.text)}</p><p>${hasG(sb.grade) ? "Grade: <b>" + sb.grade + "/" + i.pts + "</b>" : '<span class="mut">Waiting for a grade</span>'}</p>`
        : `<textarea id="sb" placeholder="Type your answer"></textarea><div class="row"><button class="btn" onclick="turnIn('${c.id}','${i.id}')">Turn in</button></div>`;
  }
  if (i.type === "test") h += testView(c, i, sb);
  return h + "</div>";
}
function grades() {
  return `<h2>Grades</h2><div class="card">${
    vis()
      .map((c) => {
        let p;
        if (staff()) {
          const a = c.enrolled.map((s) => avg(c, s)).filter((x) => x != null);
          p = a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
        } else p = avg(c, me().id);
        return `<div class="item" style="cursor:pointer" onclick="go('course','${c.id}','grades')"><span style="width:10px;height:36px;border-radius:4px;background:${c.col}"></span><div style="flex:1"><b>${esc(c.name)}</b><div class="mut">${staff() ? "Class average" : "Your grade"}</div></div><b>${fmt(p)}</b></div>`;
      })
      .join("") || '<p class="mut">No courses.</p>'
  }</div>`;
}
function admin() {
  const T = S.users.filter((u) => u.role !== "student");
  return `<h2>Admin</h2>${U.msg ? `<p class="bad">${esc(U.msg)}</p>` : ""}<div class="card"><h3>School</h3><div class="row"><input value="${esc(S.school.name)}" aria-label="School name" onchange="S.school.name=this.value;save();render()"><label>Theme <input type="color" value="${S.school.color}" onchange="S.school.color=this.value;save();render()"></label><label class="mut">Logo <input type="file" accept="image/*" aria-label="School logo" onchange="setLogo(this)"></label>${S.school.logo ? `<button class="btn x" onclick="delete S.school.logo;save();render()">Use default logo</button>` : ""}<button class="btn x" style="color:var(--ink)" onclick="splash()">Preview animation</button></div></div>${lpAdmin()}${scaleAdmin()}
<div class="card"><h3>Users</h3>${S.users.map((u) => `<div class="item"><input value="${esc(u.name)}" aria-label="Name" onchange="edit('users','${u.id}','name',this.value)"><input value="${esc(u.un)}" aria-label="Username" placeholder="username" onchange="setUn('${u.id}',this.value)"><input value="${esc(u.pw)}" aria-label="Password" placeholder="password" onchange="edit('users','${u.id}','pw',this.value)"><select aria-label="Role" onchange="edit('users','${u.id}','role',this.value)">${["admin", "teacher", "student"].map((r) => `<option${u.role === r ? " selected" : ""}>${r}</option>`).join("")}</select><button class="btn x" onclick="del('users','${u.id}')">Remove</button></div>`).join("")}
<div class="row"><input id="un" placeholder="Name"><input id="uu" placeholder="Username"><input id="up" placeholder="Password"><select id="ur"><option>student</option><option>teacher</option><option>admin</option></select><button class="btn" onclick="addUser()">Add user</button></div></div>
<div class="card"><h3>Courses</h3>${S.courses.map((c) => `<details><summary>${esc(c.name)}</summary><div class="row"><input value="${esc(c.name)}" aria-label="Course name" onchange="edit('courses','${c.id}','name',this.value)"><input value="${esc(c.sec)}" aria-label="Section" onchange="edit('courses','${c.id}','sec',this.value)"><input type="color" value="${c.col}" aria-label="Color" onchange="edit('courses','${c.id}','col',this.value)"><select aria-label="Teacher" onchange="edit('courses','${c.id}','teacher',this.value)">${T.map((t) => `<option value="${t.id}"${c.teacher === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select><button class="btn x" onclick="del('courses','${c.id}')">Delete</button></div><div class="row"><button class="btn" onclick="pick('courses','${c.id}','enrolled','students','Add students')">Edit enrolled students (${c.enrolled.length})</button></div></details>`).join("")}
<div class="row"><input id="cn" placeholder="New course name"><input id="cs" placeholder="Section"><button class="btn" onclick="addCourse()">Add course</button></div></div>
<div class="card"><h3>Groups</h3>${S.groups.map((g) => `<details><summary>${esc(g.name)}</summary><div class="row"><input value="${esc(g.name)}" aria-label="Group name" onchange="edit('groups','${g.id}','name',this.value)"><button class="btn x" onclick="del('groups','${g.id}')">Delete</button></div><div class="row"><button class="btn" onclick="pick('groups','${g.id}','members','all','Add members')">Edit members (${g.members.length})</button></div></details>`).join("")}
<div class="row"><input id="gn" placeholder="New group name"><button class="btn" onclick="addGroup()">Add group</button></div></div>`;
}
const v = (id) => $(id).value.trim();
function postU(c) {
  const t = v("#ut");
  if (!t) return;
  C(c).updates.push({ id: uid(), text: t, time: TODAY });
  save();
  render();
}
function postG(g) {
  const t = v("#gp");
  if (!t) return;
  S.groups.find((x) => x.id === g).posts.push({ id: uid(), by: me().id, text: t, time: TODAY });
  save();
  render();
}
function setG(c, i, s, x) {
  const k = c + ":" + i + ":" + s;
  S.sub[k] = S.sub[k] || {};
  S.sub[k].grade = x;
  save();
  render();
}
function addCourse() {
  const n = v("#cn");
  if (!n) return;
  const t = S.users.find((u) => u.role === "teacher") || S.users[0],
    cl = ["#7a4fd1", "#c0398a", "#0f8aa6", "#b8860b"];
  S.courses.push({
    id: uid(),
    name: n,
    sec: v("#cs") || "Section 1",
    col: cl[S.courses.length % 4],
    teacher: t.id,
    enrolled: [],
    updates: [],
    items: [],
  });
  save();
  render();
}
function mats(c) {
  const F = U.form,
    fld = {
      assignment: `<input id="f2" type="date" value="${TODAY}"><input id="f3" type="number" min="1" value="10" style="width:80px" aria-label="Points"><textarea id="f4" placeholder="Instructions"></textarea>`,
      test: `<input id="f2" type="date" value="${TODAY}"><span class="mut">Add questions after you create it.</span>`,
      link: `<input id="f1" placeholder="https://example.com" style="min-width:240px">`,
      page: `<textarea id="f4" placeholder="Page content"></textarea>`,
      folder: `<input id="f5" type="color" value="#e0a030" aria-label="Folder color">`,
    };
  const path = [];
  let f = c.items.find((x) => x.id === U.folder);
  while (f) {
    path.unshift(f);
    const p = f.parent;
    f = c.items.find((x) => x.id === p);
  }
  const crumbs = `<div class="mut" style="margin-bottom:8px"><button class="link" onclick="U.folder=null;render()">${esc(c.name)}</button>${path.map((p) => ` › <button class="link" onclick="U.folder='${p.id}';render()">${esc(p.title)}</button>`).join("")}</div>`;
  const row = (i) => {
    const fo = i.type === "folder";
    return `<div class="item">${fo ? `<span style="width:28px;height:22px;border-radius:4px 8px 4px 4px;background:${i.col}"></span>` : `<span style="font-size:22px">${IC[i.type]}</span>`}<div style="flex:1"><button class="link" onclick="${fo ? `U.folder='${i.id}'` : `U.item='${i.id}'`};render()"><b>${esc(i.title)}</b></button><div class="mut">${fo ? kid(c, i.id).length + " items" : i.due ? "Due " + i.due : i.type}${i.type === "test" ? " · " + i.questions.length + " questions" : ""}${i.pub === false ? " · Unpublished" : ""}</div></div>${staff() && (i.type === "assignment" || i.type === "test") && c.cats && c.cats.length ? `<select aria-label="Grade category" onchange="setCat('${c.id}','${i.id}',this.value)"><option value="">No category</option>${c.cats.map((k) => `<option value="${k.id}"${i.cat === k.id ? " selected" : ""}>${esc(k.name)}</option>`).join("")}</select>` : ""}${staff() ? `<button class="btn x" style="color:var(--ink)" onclick="pubT('${c.id}','${i.id}')">${i.pub === false ? "Publish" : "Unpublish"}</button><button class="btn x" onclick="delItem('${c.id}','${i.id}')">Delete</button>` : ""}</div>`;
  };
  const list = kid(c, U.folder).filter((i) => shown(c, i));
  return (
    (staff()
      ? `<div class="card"><div class="menu"><button class="btn" onclick="U.menu=!U.menu;render()">Add Materials ▾</button>${
          U.menu
            ? `<div class="dd">${[
                ["folder", "Folder"],
                ["assignment", "Assignment"],
                ["test", "Test/Quiz"],
                ["link", "Link / Resource"],
                ["page", "Page"],
              ]
                .map((m) => `<button onclick="U.form='${m[0]}';U.menu=false;render()">${IC[m[0]]} ${m[1]}</button>`)
                .join("")}</div>`
            : ""
        }</div>${U.folder ? '<span class="mut"> Adding inside the open folder</span>' : ""}
${F ? `<div class="row"><b>New ${F}</b><input id="f0" placeholder="Title">${fld[F]}<button class="btn" onclick="addItem('${c.id}')">Create</button><button class="link" onclick="U.form=null;render()">Cancel</button></div>` : ""}</div>`
      : "") +
    `<div class="card">${crumbs}${list.map(row).join("") || '<p class="mut">Nothing here yet. Use Add Materials to create a folder, assignment, test, link or page.</p>'}</div>`
  );
}
function addItem(cid) {
  const t = v("#f0");
  if (!t) return;
  const g = (id) => ($(id) ? $(id).value.trim() : ""),
    i = { id: uid(), type: U.form, title: t, parent: U.folder, pub: true };
  if (U.form === "folder") i.col = g("#f5") || "#e0a030";
  if (U.form === "assignment") {
    i.due = g("#f2") || TODAY;
    i.pts = +g("#f3") || 10;
    i.text = g("#f4");
  }
  if (U.form === "test") {
    i.due = g("#f2") || TODAY;
    i.questions = [];
  }
  if (U.form === "link") {
    let u = g("#f1");
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    i.url = u;
  }
  if (U.form === "page") i.text = g("#f4");
  C(cid).items.push(i);
  U.form = null;
  if (i.type === "test") U.item = i.id;
  save();
  render();
}
function delItem(c, id) {
  const cc = C(c),
    kill = new Set([id]);
  let n;
  do {
    n = kill.size;
    cc.items.forEach((i) => {
      if (kill.has(i.parent)) kill.add(i.id);
    });
  } while (kill.size > n);
  cc.items = cc.items.filter((i) => !kill.has(i.id));
  if (kill.has(U.folder)) U.folder = null;
  save();
  render();
}
function pubT(c, id) {
  const i = C(c).items.find((x) => x.id === id);
  i.pub = i.pub === false;
  save();
  render();
}
function groups() {
  const g = U.gid && S.groups.find((x) => x.id === U.gid);
  if (g) {
    const ga = staff() || g.admins.includes(me().id);
    return `<div class="card"><button class="link" onclick="U.gid=null;render()">‹ All groups</button><h2 style="margin-top:8px">${esc(g.name)}</h2><p class="mut">Members: ${esc(g.members.map((id) => nm(id) + (g.admins.includes(id) ? " (admin)" : "")).join(", ")) || "none yet"}</p></div>
${ga ? `<div class="card"><h3>Post an update</h3><textarea id="gp" placeholder="Write an update for the group"></textarea><div class="row"><button class="btn" onclick="postG('${g.id}')">Post update</button></div><h3 style="margin-top:16px">Add a resource</h3><div class="row"><input id="gr" placeholder="Title"><input id="gu" placeholder="Link (optional)"><button class="btn" onclick="addRes('${g.id}')">Add resource</button></div></div>` : ""}
${staff() ? `<div class="card"><h3>Manage members</h3><div class="row" style="margin:0"><button class="btn" onclick="pick('groups','${g.id}','members','all','Add members')">Add members</button><button class="btn x" style="color:var(--ink)" onclick="pick('groups','${g.id}','admins','members','Choose group admins')">Group admins</button></div><p class="mut">Group admins can post updates and resources.</p></div>` : ""}
<div class="card"><h3>Resources</h3>${g.res.map((r) => `<div class="item"><span style="font-size:22px">🔗</span><div style="flex:1"><b>${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>` : esc(r.title)}</b><div class="mut">${esc(nm(r.by))} · ${r.time}</div></div>${ga ? `<button class="btn x" onclick="delRes('${g.id}','${r.id}')">Delete</button>` : ""}</div>`).join("") || '<p class="mut">No resources yet.</p>'}</div>
<div class="card"><h3>Updates</h3>${
      g.posts
        .slice()
        .reverse()
        .map(
          (p) =>
            `<div class="item"><div><b>${esc(nm(p.by))}</b> <span class="mut">${p.time}</span><div>${esc(p.text)}</div></div></div>`,
        )
        .join("") || '<p class="mut">No updates yet.</p>'
    }</div>`;
  }
  const l = S.groups.filter((x) => U.role !== "student" || x.members.includes(me().id));
  return `<h2>Groups</h2>${staff() ? `<div class="card"><div class="row" style="margin:0"><input id="gn" placeholder="New group name"><button class="btn" onclick="addGroup()">New Group</button></div></div>` : ""}<div class="courses">${l.map((x) => `<div class="card course" onclick="U.gid='${x.id}';render()"><div class="bar" style="background:#6a4fd1"></div><div><b>${esc(x.name)}</b><div class="mut">${x.members.length} members</div></div></div>`).join("") || '<p class="mut">You are not in any groups yet.</p>'}</div>`;
}
function addRes(g) {
  const t = v("#gr");
  if (!t) return;
  let u = v("#gu");
  if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
  S.groups.find((x) => x.id === g).res.push({ id: uid(), title: t, url: u, by: me().id, time: TODAY });
  save();
  render();
}
function delRes(g, id) {
  const o = S.groups.find((x) => x.id === g);
  o.res = o.res.filter((r) => r.id !== id);
  save();
  render();
}
function bg(c) {
  return c.img ? `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.4)),url('${c.img}') center/cover` : c.col;
}
function setImg(cid, inp) {
  const f = inp.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const w = Math.min(800, im.width),
        h = Math.round((im.height * w) / im.width),
        cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      {
        const x = cv.getContext("2d");
        x.fillStyle = "#fff";
        x.fillRect(0, 0, w, h);
        x.drawImage(im, 0, 0, w, h);
      }
      C(cid).img = cv.toDataURL("image/jpeg", 0.6);
      save();
      render();
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function avg(c, s) {
  const all = graded(c),
    gi = all.filter((i) => hasG(sg(c.id, i.id, s).grade)),
    cats = c.cats || [];
  if (!(cats.length && all.some((i) => i.cat))) {
    let e = 0,
      p = 0;
    gi.forEach((i) => {
      e += +sg(c.id, i.id, s).grade;
      p += pts(i);
    });
    return p ? Math.round((e / p) * 100) : null;
  }
  let tw = 0,
    sum = 0;
  cats.forEach((k) => {
    let e = 0,
      p = 0;
    gi.filter((i) => i.cat === k.id).forEach((i) => {
      e += +sg(c.id, i.id, s).grade;
      p += pts(i);
    });
    if (p) {
      tw += +k.w;
      sum += (+k.w * e) / p;
    }
  });
  return tw ? Math.round((sum / tw) * 100) : null;
}
function wts(c) {
  c.cats = c.cats || [];
  const tot = c.cats.reduce((a, k) => a + (+k.w || 0), 0);
  return `<div class="card"><h3>Grade weights</h3>${c.cats.map((k) => `<div class="item"><input value="${esc(k.name)}" aria-label="Category name" onchange="setCatF('${c.id}','${k.id}','name',this.value)"><label><input type="number" min="0" max="100" value="${k.w}" style="width:70px" aria-label="Weight" onchange="setCatF('${c.id}','${k.id}','w',this.value)"> %</label><button class="btn x" onclick="delCat('${c.id}','${k.id}')">Remove</button></div>`).join("") || '<p class="mut">No categories yet. Add some (for example Homework 30%, Tests 70%), then pick a category for each assignment or test on the Materials tab. Until then, grades use plain points.</p>'}
<div class="row"><input id="wn" placeholder="Category name"><input id="ww" type="number" min="0" max="100" placeholder="Weight %" style="width:100px"><button class="btn" onclick="addCat('${c.id}')">Add category</button></div>${c.cats.length ? `<p class="${tot === 100 ? "ok" : "bad"}">Total: ${tot}%${tot === 100 ? "" : " (should add up to 100%)"}</p>` : ""}</div>`;
}
function setCatF(c, k, f, x) {
  const o = C(c).cats.find((y) => y.id === k);
  o[f] = f === "w" ? Math.max(0, +x || 0) : x;
  save();
  render();
}
function delCat(c, k) {
  const cc = C(c);
  cc.cats = cc.cats.filter((x) => x.id !== k);
  cc.items.forEach((i) => {
    if (i.cat === k) i.cat = "";
  });
  save();
  render();
}
function addCat(c) {
  const n = v("#wn");
  if (!n) return;
  const cc = C(c);
  cc.cats = cc.cats || [];
  cc.cats.push({ id: uid(), name: n, w: Math.max(0, +v("#ww") || 0) });
  save();
  render();
}
function setCat(c, i, k) {
  C(c).items.find((x) => x.id === i).cat = k;
  save();
  render();
}
const cards = (l, from) =>
  l
    .map(
      (c) =>
        `<div class="card course" onclick="U.from='${from}';go('course','${c.id}')"><div class="bar" style="background:${bg(c)}"></div><div><b>${esc(c.name)}</b><div class="mut">${esc(c.sec)} · ${esc(nm(c.teacher))}</div></div></div>`,
    )
    .join("");
function newCourse() {
  const n = v("#nc");
  if (!n) return;
  const t = U.role === "teacher" ? me().id : (S.users.find((u) => u.role === "teacher") || me()).id,
    cl = ["#7a4fd1", "#c0398a", "#0f8aa6", "#b8860b"],
    c = {
      id: uid(),
      name: n,
      sec: v("#ns") || "Section 1",
      col: cl[S.courses.length % 4],
      teacher: t,
      enrolled: [],
      updates: [],
      items: [],
      cats: [],
    };
  S.courses.push(c);
  save();
  U.from = "mycourses";
  go("course", c.id);
}
const gcards = (l) =>
  l
    .map(
      (x) =>
        `<div class="card course" onclick="U.gid='${x.id}';render()"><div class="bar" style="background:#6a4fd1"></div><div><b>${esc(x.name)}</b><div class="mut">${x.members.length} members</div></div></div>`,
    )
    .join("");
function enr() {
  const l = S.courses.filter((c) => c.enrolled.includes(me().id) || vis().includes(c));
  return `<div class="row" style="justify-content:space-between;margin:0 0 8px"><h2 style="margin:0">Courses</h2>${staff() ? `<button class="btn" onclick="go('mycourses')">My Courses</button>` : ""}</div><p class="mut">All your courses: the ones you are enrolled in and the ones you teach.</p><div class="courses">${cards(l, "courses") || '<p class="mut">You are not enrolled in any courses yet.</p>'}</div>`;
}
function myCourses() {
  return `<button class="link" onclick="go('courses')">‹ Back to Courses</button><h2 style="margin-top:8px">My Courses</h2><p class="mut">Courses you teach.</p><div class="grid2"><div class="courses" style="align-content:start">${cards(vis(), "mycourses") || '<p class="mut">You are not teaching any courses yet. Create one on the right.</p>'}</div><div class="card"><h3>New Course</h3><input id="nc" placeholder="Course name" style="width:100%"><input id="ns" placeholder="Section" style="width:100%;margin-top:8px"><div class="row"><button class="btn" onclick="newCourse()">New Course</button></div><p class="mut">After creating it, add students on the Members tab and a banner image with Edit banner.</p></div></div>`;
}
function groups2() {
  if (U.gid) return groups();
  const l = S.groups.filter(
    (g) => g.members.includes(me().id) || (staff() && (U.role === "admin" || !g.owner || g.owner === me().id)),
  );
  return `<div class="row" style="justify-content:space-between;margin:0 0 8px"><h2 style="margin:0">Groups</h2>${staff() ? `<button class="btn" onclick="U.gid=null;go('mygroups')">My Groups</button>` : ""}</div><p class="mut">All your groups: the ones you belong to and the ones you manage.</p><div class="courses">${gcards(l) || '<p class="mut">You are not in any groups yet.</p>'}</div>`;
}
function myGroups() {
  if (U.gid) return groups();
  const l = S.groups.filter((g) => U.role === "admin" || !g.owner || g.owner === me().id);
  return `<button class="link" onclick="U.gid=null;go('groups')">‹ Back to Groups</button><h2 style="margin-top:8px">My Groups</h2><p class="mut">Groups you manage.</p><div class="grid2"><div class="courses" style="align-content:start">${gcards(l) || '<p class="mut">You have not created any groups yet. Create one on the right.</p>'}</div><div class="card"><h3>New Group</h3><input id="gn" placeholder="Group name" style="width:100%"><div class="row"><button class="btn" onclick="addGroup()">New Group</button></div><p class="mut">After creating it, add members and group admins from the group page.</p></div></div>`;
}
function addGroup() {
  const n = v("#gn");
  if (!n) return;
  S.groups.push({ id: uid(), name: n, members: [], admins: [], res: [], posts: [], owner: me().id });
  save();
  render();
}
function pick(k, id, f, src, title) {
  U.pick = { k, id, f, src, title };
  U.q = "";
  render();
}
function pickList() {
  const p = U.pick,
    o = S[p.k].find((x) => x.id === p.id);
  let l =
    p.src === "students" ? studs() : p.src === "members" ? S.users.filter((u) => o.members.includes(u.id)) : S.users;
  const q = (U.q || "").toLowerCase();
  l = l.filter((u) => u.name.toLowerCase().includes(q));
  return (
    l
      .map((u) => {
        const on = o[p.f].includes(u.id);
        return `<button class="pr${on ? " on" : ""}" role="checkbox" aria-checked="${on}" onclick="tog('${p.k}','${o.id}','${p.f}','${u.id}')"><span class="av" style="background:hsl(${([...u.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360} 55% 42%)">${esc(
          u.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join(""),
        )}</span><span style="flex:1;text-align:left"><b>${esc(u.name)}</b><div class="mut">${u.role}</div></span><span class="ck">${on ? "✓" : ""}</span></button>`;
      })
      .join("") || '<p class="mut" style="padding:12px">No one found.</p>'
  );
}
function modal() {
  const p = U.pick;
  if (!p) return "";
  const o = S[p.k].find((x) => x.id === p.id);
  if (!o) {
    U.pick = null;
    return "";
  }
  return `<div class="ov" onclick="if(event.target===this){U.pick=null;render()}"><div class="dlg" role="dialog" aria-modal="true" aria-label="${esc(p.title)}"><h3 style="margin:0">${esc(p.title)}</h3><div class="mut">${esc(o.name)} · ${o[p.f].length} selected</div><input id="pq" placeholder="Search people" value="${esc(U.q || "")}" oninput="U.q=this.value;$('#pl').innerHTML=pickList()" style="width:100%"><div id="pl" class="pls">${pickList()}</div><div class="row" style="justify-content:flex-end;margin:0"><button class="btn" onclick="U.pick=null;render()">Done</button></div></div></div>`;
}
addEventListener("keydown", (e) => {
  if (e.key === "Escape" && U.pick) {
    U.pick = null;
    render();
  }
});
const LOGO = "assets/logo.jpg",
  logo = () => S.school.logo || LOGO;
try {
  U.user = sessionStorage.getItem("lms_user");
} catch (e) {}
let DB = null,
  last = {},
  ts = {},
  tm = 0,
  loaded = false,
  seeded = false;
function brand() {
  document.documentElement.style.setProperty("--nav", S.school.color);
  $("#sn").innerHTML =
    `<img src="${logo()}" alt="" style="height:30px;width:30px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px">${esc(S.school.name)}`;
}
function login() {
  return loginCard(false);
}
function signIn() {
  const un = v("#lu").toLowerCase(),
    pw = $("#lp").value,
    u = S.users.find((x) => x.un === un && x.pw === pw);
  if (!u) {
    U.msg = "Wrong username or password.";
    render();
    $("#lu").value = un;
    return;
  }
  U.msg = "";
  U.user = u.id;
  U.view = "home";
  try {
    sessionStorage.setItem("lms_user", u.id);
  } catch (e) {}
  render();
  splash();
}
function signOut() {
  U.user = null;
  U.msg = "";
  U.pick = null;
  try {
    sessionStorage.removeItem("lms_user");
  } catch (e) {}
  render();
}
function splash() {
  const d = document.createElement("div");
  d.className = "sp2";
  d.innerHTML = `<img src="${logo()}" alt="" class="sl"><h1>${[...S.school.name].map((c, i) => `<span style="animation-delay:${0.7 + i * 0.05}s">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("")}</h1>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 3300);
}
function setLogo(inp) {
  const f = inp.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const w = Math.min(400, im.width),
        h = Math.round((im.height * w) / im.width),
        cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const x = cv.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, w, h);
      x.drawImage(im, 0, 0, w, h);
      S.school.logo = cv.toDataURL("image/jpeg", 0.8);
      save();
      render();
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
function addUser() {
  const n = v("#un"),
    un = v("#uu").toLowerCase(),
    pw = v("#up");
  if (!n || !un || !pw) {
    U.msg = "Enter a name, username and password.";
    render();
    return;
  }
  if (S.users.some((u) => u.un === un)) {
    U.msg = "That username is taken.";
    render();
    return;
  }
  S.users.push({ id: uid(), name: n, un, pw, role: $("#ur").value });
  U.msg = "";
  save();
  render();
}
function setUn(id, val) {
  val = val.trim().toLowerCase();
  if (!val || S.users.some((u) => u.un === val && u.id !== id)) {
    U.msg = "Username is empty or already taken.";
    render();
    return;
  }
  U.msg = "";
  edit("users", id, "un", val);
}
function del(k, id) {
  if (k === "users" && id === U.user) {
    U.msg = "You cannot remove the account you are signed in with.";
    render();
    return;
  }
  S[k] = S[k].filter((x) => x.id !== id);
  if (k === "courses" && U.cid === id) go("courses");
  save();
  render();
}
const lpd = () =>
  Object.assign(
    { title: "", sub: "Sign in to continue", bg: "", bgImg: "", btn: "", cardBg: "", showLogo: true, foot: "" },
    S.school.lp || {},
  );
function loginBgCss(o, fixed) {
  return o.bgImg
    ? `linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url('${o.bgImg}') center/cover${fixed ? " fixed" : ""}`
    : o.bg || "";
}
function loginBg() {
  document.body.style.background = loginBgCss(lpd(), true);
}
function loginCard(pre) {
  const o = lpd(),
    ad = !pre && S.users.some((u) => u.role === "admin" && u.pw === "admin"),
    dis = pre ? " disabled" : "",
    id = (x) => (pre ? "" : ` id="${x}"`);
  let vars = "";
  if (o.cardBg) {
    const h = o.cardBg.replace("#", ""),
      n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16),
      l = ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
    vars =
      `background:${o.cardBg};` +
      (l > 150
        ? "--ink:#1c2538;--mut:#667189;--bg:#eef1f6;--line:#dbe0ea;"
        : "--ink:#e6eaf3;--mut:#94a0b8;--bg:#10151f;--line:#2c364b;");
  }
  return `<div class="card" style="max-width:380px;margin:${pre ? "0 auto" : "40px auto"};text-align:center;color:var(--ink);${vars}">${o.showLogo ? `<img src="${logo()}" alt="" style="width:150px;height:auto;border-radius:12px">` : ""}<h2 style="margin:8px 0 4px">${esc(o.title || S.school.name)}</h2><p class="mut">${esc(o.sub)}</p><input${id("lu")}${dis} placeholder="Username" autocomplete="username" style="width:100%" onkeydown="if(event.key==='Enter')$('#lp').focus()"><input${id("lp")}${dis} type="password" placeholder="Password" autocomplete="current-password" style="width:100%;margin-top:8px" onkeydown="if(event.key==='Enter')signIn()">${!pre && U.msg ? `<p class="bad">${esc(U.msg)}</p>` : ""}<div class="row"><button class="btn"${dis}${pre ? "" : ' onclick="signIn()"'} style="width:100%;${o.btn ? "background:" + o.btn + ";" : ""}">Sign in</button></div>${o.foot ? `<p class="mut">${esc(o.foot)}</p>` : ""}${ad ? '<p class="mut">First time here? The admin account is username <b>admin</b>, password <b>admin</b>. Change it on the Admin page.</p>' : ""}</div>`;
}
function lpAdmin() {
  const o = lpd(),
    f = (k, label, ph) =>
      `<label class="mut" style="display:block;margin-top:8px">${label}<input value="${esc(o[k])}" placeholder="${esc(ph)}" style="width:100%" onchange="lpSet('${k}',this.value)"></label>`;
  return `<div class="card"><h3>Login page</h3><div class="grid2"><div>${f("title", "Headline", "School name")}${f("sub", "Subtitle", "Sign in to continue")}${f("foot", "Footer note", "Optional")}
<div class="row"><label>Background <input type="color" value="${o.bg || "#17325f"}" onchange="lpSet('bg',this.value)"></label><label>Button <input type="color" value="${o.btn || "#2b6be0"}" onchange="lpSet('btn',this.value)"></label><label>Card <input type="color" value="${o.cardBg || "#ffffff"}" onchange="lpSet('cardBg',this.value)"></label></div>
<div class="row"><label class="mut">Background image <input type="file" accept="image/*" aria-label="Login background image" onchange="setLoginBg(this)"></label>${o.bgImg ? `<button class="btn x" onclick="lpSet('bgImg','')">Remove image</button>` : ""}</div>
<div class="row"><label><input type="checkbox"${o.showLogo ? " checked" : ""} onchange="lpSet('showLogo',this.checked)"> Show logo</label><button class="btn x" onclick="S.school.lp={};save();render()">Reset to default</button></div></div>
<div><div class="mut" style="margin-bottom:6px">Preview</div><div style="border-radius:10px;padding:16px;background:${loginBgCss(o) || "var(--bg)"};border:1px solid var(--line)">${loginCard(true)}</div></div></div></div>`;
}
function lpSet(k, v) {
  S.school.lp = S.school.lp || {};
  S.school.lp[k] = v;
  save();
  render();
}
function setLoginBg(inp) {
  const f = inp.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const w = Math.min(1200, im.width),
        h = Math.round((im.height * w) / im.width),
        cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const x = cv.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, w, h);
      x.drawImage(im, 0, 0, w, h);
      lpSet("bgImg", cv.toDataURL("image/jpeg", 0.6));
    };
    im.src = rd.result;
  };
  rd.readAsDataURL(f);
}
const lsSave = () => {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (e) {}
};
const subSid = (k) => k.split(":")[2];
function pushDb() {
  if (!DB) return;
  clearTimeout(tm);
  tm = setTimeout(commit, 400);
}
async function commitNow() {
  clearTimeout(tm);
  return commit();
}
async function commit() {
  if (!DB) return true;
  const w = [],
    keys = [],
    { sub, ...rest } = S,
    cj = JSON.stringify(rest);
  if (staff() && cj !== last.core) {
    last.core = cj;
    ts.core = Date.now();
    keys.push("core");
    w.push(DB.doc("lms/core").set({ json: cj, ts: ts.core }));
  }
  const by = {};
  Object.keys(S.sub).forEach((k) => ((by[subSid(k)] = by[subSid(k)] || {})[k] = S.sub[k]));
  Object.keys(last).forEach((k) => {
    if (k.startsWith("sub_") && !by[k.slice(4)]) by[k.slice(4)] = {};
  });
  for (const sid in by) {
    const key = "sub_" + sid,
      j = JSON.stringify(by[sid]);
    if (j !== last[key] && (staff() || sid === U.user)) {
      last[key] = j;
      ts[key] = Date.now();
      keys.push(key);
      w.push(DB.doc("lms/" + key).set({ json: j, ts: ts[key] }));
    }
  }
  const res = await Promise.allSettled(w);
  let ok = true;
  res.forEach((r, n) => {
    if (r.status === "rejected") {
      ok = false;
      delete last[keys[n]];
    }
  });
  if (!ok)
    note(
      "Not saved to the shared database. Your account may be view-only. Ask the course owner for Contributor (edit) access.",
    );
  return ok;
}
function applyDoc(d) {
  const id = d.id,
    x = d.data();
  if (!x || typeof x.json !== "string" || (x.ts || 0) < (ts[id] || 0) || x.json === last[id === "core" ? "core" : id])
    return;
  try {
    const o = JSON.parse(x.json);
    if (id === "core") {
      if (!o || !o.users || !o.courses || !o.groups || !o.school) return;
      o.sub = S.sub || {};
      S = o;
      fix();
      last.core = x.json;
    } else if (id.startsWith("sub_")) {
      const sid = id.slice(4);
      Object.keys(S.sub).forEach((k) => {
        if (subSid(k) === sid) delete S.sub[k];
      });
      Object.assign(S.sub, o);
      last[id] = x.json;
    } else return;
    ts[id] = x.ts || 0;
  } catch (e) {}
}
async function initDb() {
  try {
    const db = await claude.use("db");
    if (!db) return;
    DB = db;
    db.collection("lms").onSnapshot(
      (snap) => {
        const hasCore = snap.docs.some((d) => d.id === "core"),
          legacy = snap.docs.find((d) => d.id === "state");
        if (hasCore && !loaded) {
          loaded = true;
          S.sub = {};
        }
        snap.docs.forEach(applyDoc);
        if (!hasCore && !snap.metadata.fromCache && !seeded) {
          seeded = true;
          if (legacy) {
            try {
              const o = JSON.parse(legacy.data().json);
              if (o && o.users && o.courses) {
                S = o;
                fix();
              }
            } catch (e) {}
          }
          commit();
        }
        lsSave();
        const a = document.activeElement;
        if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
        render();
      },
      () => {},
    );
  } catch (e) {}
}
function note(m) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "alert");
    t.style.cssText =
      "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#c23a3a;color:#fff;padding:10px 16px;border-radius:8px;z-index:60;max-width:90vw;box-shadow:0 6px 18px rgba(0,0,0,.3)";
    document.body.appendChild(t);
  }
  t.textContent = m;
  clearTimeout(t._h);
  t._h = setTimeout(() => t.remove(), 9000);
}
async function putSub(key, val) {
  S.sub[key] = val;
  lsSave();
  const ok = await commitNow();
  if (!ok) {
    delete S.sub[key];
    lsSave();
    note(
      "Your work was NOT sent to your teacher. Your account may be view-only. Ask for Contributor (edit) access, then try again.",
    );
  }
  render();
}
async function takeTest(c, id) {
  const sid = me().id;
  if (U.busy || sg(c, id, sid).ans) return;
  U.busy = true;
  try {
    const i = C(c).items.find((x) => x.id === id);
    const ans = i.questions.map((q, n) => {
      if (q.t === "ms") return [...document.querySelectorAll(`input[name=q${n}]:checked`)].map((x) => x.value);
      if (q.t === "mc" || q.t === "tf") {
        const r = document.querySelector(`input[name=q${n}]:checked`);
        return r ? r.value : "";
      }
      return document.querySelector(`[name=q${n}]`).value;
    });
    const award = i.questions.map((q, n) => auto(q, ans[n]));
    await putSub(c + ":" + id + ":" + sid, { ans, award, grade: finalGrade(award) });
  } finally {
    U.busy = false;
  }
}
async function turnIn(c, i) {
  const t = v("#sb"),
    sid = me().id;
  if (!t || U.busy || sg(c, i, sid).text) return;
  U.busy = true;
  try {
    await putSub(c + ":" + i + ":" + sid, { text: t, grade: "" });
  } finally {
    U.busy = false;
  }
}
function retake(c, i, sid) {
  delete S.sub[c + ":" + i + ":" + sid];
  U.rev = null;
  save();
  render();
}
const DEFSCALE = [
  { l: "A", min: 90 },
  { l: "B", min: 80 },
  { l: "C", min: 70 },
  { l: "D", min: 60 },
  { l: "F", min: 0 },
];
const scl = () => S.school.scale || (S.school.scale = DEFSCALE.map((x) => ({ ...x })));
function gradeLetter(p) {
  const sc = (S.school.scale && S.school.scale.length ? S.school.scale : DEFSCALE)
      .slice()
      .sort((a, b) => b.min - a.min),
    f = sc.find((x) => p >= x.min);
  return f ? f.l : sc[sc.length - 1].l;
}
function setScale(n, f, val) {
  const s = scl();
  if (f === "min") s[n].min = Math.max(0, Math.min(100, +val || 0));
  else s[n].l = val.trim() || s[n].l;
  s.sort((a, b) => b.min - a.min);
  save();
  render();
}
function addScale() {
  const l = v("#sl"),
    m = $("#sm").value;
  if (!l || m === "") return;
  scl().push({ l, min: Math.max(0, Math.min(100, +m || 0)) });
  scl().sort((a, b) => b.min - a.min);
  save();
  render();
}
function delScale(n) {
  const s = scl();
  if (s.length > 1) s.splice(n, 1);
  save();
  render();
}
function scaleAdmin() {
  const s = (S.school.scale || DEFSCALE).slice().sort((a, b) => b.min - a.min);
  const low =
    s[s.length - 1].min > 0
      ? '<p class="bad">No row starts at 0%, so very low grades will show the lowest letter.</p>'
      : "";
  return `<div class="card"><h3>Grading scale</h3><p class="mut">A student gets the first letter whose minimum percentage they reach.</p>
${s.map((x, n) => `<div class="item"><input value="${esc(x.l)}" style="width:80px" aria-label="Letter grade" onchange="setScale(${n},'l',this.value)"><label>from <input type="number" min="0" max="100" value="${x.min}" style="width:80px" aria-label="Minimum percent" onchange="setScale(${n},'min',this.value)"> %</label><button class="btn x" onclick="delScale(${n})">Remove</button></div>`).join("")}
${low}<div class="row"><input id="sl" placeholder="Letter (e.g. A+)" style="width:130px"><input id="sm" type="number" min="0" max="100" placeholder="Min %" style="width:90px"><button class="btn" onclick="addScale()">Add grade</button><button class="btn x" onclick="delete S.school.scale;save();render()">Reset to A–F</button></div></div>`;
}
function fail(e) {
  console.error(e);
  $("#main").innerHTML =
    `<div class="card"><h3 class="bad">Something went wrong</h3><pre style="white-space:pre-wrap">${esc(e && e.stack ? e.stack.split("\n").slice(0, 4).join("\n") : String(e))}</pre><div class="row"><button class="btn" onclick="U.view='home';U.item=null;U.pick=null;render()">Back to Home</button><button class="btn x" onclick="signOut()">Sign out</button><button class="btn x" onclick="resetAll()">Reset all data</button></div><p class="mut">Reset all data deletes every course, account and grade and starts over with the sample data.</p></div>`;
}
async function resetAll() {
  try {
    localStorage.removeItem(K);
    sessionStorage.removeItem("lms_user");
  } catch (e) {}
  S = seed();
  fix();
  last = {};
  await commitNow();
  location.reload();
}
function render() {
  try {
    renderMain();
  } catch (e) {
    fail(e);
  }
}
function renderMain() {
  if (U.user && !S.users.some((u) => u.id === U.user)) U.user = null;
  if (!U.user) {
    brand();
    loginBg();
    $("#nav").innerHTML = "";
    $("#me").textContent = "";
    $("#so").hidden = true;
    $("#main").innerHTML = login();
    $("#modal").innerHTML = "";
    return;
  }
  document.body.style.background = "";
  U.role = S.users.find((u) => u.id === U.user).role;
  $("#so").hidden = false;
  renderApp();
  $("#me").textContent = me().name + " · " + U.role;
}
const QT = {
  mc: "Multiple choice",
  tf: "True / False",
  ms: "Multiple select",
  sa: "Short answer",
  num: "Number",
  essay: "Essay (graded by hand)",
};
const qp = (q) => +(q.pts ?? 1) || 0,
  norm = (x) =>
    String(x ?? "")
      .trim()
      .toLowerCase(),
  showA = (a) => (Array.isArray(a) ? a.join(", ") : String(a ?? "")),
  ans2s = (q) => (Array.isArray(q.a) ? q.a.join(", ") : q.t === "num" && q.tol ? q.a + " ± " + q.tol : String(q.a)),
  finalGrade = (aw) =>
    aw.some((x) => x === null) ? "" : String(Math.round(aw.reduce((a, x) => a + x, 0) * 100) / 100);
const plural = (n) => (n == 1 ? "" : "s");
function auto(q, a) {
  const m = qp(q);
  if (q.t === "essay") return null;
  if (q.t === "ms") {
    const c = (q.a || []).map(norm).sort().join("|"),
      g = (Array.isArray(a) ? a : []).map(norm).sort().join("|");
    return c === g ? m : 0;
  }
  if (q.t === "num") {
    const x = parseFloat(a),
      y = parseFloat(q.a);
    return !isNaN(x) && Math.abs(x - y) <= (+q.tol || 0) + 1e-9 ? m : 0;
  }
  if (q.t === "sa") return (Array.isArray(q.a) ? q.a : [q.a]).some((z) => norm(z) === norm(a)) ? m : 0;
  return norm(a) === norm(q.a) ? m : 0;
}
const awards = (i, sb) =>
  i.questions.map((q, n) => (sb.award && sb.award[n] !== undefined ? sb.award[n] : auto(q, (sb.ans || [])[n])));

function qform(c, i) {
  const d = U.qd || {},
    t = U.qt || "mc";
  const hint = {
    mc: "Correct option (type it exactly)",
    ms: "Correct options, comma separated",
    sa: "Accepted answers, comma separated",
    num: "Correct number",
  };
  let ans = "";
  if (t === "tf")
    ans = `<select id="qa" aria-label="Correct answer"><option${d.a === "False" ? "" : " selected"}>True</option><option${d.a === "False" ? " selected" : ""}>False</option></select>`;
  else if (t !== "essay")
    ans = `<input id="qa" placeholder="${hint[t]}" value="${esc(d.a || "")}" style="flex:1;min-width:220px">`;
  if (t === "num")
    ans += `<label>± <input id="qx" type="number" step="any" min="0" value="${d.x ?? 0}" style="width:80px"></label>`;
  return `<div class="card" style="background:var(--bg)"><h3>Add a question</h3>
<div class="row"><select id="qt" aria-label="Question type" onchange="qType(this.value)">${Object.keys(QT)
    .map((k) => `<option value="${k}"${t === k ? " selected" : ""}>${QT[k]}</option>`)
    .join("")}</select>
<label>Points <input id="qp" type="number" step="0.5" min="0" value="${d.p ?? 1}" style="width:80px"></label></div>
<div class="row"><input id="qq" placeholder="Question" value="${esc(d.q || "")}" style="flex:1;min-width:220px"></div>
${t === "mc" || t === "ms" ? `<div class="row"><input id="qo" placeholder="Options, comma separated" value="${esc(d.o || "")}" style="flex:1;min-width:220px"></div>` : ""}
${ans ? `<div class="row">${ans}</div>` : '<p class="mut">Essays have no answer key. You score them by hand under Student responses.</p>'}
${U.qerr ? `<p class="bad">${esc(U.qerr)}</p>` : ""}
<div class="row"><button class="btn" onclick="addQ('${c.id}','${i.id}')">Add question</button></div></div>`;
}
function qType(t) {
  U.qd = { q: v("#qq"), o: $("#qo") ? v("#qo") : (U.qd || {}).o || "", p: $("#qp").value };
  U.qt = t;
  U.qerr = "";
  render();
}
function addQ(c, id) {
  const t = U.qt || "mc",
    q = v("#qq");
  let o = [],
    a = "";
  const list = (sel) =>
    v(sel)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  if (t === "mc" || t === "ms") o = list("#qo");
  if (t === "tf") {
    o = ["True", "False"];
    a = $("#qa").value;
  } else if (t === "ms" || t === "sa") a = list("#qa");
  else if (t !== "essay") a = v("#qa");
  const bad =
    !q || ((t === "mc" || t === "ms") && o.length < 2) || (t !== "essay" && (Array.isArray(a) ? !a.length : !a));
  if (bad) {
    U.qd = { q, o: $("#qo") ? v("#qo") : "", a: $("#qa") ? $("#qa").value : "", p: $("#qp").value };
    U.qerr = "Fill in the question, at least two options for choice questions, and the correct answer.";
    render();
    return;
  }
  const qq = { t, q, opts: o, a, pts: Math.max(0, +$("#qp").value || 0) };
  if (t === "num") qq.tol = Math.max(0, +$("#qx").value || 0);
  C(c)
    .items.find((x) => x.id === id)
    .questions.push(qq);
  U.qd = null;
  U.qerr = "";
  save();
  render();
}
function delQ(c, id, n) {
  if (Object.keys(S.sub).some((k) => k.startsWith(c + ":" + id + ":") && S.sub[k].ans)) {
    U.qerr = "You cannot remove questions after students have taken the test.";
    render();
    return;
  }
  C(c)
    .items.find((x) => x.id === id)
    .questions.splice(n, 1);
  U.qerr = "";
  save();
  render();
}
function qinput(q, n) {
  const m = qp(q),
    hd = `<b>${n + 1}. ${esc(q.q)}</b> <span class="mut">(${m} pt${plural(m)})</span>`,
    lab = (type, o) =>
      `<label style="display:block;margin-top:4px"><input type="${type}" name="q${n}" value="${esc(o)}"> ${esc(o)}</label>`;
  let f;
  if (q.t === "mc" || q.t === "tf") f = q.opts.map((o) => lab("radio", o)).join("");
  else if (q.t === "ms")
    f = '<div class="mut">Select all that apply</div>' + q.opts.map((o) => lab("checkbox", o)).join("");
  else if (q.t === "essay")
    f = `<textarea name="q${n}" style="margin-top:6px" placeholder="Write your answer"></textarea>`;
  else f = `<div><input name="q${n}" ${q.t === "num" ? 'type="number" step="any"' : ""} style="margin-top:6px"></div>`;
  return `<div class="item" style="display:block">${hd}${f}</div>`;
}
function review(c, i, sid) {
  const sb = sg(c.id, i.id, sid),
    aw = awards(i, sb);
  const btn = (d, label, sign) =>
    `<button class="btn x" style="color:var(--ink)" aria-label="${label}" onclick="adj('${c.id}','${i.id}','${sid}',@N@,${d})">${sign}</button>`;
  return (
    `<div class="card" style="background:var(--bg);margin-top:8px">` +
    i.questions
      .map((q, n) => {
        const a = sb.ans[n],
          m = qp(q),
          x = aw[n],
          b = (d, l, s) => btn(d, l, s).replace("@N@", n);
        return `<div class="item" style="display:block"><b>${n + 1}. ${esc(q.q)}</b> <span class="mut">(${m} pt${plural(m)} · ${QT[q.t]})</span>
<div style="margin:6px 0;white-space:pre-wrap">${esc(showA(a)) || '<span class="mut">(blank)</span>'}</div>
${q.t === "essay" ? "" : `<div class="mut">Correct: ${esc(ans2s(q))}</div>`}
<div class="row">${b(-0.5, "Subtract half a point", "−")}<input type="number" step="0.5" min="0" max="${m}" value="${x === null ? "" : x}" placeholder="–" style="width:80px" aria-label="Points for question ${n + 1}" onchange="setAward('${c.id}','${i.id}','${sid}',${n},this.value)">${b(0.5, "Add half a point", "+")}<span class="mut">of ${m}</span></div></div>`;
      })
      .join("") +
    `</div>`
  );
}
function setAward(c, id, sid, n, val) {
  const i = C(c).items.find((x) => x.id === id),
    sb = S.sub[c + ":" + id + ":" + sid];
  if (!sb) return;
  const aw = awards(i, sb),
    m = qp(i.questions[n]);
  aw[n] = val === "" ? null : Math.max(0, Math.min(m, Math.round((+val || 0) * 100) / 100));
  sb.award = aw;
  sb.grade = finalGrade(aw);
  save();
  render();
}
function adj(c, id, sid, n, d) {
  const i = C(c).items.find((x) => x.id === id),
    x = awards(i, S.sub[c + ":" + id + ":" + sid])[n];
  setAward(c, id, sid, n, String((x || 0) + d));
}
function testView(c, i, sb) {
  const tot = pts(i);
  let h = `<p class="mut">${i.questions.length} question${plural(i.questions.length)} · ${tot} point${plural(tot)}</p>`;
  if (staff()) {
    h += "<h3>Questions</h3>";
    h +=
      i.questions
        .map(
          (q, n) =>
            `<div class="item"><div style="flex:1"><b>${n + 1}. ${esc(q.q)}</b><div class="mut">${QT[q.t]} · ${qp(q)} pt${plural(qp(q))}${q.opts && q.opts.length ? " · " + esc(q.opts.join(" / ")) : ""}${q.t === "essay" ? " · graded by hand" : " · answer: " + esc(ans2s(q))}</div></div><button class="btn x" onclick="delQ('${c.id}','${i.id}',${n})">Remove</button></div>`,
        )
        .join("") || '<p class="mut">No questions yet.</p>';
    h += qform(c, i);
    h += '<h3 style="margin-top:16px">Student responses</h3>';
    h += c.enrolled
      .map((id) => {
        const s = sg(c.id, i.id, id);
        const right = s.ans
          ? `<span class="${hasG(s.grade) ? "" : "bad"}">${hasG(s.grade) ? s.grade + "/" + tot : "Needs grading"}</span><button class="btn" onclick="U.rev=U.rev==='${id}'?null:'${id}';render()">${U.rev === id ? "Close" : "Review"}</button><button class="btn x" onclick="retake('${c.id}','${i.id}','${id}')">Allow retake</button>`
          : '<span class="mut">Not taken</span>';
        return `<div class="item"><b style="flex:1">${esc(nm(id))}</b>${right}</div>${U.rev === id && s.ans ? review(c, i, id) : ""}`;
      })
      .join("");
    return h;
  }
  if (sb.ans) {
    const aw = awards(i, sb);
    h += hasG(sb.grade)
      ? `<p>Score: <b>${sb.grade}/${tot}</b></p>`
      : '<p class="mut">Submitted. Your teacher still needs to grade some questions.</p>';
    return (
      h +
      i.questions
        .map((q, n) => {
          const x = aw[n];
          return `<div class="item" style="display:block"><b>${n + 1}. ${esc(q.q)}</b><div class="mut" style="white-space:pre-wrap">Your answer: ${esc(showA(sb.ans[n])) || "(blank)"}</div>${x === null ? '<div class="mut">Waiting for grade</div>' : `<div class="${x >= qp(q) ? "ok" : x > 0 ? "" : "bad"}">${x}/${qp(q)} pts</div>`}${q.t !== "essay" && x !== null && x < qp(q) ? `<div class="mut">Correct: ${esc(ans2s(q))}</div>` : ""}</div>`;
        })
        .join("")
    );
  }
  if (!i.questions.length) return h + '<p class="mut">This test has no questions yet.</p>';
  return (
    h +
    i.questions.map(qinput).join("") +
    `<div class="row"><button class="btn" onclick="takeTest('${c.id}','${i.id}')">Submit test</button></div>`
  );
}
function fix() {
  S.groups.forEach((g) => {
    g.admins = g.admins || [];
    g.res = g.res || [];
  });
  if (S.school.name === "🏫 Schoolhouse") S.school.name = "Tundra Academy";
  const used = new Set(S.users.map((u) => u.un).filter(Boolean));
  S.users.forEach((u) => {
    if (u.un) return;
    const t = u.name.split(" "),
      first = (/^(Ms|Mr|Mrs|Dr)\.?$/.test(t[0]) ? t[1] : t[0]) || "user",
      b = u.role === "admin" ? "admin" : first.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
    let n = b,
      k = 1;
    while (used.has(n)) n = b + ++k;
    used.add(n);
    u.un = n;
    u.pw = u.role === "admin" ? "admin" : "welcome1";
  });
  const a = S.users.find((u) => u.role === "admin" && u.un === "principal" && u.pw === "admin");
  if (a && !S.users.some((u) => u.un === "admin")) a.un = "admin";
}
function renderApp() {
  const sp = $("#pl"),
    st = sp ? sp.scrollTop : 0;
  document.documentElement.style.setProperty("--nav", S.school.color);
  brand();

  const n = [
    ["home", "Home"],
    ["courses", "Courses"],
    ["groups", "Groups"],
    ["grades", "Grades"],
  ];
  if (U.role === "admin") n.push(["admin", "Admin"]);
  $("#nav").innerHTML = n
    .map(
      (x) =>
        `<button class="${U.view === x[0] || ((U.view === "course" || U.view === "mycourses") && x[0] === "courses") || (U.view === "mygroups" && x[0] === "groups") ? "on" : ""}" onclick="U.gid=null;go('${x[0]}')">${x[1]}</button>`,
    )
    .join("");
  $("#main").innerHTML = {
    home,
    courses: enr,
    mycourses: myCourses,
    course,
    groups: groups2,
    mygroups: myGroups,
    grades,
    admin,
  }[U.view]();
  $("#modal").innerHTML = modal();
  if ($("#pl")) $("#pl").scrollTop = st;
}
render();
initDb();
