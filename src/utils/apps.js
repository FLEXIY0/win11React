export const gene_name = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

let installed = JSON.parse(localStorage.getItem("installed") || "[]");

const apps = [
  {
    name: "Пуск",
    icon: "home",
    type: "action",
    action: "STARTMENU",
  },
  {
    name: "Поиск",
    icon: "search",
    type: "action",
    action: "SEARCHMENU",
  },
  {
    name: "Виджеты",
    icon: "widget",
    type: "action",
    action: "WIDGETS",
  },
  {
    name: "Параметры",
    icon: "settings",
    type: "app",
    action: "SETTINGS",
  },
  {
    name: "Диспетчер задач",
    icon: "taskmanager",
    type: "app",
    action: "TASKMANAGER",
  },
  {
    name: "Проводник",
    icon: "explorer",
    type: "app",
    action: "EXPLORER",
  },
  {
    name: "Браузер",
    icon: "edge",
    type: "app",
    action: "MSEDGE",
  },
  {
    name: "Калькулятор",
    icon: "calculator",
    type: "app",
    action: "CALCUAPP",
  },
  {
    name: "Блокнот",
    icon: "notepad",
    type: "app",
    action: "NOTEPAD",
  },
  {
    name: "Терминал",
    icon: "terminal",
    type: "app",
    action: "TERMINAL",
  },
];

for (let i = 0; i < installed.length; i++) {
  installed[i].action = gene_name();
  apps.push(installed[i]);
}

export default apps;
