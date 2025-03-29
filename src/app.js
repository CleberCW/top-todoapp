export default function createProject(projectName) {
  let projectId = "project" + Math.floor(100000 + Math.random() * 900000);
  let name = projectName;
  let tasks = [];
  return {
    getProjectID() {
      return projectId;
    },
    getName() {
      return name;
    },
    setName(newName) {
      name = newName;
    },
    addTask(title, description, weekDay, startTime, endTime, priority) {
      const taskId = "task" + Math.floor(100000 + Math.random() * 900000);
      const newTask = {
        projectId: projectId,
        taskId: taskId,
        title: title,
        description: description,
        weekDay: weekDay,
        startTime: startTime,
        endTime: endTime,
        priority: priority,
      };
      Object.defineProperty(newTask, "taskId", {
        writable: false,
        configurable: false,
        enumerable: true,
      });
      tasks.push(newTask);
      return taskId;
    },
    changeTask(taskId, taskKey, newValue) {
      let taskFound = false;
      let keyFound = false;

      for (let task of tasks) {
        if (task.taskId == taskId) {
          taskFound = true;
          for (let key of Object.keys(task)) {
            if (key == taskKey) {
              task[key] = newValue;
              keyFound = true;
              break;
            }
          }
        }
      }

      if (!taskFound) {
        console.log("Não há task com esse nome");
      } else if (!keyFound) {
        console.log("Não há uma key com esse nome");
      }
    },
    retrieveTasks() {
      return tasks;
    },
    retrieveSingleTask(id) {
      let taskToRetrieve = null;
      for (let task of tasks) {
        if (task.taskId == id) {
          taskToRetrieve = task;
        }
      }
      return taskToRetrieve;
    },
  };
}
