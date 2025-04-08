import createProject from "./app.js";
import "./styles.css";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// Initializers

let projectsList = [];

//Local Storage

// Cronograma
const agendaBody = document.getElementById("agenda-body");

function gerarHorario(inicio, fim) {
  //Aqui é criado um array de horas, strings de meia em meia hora (06:00, 06:30, 07:00...) para popular as linhas do cronograma
  const linhas = [];
  let hora = inicio;
  let minuto = 0;

  while (hora < fim || (hora === fim && minuto === 0)) {
    const horaStr = `${hora.toString().padStart(2, "0")}:${minuto
      .toString()
      .padStart(2, "0")}`;
    linhas.push(horaStr);

    minuto += 30;
    if (minuto >= 60) {
      minuto = 0;
      hora++;
    }
  }
  return linhas;
}

const horarios = gerarHorario(6, 22);

// ------------------   Popular tabela
horarios.forEach((horario) => {
  // Criação da tabela com o array gerado pela função
  const tr = document.createElement("tr");

  const tdHora = document.createElement("td");
  tdHora.textContent = horario;
  tdHora.classList.add("time-cell");
  tr.appendChild(tdHora);

  for (let i = 0; i < 7; i++) {
    const td = document.createElement("td");
    td.classList.add("std-cell");
    td.dataset.horario = `${horario}`;
    td.dataset.dia = `${i + 1}`;
    tr.appendChild(td);
  }

  agendaBody.appendChild(tr);
});

//Função que pega as células embaixo do draggable box
function getCellsBelowDiv(div) {
  let draggableBoxRect = div.getBoundingClientRect();

  const left = draggableBoxRect.left + draggableBoxRect.width / 2;
  const top = draggableBoxRect.top;
  const bottom = draggableBoxRect.bottom;

  // Get the element under the center of the draggable
  div.style.pointerEvents = "none";
  const elementBelowStart = document.elementFromPoint(left, top);
  const elementBelowEnd = document.elementFromPoint(left, bottom);
  div.style.pointerEvents = "auto";
  return [elementBelowStart, elementBelowEnd];
}

// ---------  Drag divs

const baskets = document.querySelectorAll("td.std-cell");

let dragTimeout;
let isDragging = false;
let offsetX, offsetY;

//Aqui ao clicar no div, ele espera meio segundo antes de começar a mover. Offset serão usados para calcular a diferença entre a posçao inicial e a final
document.body.addEventListener("mousedown", (e) => {
  if (e.target.matches(".draggable")) {
    e.stopPropagation();
    const draggableBox = e.target.parentNode;
    draggableBox.classList.add("holding");
    dragTimeout = setTimeout(() => {
      isDragging = true;
      draggableBox.classList.remove("holding");
      draggableBox.classList.add("dragging");
      // Essa me custou. Tem que somar o window.scroll para pegar o valor real da posição da div no documento
      offsetX = e.clientX - draggableBox.offsetLeft + window.scrollX;
      offsetY = e.clientY - draggableBox.offsetTop + window.scrollY;
    }, 500);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", stopDrag);

    function drag(e) {
      if (isDragging) {
        // Mesma coisa, adicionar o window.scroll para er o valor real em relação ao documento
        draggableBox.style.left = e.clientX + window.scrollX - offsetX + "px";
        draggableBox.style.top = e.clientY + window.scrollY - offsetY + "px";
      }
    }

    function stopDrag() {
      //Resetar o timer
      clearTimeout(dragTimeout);
      draggableBox.classList.remove("holding");

      if (isDragging) {
        draggableBox.classList.remove("dragging");

        let draggableBoxRect = draggableBox.getBoundingClientRect();

        const baskets_list = [...baskets];
        for (const [index, element] of baskets_list.entries()) {
          const basketRect = element.getBoundingClientRect();
          // Na diferença não é necessário o window.scroll (pois é a diferença duhh)
          const dx = Math.abs(basketRect.left - draggableBoxRect.left);
          const dy = Math.abs(basketRect.top - draggableBoxRect.top);

          if (dx < basketRect.width / 2 && dy < basketRect.height / 2) {
            // Aqui é para posicionar o div na célula que estiver abaixo, cenralizando-o. Também necessário o window.scroll para pegar o valor real da célula
            draggableBox.style.left = basketRect.left + window.scrollX + "px";
            draggableBox.style.top = basketRect.top + window.scrollY + "px";
            isDragging = false;
            //Aqui é importante o break, pois a função está calculando para cada célula da tabela, e qual atender à condição é a célula correta, portanto o loop deve parar
            break;
          }
        }
        const [startCell, endCell] = getCellsBelowDiv(draggableBox);
        for (let project of projectsList) {
          if (project.getProjectID() == draggableBox.dataset.projectId) {
            project.changeTask(
              draggableBox.dataset.taskId,
              "startTime",
              startCell.dataset.horario
            );
            project.changeTask(
              draggableBox.dataset.taskId,
              "endTime",
              endCell.dataset.horario
            );
            project.changeTask(
              draggableBox.dataset.taskId,
              "weekDay",
              startCell.dataset.dia
            );
            displayProjects();
          }
        }
        isDragging = false;
      }
      //Sempre lembrar de remover os listeners
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }
  } else if (e.target.matches(".draggable-box")) {
    let startY, startHeight;
    const draggableBox = e.target;
    startY = e.clientY;
    startHeight = draggableBox.offsetHeight;
    document.addEventListener("mousemove", resizeY);
    document.addEventListener("mouseup", stopResize);

    //Resize the draggable box

    function resizeY(e) {
      const dy = e.clientY - startY;
      //Aqui foi um truque, com a Math.round o valor de steps é ou 0 ou 1 (pra mais). Com isso, a mudança no height da div só ocorrerá quando steps for pelo menos um (40px nesse caso)
      const steps = Math.round(dy / 40);
      const heightStep = startHeight + steps * 40;
      draggableBox.style.height = `${heightStep > 40 ? heightStep : 40}px`;
    }

    function stopResize() {
      const [firstCell, lastCell] = getCellsBelowDiv(draggableBox);
      for (let project of projectsList) {
        if (project.getProjectID() == draggableBox.dataset.projectId) {
          project.changeTask(
            draggableBox.dataset.taskId,
            "endTime",
            lastCell.dataset.horario
          );
          displayProjects();
        }
      }
      document.removeEventListener("mousemove", resizeY);
      document.removeEventListener("mouseup", stopResize);
    }
  }
});

document.body.addEventListener("mouseleave", (e) => {
  if (e.target.matches(".draggable")) {
    const draggableBox = e.target.parentNode;
    clearTimeout(dragTimeout);
    draggableBox.classList.remove("holding");
  }
});

//  --------- Clock line

function createClockLine() {
  const timeLine = document.createElement("div");
  timeLine.classList.add("time-line");
  agendaBody.appendChild(timeLine);
}

function updateClockLine() {
  const currentTime = new Date();
  const clockLine = document.querySelector(".time-line");

  const minutesCurrentTime =
    currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = 360;
  const endMinutes = 1320;

  let timeForCalculation;

  if (minutesCurrentTime < startMinutes) {
    timeForCalculation = startMinutes;
  } else if (minutesCurrentTime > endMinutes) {
    timeForCalculation = endMinutes;
  } else {
    timeForCalculation = minutesCurrentTime - startMinutes;
  }

  const calculation = (40 / 30) * timeForCalculation;
  clockLine.style.top = `${calculation}px`;
}
createClockLine();
updateClockLine();
setInterval(updateClockLine, 60 * 1000);

// --------- Box com os projetos

function displayProjects() {
  const projectsBox = document.querySelector(".projects-box");
  projectsBox.textContent = "";
  projectsList.forEach((project) => {
    localStorage.setItem(`${project.getProjectID()}`, JSON.stringify(project));
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project-box");
    projectDiv.dataset.id = project.getProjectID();
    const projectTitle = document.createElement("h2");
    projectTitle.innerText = `${project.getName()}`;
    projectDiv.appendChild(projectTitle);

    const projectTasks = project.retrieveTasks();
    projectTasks.forEach((task) => {
      const taskBox = document.createElement("div");
      taskBox.classList.add("task-box");
      taskBox.dataset.id = task.taskId;
      const taskTitle = document.createElement("div");
      taskTitle.textContent = task.title;
      taskBox.appendChild(taskTitle);
      const taskTime = document.createElement("div");
      const weekDays = [
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
        "Domingo",
      ];
      taskTime.textContent = `${weekDays[task.weekDay - 1]}  ${
        task.startTime
      } - ${task.endTime}`;
      taskBox.appendChild(taskTime);
      const deleteTaskButton = document.createElement("button");
      deleteTaskButton.classList.add("delete-task-button");
      deleteTaskButton.textContent = "X";
      taskBox.appendChild(deleteTaskButton);

      projectDiv.appendChild(taskBox);
    });
    const addTaskButton = document.createElement("button");
    addTaskButton.classList.add("add-task-button");
    addTaskButton.innerText = `Adicionar tarefa`;
    projectDiv.appendChild(addTaskButton);
    projectsBox.appendChild(projectDiv);
  });
  addTaskClickListener();
}
displayProjects();

// -------- Add project

const addProjectButton = document.querySelector("#add-project");
addProjectButton.addEventListener("click", () => {
  const projectForm = document.querySelector("#project-form");
  projectForm.classList.toggle("hidden");
});

const projectForm = document.querySelector("#project-form>form");
projectForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newProject = createProject(
    projectForm.querySelector("#project-title").value
  );
  projectsList.push(newProject);
  displayProjects();
  projectForm.parentNode.classList.toggle("hidden");
});

flatpickr("#startTime", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  time_24hr: true,
  minuteIncrement: 30,
});

flatpickr("#endTime", {
  enableTime: true,
  noCalendar: true,
  dateFormat: "H:i",
  time_24hr: true,
  minuteIncrement: 30,
});

// --------- Add task

let currentTargetDiv = null;

function addTaskClickListener() {
  const buttons = document.querySelectorAll(".add-task-button");

  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const taskFormContainer = document.querySelector("#task-form");
      taskFormContainer.classList.remove("hidden");
      currentTargetDiv = button.closest(".project-box");
    });
  });
}

const taskForm = document.querySelector("#task-form>form");
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const [projectId, taskId] = createTaskFromForm(currentTargetDiv);
  createTaskDraggable(taskId);
  displayProjects();
});

function createTaskFromForm(div) {
  const newTaskTitle = taskForm.querySelector("#title").value;
  const newTaskDescription = taskForm.querySelector("#description").value;
  const newTaskWeekday = taskForm.querySelector("#weekDay").value;
  const newTaskStartTime = taskForm.querySelector("#startTime").value;
  const newTaskEndTime = taskForm.querySelector("#endTime").value;
  const newTaskPriority = taskForm.querySelector("#priority").value;
  let projectId = null;
  let taskId = null;
  for (let project of projectsList) {
    if (div.dataset.id == project.getProjectID()) {
      projectId = project.getProjectID();
      taskId = project.addTask(
        newTaskTitle,
        newTaskDescription,
        newTaskWeekday,
        newTaskStartTime,
        newTaskEndTime,
        newTaskPriority
      );
    }
  }
  taskForm.parentNode.classList.add("hidden");
  return [projectId, taskId];
}

function createTaskDraggable(taskId) {
  let selectedProject = null;
  for (let project of projectsList) {
    if (project.retrieveSingleTask(taskId)) {
      selectedProject = project;
    }
  }
  const documentBody = document.querySelector(".main");
  const taskDiv = document.createElement("div");
  taskDiv.classList.add("draggable-box");
  taskDiv.dataset.taskId = taskId;
  taskDiv.dataset.projectId = selectedProject.getProjectID();
  const insideTaskDiv = document.createElement("div");
  insideTaskDiv.classList.add("draggable");
  insideTaskDiv.textContent = selectedProject.retrieveSingleTask(taskId).title;
  let randomValues = [];
  for (let i = 0; i < 3; i++) {
    randomValues.push(Math.floor(Math.random() * (196 - 128 + 1) + 128));
  }
  insideTaskDiv.style.backgroundColor = `rgb(${randomValues[0]}, ${randomValues[1]}, ${randomValues[2]}`;
  const selectedTask = selectedProject.retrieveSingleTask(taskId);
  let [startHours, startMinutes] = selectedTask.startTime.split(":");
  let [endHours, endMinutes] = selectedTask.endTime.split(":");
  const spentTime =
    (endHours - startHours) * 60 + Number(endMinutes) - Number(startMinutes);
  taskDiv.style.height = `${40 * (spentTime / 60)}px`;
  const cells = document.querySelectorAll(".std-cell");
  let designedCell = null;
  for (let cell of cells) {
    if (
      cell.dataset.horario == selectedTask.startTime &&
      cell.dataset.dia == selectedTask.weekDay
    ) {
      designedCell = cell;
    }
  }
  const designedCellRect = designedCell.getBoundingClientRect();
  taskDiv.style.top = `${designedCellRect.top + window.scrollY}px`;
  taskDiv.style.left = `${designedCellRect.left + window.scrollX}px`;
  taskDiv.style.width = `${designedCellRect.width}px`;
  let darkerRandomValues = randomValues.map((value) => value - 20);
  taskDiv.style.backgroundColor = `rgb(${darkerRandomValues[0]}, ${darkerRandomValues[1]}, ${darkerRandomValues[2]}`;
  taskDiv.appendChild(insideTaskDiv);
  documentBody.appendChild(taskDiv);
}

// WIndow resize correction

// window.addEventListener("resize", () => {
//   const boxes = document.querySelectorAll(".draggable-box");

//   boxes.forEach((box) => {
//     const [firstCell, lastCell] = getCellsBelowDiv(box);
//     box.style.width = `${firstCell.getBoundingClientRect().width}px`;
//     box.style.left = `${firstCell.getBoundingClientRect().left}px`;
//   });
// });

// Delete task

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-task-button")) {
    const task = e.target.parentNode;
    const taskId = task.dataset.id;
    const project = task.parentNode;
    const projectId = project.dataset.id;

    for (let project of projectsList) {
      if (project.getProjectID() == projectId) {
        project.removeTask(taskId);
        displayProjects();
      }
    }

    const draggableToRemove = document.querySelector(
      `[data-task-id="${taskId}"]`
    );
    draggableToRemove.remove();
  }
});

// close form

const closeFormButton = document.querySelectorAll(".close-form");

closeFormButton.forEach((button) => {
  button.addEventListener("click", (e) => {
    const container = e.target.closest(".form-container");
    container.classList.add("hidden");
  });
});
