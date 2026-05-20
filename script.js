let attendanceData = JSON.parse(localStorage.getItem("attendance")) || [];

function displayAttendance() {
  const attendanceList = document.getElementById("attendanceList");
  attendanceList.innerHTML = "";

  attendanceData.forEach((student, index) => {
    const row = `
      <tr>
        <td>${student.name}</td>
        <td class="${student.status === 'Present' ? 'present' : 'absent'}">
          ${student.status}
        </td>
        <td>
          <button onclick="deleteAttendance(${index})">Delete</button>
        </td>
      </tr>
    `;

    attendanceList.innerHTML += row;
  });

  localStorage.setItem("attendance", JSON.stringify(attendanceData));
}

function addAttendance() {
  const name = document.getElementById("studentName").value;
  const status = document.getElementById("status").value;

  if (name === "") {
    alert("Please enter student name");
    return;
  }

  attendanceData.push({
    name: name,
    status: status
  });

  document.getElementById("studentName").value = "";

  displayAttendance();
}

function deleteAttendance(index) {
  attendanceData.splice(index, 1);
  displayAttendance();
}

displayAttendance();