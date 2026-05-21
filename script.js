const firebaseConfig = {
  apiKey: "AIzaSyB7CZUWOiZhyzc2A2m9rwuRPtud1b2T7t4",
  authDomain: "attendance-tracker-4c5bb.firebaseapp.com",
  projectId: "attendance-tracker-4c5bb",
  storageBucket: "attendance-tracker-4c5bb.firebasestorage.app",
  messagingSenderId: "20803435787",
  appId: "1:20803435787:web:30488d5b9d676a9b68f60e"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentRole = null;
let students = [];
let subjects = [];
let attendanceData = {};

// AUTH FUNCTIONS
function showLogin() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('registerPage').classList.add('hidden');
}

function showRegister() {
  document.getElementById('registerPage').classList.remove('hidden');
  document.getElementById('loginPage').classList.add('hidden');
}

async function register() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const role = document.getElementById('registerRole').value;
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection('users').doc(cred.user.uid).set({ name, email, role });
    alert('Registered successfully! Please login.');
    showLogin();
  } catch(e) {
    document.getElementById('registerError').textContent = e.message;
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch(e) {
    document.getElementById('loginError').textContent = e.message;
  }
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    const doc = await db.collection('users').doc(user.uid).get();
    currentRole = doc.data().role;
    const name = doc.data().name;
    hidAllPages();
    if (currentRole === 'teacher') {
      document.getElementById('teacherPage').classList.remove('hidden');
      loadStudents();
      loadSubjects();
      loadTimetable();
    } else {
      document.getElementById('studentPage').classList.remove('hidden');
      document.getElementById('studentWelcome').textContent = 'Welcome, ' + name + '!';
      loadStudentDashboard(name);
    }
  } else {
    hidAllPages();
    document.getElementById('loginPage').classList.remove('hidden');
  }
});

function hidAllPages() {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
}

// TABS
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  event.target.classList.add('active');
}

// STUDENTS
async function addStudent() {
  const name = document.getElementById('studentName').value.trim();
  const roll = document.getElementById('studentRoll').value.trim();
  if (!name || !roll) return alert('Enter name and roll number!');
  await db.collection('students').add({ name, roll, createdAt: new Date() });
  document.getElementById('studentName').value = '';
  document.getElementById('studentRoll').value = '';
  loadStudents();
}

async function loadStudents() {
  const snap = await db.collection('students').orderBy('roll').get();
  students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const list = document.getElementById('studentList');
  if (!list) return;
  list.innerHTML = students.map(s => `
    <div class="student-item">
      <div>
        <div class="name">${s.name}</div>
        <div class="roll">Roll: ${s.roll}</div>
      </div>
      <button class="del-btn" onclick="deleteStudent('${s.id}')">🗑️</button>
    </div>
  `).join('');
  updateAttendSubjects();
}

async function deleteStudent(id) {
  if (confirm('Delete this student?')) {
    await db.collection('students').doc(id).delete();
    loadStudents();
  }
}

// SUBJECTS
async function addSubject() {
  const name = document.getElementById('subjectName').value.trim();
  const code = document.getElementById('subjectCode').value.trim();
  if (!name || !code) return alert('Enter subject name and code!');
  await db.collection('subjects').add({ name, code });
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectCode').value = '';
  loadSubjects();
}

async function loadSubjects() {
  const snap = await db.collection('subjects').get();
  subjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const list = document.getElementById('subjectList');
  if (list) {
    list.innerHTML = subjects.map(s => `
      <div class="student-item">
        <div>
          <div class="name">${s.name}</div>
          <div class="roll">Code: ${s.code}</div>
        </div>
        <button class="del-btn" onclick="deleteSubject('${s.id}')">🗑️</button>
      </div>
    `).join('');
  }
  updateAttendSubjects();
  updateReportSubjects();
  loadTimetableForm();
}

async function deleteSubject(id) {
  if (confirm('Delete this subject?')) {
    await db.collection('subjects').doc(id).delete();
    loadSubjects();
  }
}

function updateAttendSubjects() {
  const sel = document.getElementById('attendSubject');
  if (sel) sel.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

function updateReportSubjects() {
  const sel = document.getElementById('reportSubject');
  if (sel) sel.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

// MARK ATTENDANCE
async function loadAttendance() {
  const subjectId = document.getElementById('attendSubject').value;
  const date = document.getElementById('attendDate').value;
  if (!date) return alert('Select a date!');
  if (students.length === 0) return alert('No students added yet!');

  const snap = await db.collection('attendance')
    .where('subjectId', '==', subjectId)
    .where('date', '==', date).get();

  attendanceData = {};
  snap.docs.forEach(d => { attendanceData[d.data().studentId] = d.data().status; });

  const form = document.getElementById('attendanceForm');
  form.innerHTML = students.map(s => `
    <div class="attend-item">
      <div>
        <div class="name">${s.name}</div>
        <div class="roll">Roll: ${s.roll}</div>
      </div>
      <div class="attend-btns">
        <button class="btn-p ${attendanceData[s.id]==='present'?'selected':''}" onclick="markAttend('${s.id}','present',this)">✅ Present</button>
        <button class="btn-a ${attendanceData[s.id]==='absent'?'selected':''}" onclick="markAttend('${s.id}','absent',this)">❌ Absent</button>
      </div>
    </div>
  `).join('');
  document.getElementById('saveAttendBtn').classList.remove('hidden');
}

function markAttend(studentId, status, btn) {
  attendanceData[studentId] = status;
  const parent = btn.parentElement;
  parent.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

async function saveAttendance() {
  const subjectId = document.getElementById('attendSubject').value;
  const date = document.getElementById('attendDate').value;
  const batch = db.batch();
  for (const studentId in attendanceData) {
    const ref = db.collection('attendance').doc(`${subjectId}_${date}_${studentId}`);
    batch.set(ref, { subjectId, date, studentId, status: attendanceData[studentId] });
  }
  await batch.commit();
  alert('Attendance saved successfully!');
}

// TIMETABLE
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

function loadTimetableForm() {
  const form = document.getElementById('timetableForm');
  if (!form) return;
  let html = '<div class="tt-row">';
  html += '<div class="tt-cell tt-header">Period</div>';
  days.forEach(d => html += `<div class="tt-cell tt-header">${d}</div>`);
  html += '</div>';
  periods.forEach((p, pi) => {
    html += '<div class="tt-row">';
    html += `<div class="tt-cell tt-header">${p}</div>`;
    days.forEach((d, di) => {
      html += `<div class="tt-cell"><select id="tt_${pi}_${di}">
        <option value="">-</option>
        ${subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
      </select></div>`;
    });
    html += '</div>';
  });
  form.innerHTML = html;
}

async function saveTimetable() {
  const timetable = {};
  periods.forEach((p, pi) => {
    days.forEach((d, di) => {
      const val = document.getElementById(`tt_${pi}_${di}`).value;
      if (val) timetable[`${pi}_${di}`] = val;
    });
  });
  await db.collection('timetable').doc('main').set({ timetable });
  alert('Timetable saved!');
  loadTimetable();
}

async function loadTimetable() {
  const doc = await db.collection('timetable').doc('main').get();
  if (!doc.exists) return;
  const timetable = doc.data().timetable;
  const view = document.getElementById('timetableView');
  if (!view) return;
  let html = '<h3 style="margin:20px 0 10px">Current Timetable</h3><div class="tt-row">';
  html += '<div class="tt-cell tt-header">Period</div>';
  days.forEach(d => html += `<div class="tt-cell tt-header">${d}</div>`);
  html += '</div>';
  periods.forEach((p, pi) => {
    html += '<div class="tt-row">';
    html += `<div class="tt-cell tt-header">${p}</div>`;
    days.forEach((d, di) => {
      const subId = timetable[`${pi}_${di}`] || '';
      const sub = subjects.find(s => s.id === subId);
      html += `<div class="tt-cell">${sub ? sub.name : '-'}</div>`;
    });
    html += '</div>';
  });
  view.innerHTML = html;
}

// REPORTS
async function loadReport() {
  const subjectId = document.getElementById('reportSubject').value;
  if (!subjectId) return;
  const snap = await db.collection('attendance').where('subjectId', '==', subjectId).get();
  const data = {};
  snap.docs.forEach(d => {
    const { studentId, status } = d.data();
    if (!data[studentId]) data[studentId] = { present: 0, total: 0 };
    data[studentId].total++;
    if (status === 'present') data[studentId].present++;
  });
  let html = '<table><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th><th>Total</th><th>%</th><th>Status</th></tr>';
  students.forEach(s => {
    const d = data[s.id] || { present: 0, total: 0 };
    const pct = d.total === 0 ? 0 : Math.round((d.present / d.total) * 100);
    const cls = pct >= 75 ? 'pct-good' : pct >= 60 ? 'pct-warn' : 'pct-bad';
    const status = pct >= 75 ? '✅ Safe' : '⚠️ Low';
    html += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${d.present}</td><td>${d.total - d.present}</td><td>${d.total}</td><td class="${cls}">${pct}%</td><td>${status}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('reportTable').innerHTML = html;
}

// STUDENT DASHBOARD
async function loadStudentDashboard(name) {
  const subSnap = await db.collection('subjects').get();
  const allSubjects = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  let html = '';
  for (const sub of allSubjects) {
    const snap = await db.collection('attendance').where('subjectId', '==', sub.id).get();
    let present = 0, total = 0;
    snap.docs.forEach(d => {
      total++;
      if (d.data().status === 'present') present++;
    });
    const pct = total === 0 ? 0 : Math.round((present / total) * 100);
    const color = pct >= 75 ? '#2ecc71' : pct >= 60 ? '#e67e22' : '#e74c3c';
    const needed = Math.ceil((0.75 * total - present) / 0.25);
    const skip = Math.floor((present - 0.75 * total) / 0.75);
    html += `<div class="sub-card">
      <h3>${sub.name} (${sub.code})</h3>
      <div class="sub-stats">
        <div class="sub-stat"><div class="num">${total}</div><div class="lbl">Total</div></div>
        <div class="sub-stat"><div class="num" style="color:#2ecc71">${present}</div><div class="lbl">Present</div></div>
        <div class="sub-stat"><div class="num" style="color:#e74c3c">${total-present}</div><div class="lbl">Absent</div></div>
        <div class="sub-stat"><div class="num" style="color:${color}">${pct}%</div><div class="lbl">Attendance</div></div>
      </div>
      <div class="pbar"><div class="pbar-fill" style="width:${pct}%;background:${color}"></div></div>
      ${pct >= 75 ? `<p style="color:#2ecc71;font-size:12px;font-weight:600">✅ You can skip ${skip} more classes</p>`
        : `<p style="color:#e74c3c;font-size:12px;font-weight:600">⚠️ Attend ${needed} more classes to reach 75%</p>`}
    </div>`;
  }
  document.getElementById('studentAttendance').innerHTML = html || '<p>No subjects added yet.</p>';

  // Load timetable for student
  const ttDoc = await db.collection('timetable').doc('main').get();
  if (ttDoc.exists) {
    const timetable = ttDoc.data().timetable;
    let ttHtml = '<h3 style="margin:20px 0 10px">📅 Your Timetable</h3><div class="tt-row">';
    ttHtml += '<div class="tt-cell tt-header">Period</div>';
    days.forEach(d => ttHtml += `<div class="tt-cell tt-header">${d}</div>`);
    ttHtml += '</div>';
    periods.forEach((p, pi) => {
      ttHtml += '<div class="tt-row">';
      ttHtml += `<div class="tt-cell tt-header">${p}</div>`;
      days.forEach((d, di) => {
        const subId = timetable[`${pi}_${di}`] || '';
        const sub = allSubjects.find(s => s.id === subId);
        ttHtml += `<div class="tt-cell">${sub ? sub.name : '-'}</div>`;
      });
      ttHtml += '</div>';
    });
    document.getElementById('studentTimetable').innerHTML = ttHtml;
  }
}