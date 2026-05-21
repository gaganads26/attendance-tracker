let subjects = JSON.parse(localStorage.getItem("subjects")) || [];

function save() { localStorage.setItem("subjects", JSON.stringify(subjects)); }

function addSubject() {
  const name = document.getElementById("subjectName").value.trim();
  if (!name) return alert("Please enter a subject name!");
  subjects.push({ name: name, total: 0, attended: 0 });
  save(); render();
  document.getElementById("subjectName").value = "";
}

function markPresent(i) { subjects[i].total++; subjects[i].attended++; save(); render(); }
function markAbsent(i) { subjects[i].total++; save(); render(); }

function undo(i) {
  if (subjects[i].total === 0) return;
  if (subjects[i].attended === subjects[i].total) subjects[i].attended--;
  subjects[i].total--;
  save(); render();
}

function deleteSubject(i) {
  if (confirm("Delete " + subjects[i].name + "?")) { subjects.splice(i, 1); save(); render(); }
}

function render() {
  const list = document.getElementById("subjectList");
  if (subjects.length === 0) { list.innerHTML = '<p style="text-align:center;color:#aaa;margin-top:20px;">No subjects added yet.</p>'; return; }
  list.innerHTML = subjects.map((s, i) => {
    const pct = s.total === 0 ? 0 : Math.round((s.attended / s.total) * 100);
    const missed = s.total - s.attended;
    const color = pct >= 75 ? "#2ecc71" : pct >= 60 ? "#e67e22" : "#e74c3c";
    const needed = Math.ceil((0.75 * s.total - s.attended) / 0.25);
    const skip = Math.floor((s.attended - 0.75 * s.total) / 0.75);
    let statusMsg = s.total === 0 ? `<p class="needed-msg">Start marking attendance!</p>`
      : pct >= 75 ? `<p class="safe">✅ You can skip ${skip} more class${skip !== 1 ? "es" : ""}</p>`
      : `<p class="warning">⚠️ Attend ${needed} more class${needed !== 1 ? "es" : ""} to reach 75%</p>`;
    return `<div class="subject-card">
      <div class="subject-top"><span class="subject-name">${s.name}</span><button class="delete-btn" onclick="deleteSubject(${i})">🗑️</button></div>
      <div class="stats">
        <div class="stat-box"><div class="num">${s.total}</div><div class="label">Total</div></div>
        <div class="stat-box"><div class="num" style="color:#2ecc71">${s.attended}</div><div class="label">Present</div></div>
        <div class="stat-box"><div class="num" style="color:#e74c3c">${missed}</div><div class="label">Absent</div></div>
        <div class="stat-box"><div class="num" style="color:${color}">${pct}%</div><div class="label">Attendance</div></div>
      </div>
      <div class="percentage-bar"><div class="percentage-fill" style="width:${pct}%;background:${color}"></div></div>
      ${statusMsg}
      <div class="action-btns">
        <button class="btn-present" onclick="markPresent(${i})">✅ Present</button>
        <button class="btn-absent" onclick="markAbsent(${i})">❌ Absent</button>
        <button class="btn-undo" onclick="undo(${i})">↩ Undo</button>
      </div>
    </div>`;
  }).join("");
}
render();