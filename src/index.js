/* Estou em meio a fnção para cirr um draggable div que seja da altura referente ao tempo da task em relação ao cronograma
-
-
-
-
-
-
-
-
-
-
-
-

*/

import createProject from "./app.js";

//Cronograma (tabela de horários)
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
    tr.appendChild(td);
  }

  agendaBody.appendChild(tr);
});

//Função que pega as células embaixo do draggable box
function getCellsBelowDiv(div) {
  let draggableBoxRect = div.getBoundingClientRect();

  const left = draggableBoxRect.left;
  const top = draggableBoxRect.top;
  const bottom = draggableBoxRect.bottom;

  // Get the element under the center of the draggable
  div.style.pointerEvents = "none";
  const elementBelowStart = document.elementFromPoint(left, top);
  const elementBelowEnd = document.elementFromPoint(left, bottom - 1);
  div.style.pointerEvents = "auto";
  return [elementBelowStart, elementBelowEnd];
}

// ---------  Drag objects

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
        getCellsBelowDiv(draggableBox);
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
      draggableBox.style.height = `${startHeight + steps * 40}px`;
    }

    function stopResize() {
      const [firstCell, lastCell] = getCellsBelowDiv(draggableBox);
      const [firstCellWeekDay, firstCellHour] =
        getHourandWeekdayFromCell(firstCell);
      const [lastCellWeekDay, lastCellHour] =
        getHourandWeekdayFromCell(lastCell);
      const boxProject = draggableBox.dataset.project;
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

//  --------- Relógio

const currentTime = new Date();

const timeLine = document.createElement("div");
timeLine.classList.add("time-line");
agendaBody.appendChild(timeLine);

const minutesCurrentTime =
  currentTime.getHours() * 60 + currentTime.getMinutes();
const startMinutes = 360;

const tableBody = document.querySelector("tbody");
const tableBodyRect = tableBody.getBoundingClientRect();
const calculation = (40 / 30) * (minutesCurrentTime - startMinutes);
timeLine.style.top = `${calculation}px`;

// --------- Box com os projetos

const projectsBox = document.querySelector("#projects-box");
let projectsList = [createProject("amanhã")];
let currentTargetDiv = null;

function addTaskClickListener() {
  const buttons = document.querySelectorAll(".add-task-button");

  buttons.forEach((button) => {
    button.addEventListener("click", function () {
      const taskFormContainer = document.querySelector("#task-form");
      taskFormContainer.classList.toggle("hidden");
      currentTargetDiv = button.closest(".project-box");
    });
  });
}

function displayProjects() {
  projectsBox.textContent = "";
  projectsList.forEach((project) => {
    const projectDiv = document.createElement("div");
    projectDiv.classList.add("project-box");
    projectDiv.dataset.id = project.getProjectID();
    const projectTitle = document.createElement("h2");
    projectTitle.innerText = `${project.getName()}`;
    projectDiv.appendChild(projectTitle);

    const projectTasks = project.retrieveTasks();
    projectTasks.forEach((task) => {
      const taskBox = document.createElement("div");
      taskBox.classList.add("project-box");
      taskBox.dataset.id = task.taskId;
      for (const property in task) {
        const propertyText = document.createElement("p");
        propertyText.textContent = `${property}: ${task[property]}`;
        taskBox.appendChild(propertyText);
      }

      projectDiv.appendChild(taskBox);
    });
    const addTaskButton = document.createElement("button");
    addTaskButton.classList.add("add-task-button");
    addTaskButton.innerText = `Add task`;
    projectDiv.appendChild(addTaskButton);

    projectsBox.appendChild(projectDiv);
  });
  if (projectsList.length > 0) {
    addTaskClickListener();
  }
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
  projectsList.push();
  displayProjects();
  projectForm.parentNode.classList.toggle("hidden");
});

// --------- Add task

const taskForm = document.querySelector("#task-form>form");
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newTaskTitle = taskForm.querySelector("#title").value;
  const newTaskDescription = taskForm.querySelector("#description").value;
  const newTaskStartTime = taskForm.querySelector("#startTime").value;
  const newTaskEndTime = taskForm.querySelector("#endTime").value;
  const newTaskPriority = taskForm.querySelector("#priority").value;
  let selectedProject = null;
  let newTaskId = null;
  for (let project of projectsList) {
    if (currentTargetDiv.dataset.id == project.getProjectID()) {
      selectedProject = project;
      newTaskId = project.addTask(
        newTaskTitle,
        newTaskDescription,
        newTaskStartTime,
        newTaskEndTime,
        newTaskPriority
      );
    }
    displayProjects();
    taskForm.parentNode.classList.toggle("hidden");
  }

  const documentBody = document.querySelector("body");
  const taskDiv = document.createElement("div");
  taskDiv.classList.add("draggable-box");
  taskDiv.dataset.id = newTaskId;
  const insideTaskDiv = document.createElement("div");
  insideTaskDiv.classList.add("draggable");
  const selectedTask = selectedProject.retrieveSingleTask(newTaskId);
  taskDiv.style.height = `${selectedTask.endTime - selectedTask.startTime}px`;

  taskDiv.appendChild(insideTaskDiv);
  documentBody.appendChild(taskDiv);
});

function getHourandWeekdayFromCell(e) {
  if (e.target.matches(".std-cell")) {
    const cell = e.target;
    const table = cell.closest("table");
    const weekDay =
      table.querySelector("thead tr").children[cell.cellIndex].textContent;
    const hour = cell.parentNode.firstElementChild.textContent;
    return [weekDay, hour];
  }
}
