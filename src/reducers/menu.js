const defState = {
  hide: true,
  top: 80,
  left: 360,
  opts: "desk",
  attr: null,
  dataset: null,
  data: {
    desk: {
      width: "310px",
      secwid: "200px",
    },
    task: {
      width: "220px",
      secwid: "120px",
      ispace: false, // show the space for icons in menu
    },
    app: {
      width: "310px",
      secwid: "200px",
    },
  },
  menus: {
    desk: [
      {
        name: "Вид",
        icon: "view",
        type: "svg",
        opts: [
          {
            name: "Крупные значки",
            action: "changeIconSize",
            payload: "large",
          },
          {
            name: "Обычные значки",
            action: "changeIconSize",
            payload: "medium",
          },
          {
            name: "Мелкие значки",
            action: "changeIconSize",
            payload: "small",
            dot: true,
          },
          {
            type: "hr",
          },
          {
            name: "Отображать значки рабочего стола",
            action: "deskHide",
            check: true,
          },
        ],
      },
      {
        name: "Сортировка",
        icon: "sort",
        type: "svg",
        opts: [
          {
            name: "Имя",
            action: "changeSort",
            payload: "name",
          },
          {
            name: "Размер",
            action: "changeSort",
            payload: "size",
          },
          {
            name: "Дата изменения",
            action: "changeSort",
            payload: "date",
          },
        ],
      },
      {
        name: "Обновить",
        action: "refresh",
        type: "svg",
        icon: "refresh",
      },
      {
        type: "hr",
      },
      {
        name: "Создать",
        icon: "New",
        type: "svg",
        opts: [
          {
            name: "Папку",
          },
          {
            name: "Ярлык",
          },
          {
            name: "Текстовый документ",
          },
          {
            name: "Сжатую ZIP-папку",
          },
        ],
      },
      {
        type: "hr",
      },
      {
        name: "Параметры экрана",
        icon: "display",
        type: "svg",
        action: "SETTINGS",
        payload: "full",
      },
      {
        name: "Персонализация",
        icon: "personalize",
        type: "svg",
        action: "SETTINGS",
        payload: "full",
      },
      {
        type: "hr",
      },
      {
        name: "Следующее фоновое изображение рабочего стола",
        action: "WALLNEXT",
      },
      {
        name: "Открыть в Терминале",
        icon: "terminal",
        action: "OPENTERM",
        payload: "C:\\Users\\Blue\\Desktop",
      },
    ],
    task: [
      {
        name: "Выравнивание значков",
        opts: [
          {
            name: "По левому краю",
            action: "changeTaskAlign",
            payload: "left",
          },
          {
            name: "По центру",
            action: "changeTaskAlign",
            payload: "center",
            dot: true,
          },
        ],
      },
      {
        type: "hr",
      },
      {
        name: "Поиск",
        opts: [
          {
            name: "Показать",
            action: "TASKSRCH",
            payload: true,
          },
          {
            name: "Скрыть",
            action: "TASKSRCH",
            payload: false,
          },
        ],
      },
      {
        name: "Виджеты",
        opts: [
          {
            name: "Показать",
            action: "TASKWIDG",
            payload: true,
          },
          {
            name: "Скрыть",
            action: "TASKWIDG",
            payload: false,
          },
        ],
      },
      {
        type: "hr",
      },
      {
        name: "Свернуть все окна",
        action: "SHOWDSK",
      },
    ],
    app: [
      {
        name: "Открыть",
        action: "performApp",
        payload: "open",
      },
      {
        name: "Запуск от имени администратора",
        action: "performApp",
        payload: "open",
        icon: "win/shield",
      },
      {
        name: "Расположение файла",
        dsb: true,
      },
      {
        name: "Открепить от начального экрана",
        dsb: true,
      },
      {
        name: "Сжать в ZIP-файл",
        dsb: true,
      },
      {
        name: "Копировать как путь",
        dsb: true,
      },
      {
        name: "Свойства",
        dsb: true,
      },
      {
        type: "hr",
      },
      {
        name: "Удалить ярлык",
        action: "performApp",
        payload: "delshort",
      },
      {
        name: "Удалить",
        action: "delApp",
        payload: "delete",
      },
    ],
  },
};

const menusReducer = (state = defState, action) => {
  var tmpState = {
    ...state,
  };
  if (action.type == "MENUHIDE") {
    tmpState.hide = true;
  } else if (action.type == "MENUSHOW") {
    tmpState.hide = false;
    tmpState.top = (action.payload && action.payload.top) || 272;
    tmpState.left = (action.payload && action.payload.left) || 430;
    tmpState.opts = (action.payload && action.payload.menu) || "desk";
    tmpState.attr = action.payload && action.payload.attr;
    tmpState.dataset = action.payload && action.payload.dataset;
  } else if (action.type == "MENUCHNG") {
    tmpState = {
      ...action.payload,
    };
  }

  return tmpState;
};

export default menusReducer;
