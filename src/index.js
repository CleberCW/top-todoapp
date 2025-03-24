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

// Drag objects

const draggable = document.getElementById("draggable");
const draggableBox = document.querySelector("#draggable-box");
const baskets = document.querySelectorAll("td.std-cell");

let dragTimeout;
let isDragging = false;
let offsetX, offsetY;

//Aqui ao clicar no div, ele espera meio segundo antes de começar a mover. Offset serão usados para calcular a diferença entre a posçao inicial e a final
draggable.addEventListener("mousedown", (e) => {
  e.stopPropagation();
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
});

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

    const draggableBoxRect = draggableBox.getBoundingClientRect();

    baskets_list = [...baskets];
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
      isDragging = false;
    }
  }
  //Sempre lembrar de remover os listeners
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
}

draggable.addEventListener("mouseleave", () => {
  clearTimeout(dragTimeout);
  draggableBox.classList.remove("holding");
});

//Resize the draggable box

let isResizing = false;
let bottom;

draggableBox.addEventListener("mousedown", (e) => {
  startY = e.clientY;
  startHeight = draggableBox.offsetHeight;
  document.addEventListener("mousemove", resizeY);
  document.addEventListener("mouseup", stopResize);
});

function resizeY(e) {
  const dy = e.clientY - startY;
  //Aqui foi um truque, com a Math.round o valor de steps é ou 0 ou 1 (pra mais). Com isso, a mudança no height da div só ocorrerá quando steps for pelo menos um (40px nesse caso)
  const steps = Math.round(dy / 40);
  draggableBox.style.height = `${startHeight + steps * 40}px`;
}

function stopResize() {
  document.removeEventListener("mousemove", resizeY);
  document.removeEventListener("mouseup", stopResize);
}

// Relógio

const currentTime = new Date();

const timeLine = document.createElement("div");
timeLine.classList.add("time-line");
agendaBody.appendChild(timeLine);

const minutesCurrentTime =
  currentTime.getHours() * 60 + currentTime.getMinutes();
const startMinutes = 360;
const endMinutes = 1320;
