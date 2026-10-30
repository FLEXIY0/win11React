import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AFFECTED,
  ERROR_PATH,
  IDENTITY,
  MEMORY_BLOCKS,
  NOTEPAD_FILE,
  NOTEPAD_TEXT,
  PRODUCT,
  RESTORED_FILES,
  RESTORE_POINTS,
  USER,
} from "./data";
import { PuzzlePicture } from "./picture";
import "./recovery.scss";

const randomDelay = (min, max) => min + Math.random() * (max - min);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Значки: цветные Fluent-значки Microsoft (img/icon/fluent, MIT)
// и значки Windows 11 из img/icon
const ICONS = {
  error: "img/icon/fluent/dismiss_circle_48_color.svg",
  question: "img/icon/fluent/question_circle_48_color.svg",
  shield: "img/icon/fluent/shield_checkmark_48_color.svg",
  restore: "img/icon/fluent/history_48_color.svg",
  monitor: "img/icon/fluent/laptop_48_color.svg",
  key: "img/icon/fluent/lock_shield_48_color.svg",
  info: "img/icon/win/info.png",
  notepad: "img/icon/notepad.png",
};

const MsgIcon = ({ type, size = 32 }) => (
  <img
    src={ICONS[type]}
    width={size}
    height={size}
    alt=""
    draggable={false}
    style={{ objectFit: "contain", flexShrink: 0 }}
  />
);

const RestoreIcon = ({ size = 16 }) => <MsgIcon type="restore" size={size} />;

const NotepadIcon = ({ size = 16 }) => <MsgIcon type="notepad" size={size} />;

// Окно Windows 11 со светлой рамкой; перетаскивается за заголовок
const Win = ({
  title,
  icon,
  width,
  onClose,
  className = "",
  bodyClass = "",
  children,
  z = 0,
}) => {
  const [pos, setPos] = useState([0, 0]);
  const drag = useRef(null);

  const down = (e) => {
    if (e.target.closest(".rcClose")) return;
    drag.current = [e.clientX - pos[0], e.clientY - pos[1]];
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    setPos([e.clientX - drag.current[0], e.clientY - drag.current[1]]);
  };
  const up = () => (drag.current = null);

  return (
    <div className="rcLayer" style={{ zIndex: 1000 + z }}>
      <div
        className={"rcWin " + className}
        style={{
          width,
          transform: `translate(${pos[0]}px, ${pos[1]}px)`,
        }}
      >
        <div
          className="rcTitle"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
        >
          {icon}
          <span className="rcTitleText">{title}</span>
          <div className="rcClose" onClick={onClose}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M0.5 0.5l9 9M9.5 0.5l-9 9" stroke="currentColor" />
            </svg>
          </div>
        </div>
        <div className={"rcBody " + bodyClass}>{children}</div>
      </div>
    </div>
  );
};

const Btn = ({ def, disabled, onClick, children }) => (
  <button
    className="rcBtn"
    data-default={!!def}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

// Классическое окно сообщения
const MsgBox = ({ title, icon, buttons, onClose, z = 10, children }) => (
  <Win title={title} width={420} onClose={onClose} z={z}>
    <div className="rcMsg">
      <MsgIcon type={icon} />
      <div className="rcMsgText">{children}</div>
    </div>
    <div className="rcFoot">
      {buttons.map((b, i) => (
        <Btn key={b.label} def={i == 0} onClick={b.onClick}>
          {b.label}
        </Btn>
      ))}
    </div>
  </Win>
);

// Окно ошибки на рабочем столе
const CorruptionError = ({ onRestore, onClose }) => (
  <MsgBox
    title="Расположение недоступно"
    icon="error"
    onClose={onClose}
    z={0}
    buttons={[
      { label: "Восстановление системы", onClick: onRestore },
      { label: "Закрыть", onClick: onClose },
    ]}
  >
    <p>Нет доступа к {ERROR_PATH}.</p>
    <p>Файл или папка повреждены. Чтение невозможно. (0x80070570)</p>
    <p>
      Повреждены данные профиля {USER}. Чтобы устранить неполадку, запустите
      восстановление системы.
    </p>
  </MsgBox>
);

// Мастер «Восстановление системы» (rstrui.exe)
const Wizard = ({ onCancel, onStart }) => {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [dialog, setDialog] = useState(null);

  const points = showAll
    ? RESTORE_POINTS
    : RESTORE_POINTS.filter((p) => p.type != "Система");
  const point = selected != null ? RESTORE_POINTS[selected] : null;
  const special = RESTORE_POINTS.find((p) => p.ok);

  const next = () => {
    if (page == 1 && !point.ok) return setDialog("badPoint");
    setPage(page + 1);
  };

  const side = (
    <div className="rcWizSide">
      <RestoreIcon size={72} />
    </div>
  );

  let content = null;
  if (page == 0) {
    content = (
      <div className="rcWizSplit">
        {side}
        <div className="rcWizMain">
          <div className="rcWizHead">
            Восстановление системных файлов и параметров
          </div>
          <p>
            Восстановление системы может устранить многие неполадки, которые
            замедляют работу компьютера или препятствуют его нормальной работе.
          </p>
          <p>
            Восстановление системы не затрагивает документы, изображения и
            другие личные данные. Недавно установленные программы и драйверы
            могут быть удалены.
          </p>
        </div>
      </div>
    );
  } else if (page == 1) {
    content = (
      <div className="rcWizMain">
        <div className="rcWizHead">
          Восстановление компьютера до предшествующего состояния
        </div>
        <p>Текущий часовой пояс: GMT+3:00</p>
        <div className="rcTable">
          <div className="rcRow rcRowHead">
            <span>Дата и время</span>
            <span>Описание</span>
            <span>Тип</span>
          </div>
          <div className="rcTableBody">
            {points.map((p) => {
              const i = RESTORE_POINTS.indexOf(p);
              return (
                <div
                  key={p.date}
                  className="rcRow"
                  data-selected={selected == i}
                  onClick={() => setSelected(i)}
                >
                  <span>{p.date}</span>
                  <span>{p.desc}</span>
                  <span>{p.type}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rcWizRow">
          <label className="rcCheck">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => {
                setShowAll(e.target.checked);
                setSelected(null);
              }}
            />
            Показать другие точки восстановления
          </label>
          <Btn disabled={!point} onClick={() => setDialog("affected")}>
            Поиск затрагиваемых программ
          </Btn>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="rcWizSplit">
        {side}
        <div className="rcWizMain">
          <div className="rcWizHead">Подтверждение точки восстановления</div>
          <p>
            Компьютер будет восстановлен до состояния, предшествовавшего событию
            в поле «Описание».
          </p>
          <div className="rcProps">
            <span>Время:</span>
            <span>{special.date} (GMT+3:00)</span>
            <span>Описание:</span>
            <span>
              {special.type}: {special.desc}
            </span>
            <span>Диски:</span>
            <span>Локальный диск (C:) (Система)</span>
          </div>
          <p>
            <span className="rcLink" onClick={() => setDialog("affected")}>
              Проверить затрагиваемые программы
            </span>
          </p>
          <p>
            Для вступления изменений в силу восстановление системы перезагрузит
            компьютер. Нажмите кнопку «Готово», чтобы продолжить.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Win
        title="Восстановление системы"
        icon={<RestoreIcon />}
        width={620}
        onClose={onCancel}
        bodyClass="rcWiz"
      >
        <div className="rcWizContent">{content}</div>
        <div className="rcFoot">
          <Btn disabled={page == 0} onClick={() => setPage(page - 1)}>
            &lt; Назад
          </Btn>
          {page < 2 ? (
            <Btn def disabled={page == 1 && !point} onClick={next}>
              Далее &gt;
            </Btn>
          ) : (
            <Btn def onClick={() => setDialog("confirm")}>
              Готово
            </Btn>
          )}
          <Btn onClick={onCancel}>Отмена</Btn>
        </div>
      </Win>
      {dialog == "badPoint" ? (
        <MsgBox
          title="Восстановление системы"
          icon="error"
          onClose={() => setDialog(null)}
          buttons={[{ label: "ОК", onClick: () => setDialog(null) }]}
        >
          <p>Не удалось использовать выбранную точку восстановления.</p>
          <p>
            Точка восстановления повреждена. (0x80070570) Выберите другую точку
            восстановления.
          </p>
        </MsgBox>
      ) : null}
      {dialog == "affected" ? (
        <Affected point={point || special} onClose={() => setDialog(null)} />
      ) : null}
      {dialog == "confirm" ? (
        <MsgBox
          title="Восстановление системы"
          icon="question"
          onClose={() => setDialog(null)}
          buttons={[
            { label: "Да", onClick: onStart },
            { label: "Нет", onClick: () => setDialog(null) },
          ]}
        >
          <p>
            После запуска восстановление системы нельзя прервать. Продолжить?
          </p>
        </MsgBox>
      ) : null}
    </>
  );
};

const Affected = ({ point, onClose }) => {
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setScanned(true), randomDelay(1800, 2800));
    return () => clearTimeout(timer);
  }, []);

  const list = (rows) => (
    <div className="rcTable rcTableSmall">
      <div className="rcRow rcRowHead rcRow2">
        <span>Описание</span>
        <span>Тип</span>
      </div>
      {rows.map(([name, type]) => (
        <div key={name} className="rcRow rcRow2">
          <span>{name}</span>
          <span>{type}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Win title="Восстановление системы" width={480} onClose={onClose} z={10}>
      <div className="rcPad">
        {!scanned ? (
          <>
            <p>Поиск затрагиваемых программ и драйверов…</p>
            <div className="rcBar rcBarMarquee">
              <div />
            </div>
          </>
        ) : (
          <>
            <p>
              Описание: {point.desc}
              <br />
              Дата: {point.date}
            </p>
            <p>
              Будут удалены все программы и драйверы, добавленные после
              последней точки восстановления:
            </p>
            {list(AFFECTED.removed)}
            <p>Следующие компоненты будут восстановлены:</p>
            {list(AFFECTED.restored)}
          </>
        )}
      </div>
      <div className="rcFoot">
        <Btn def onClick={onClose}>
          Закрыть
        </Btn>
      </div>
    </Win>
  );
};

// Окно хода восстановления: проходит заданные шаги и вызывает onDone
const Progress = ({ steps, from, to, onDone }) => {
  const [idx, setIdx] = useState(0);
  const [percent, setPercent] = useState(from);

  useEffect(() => {
    if (idx >= steps.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setIdx(idx + 1), steps[idx].ms);
    return () => clearTimeout(timer);
  }, [idx]);

  useEffect(() => {
    const target =
      from + ((to - from) * Math.min(idx + 1, steps.length)) / steps.length;
    setPercent(target);
  }, [idx]);

  const step = steps[Math.min(idx, steps.length - 1)];

  return (
    <Win
      title="Восстановление системы"
      icon={<RestoreIcon />}
      width={460}
      onClose={() => {}}
    >
      <div className="rcPad">
        <p>Подождите, идёт восстановление файлов и параметров Windows.</p>
        <p className="rcStatus">{step.text}</p>
        <div className="rcBar">
          <div style={{ width: percent + "%" }} />
        </div>
      </div>
    </Win>
  );
};

// «Подтверждение владельца профиля»: странные контрольные вопросы
const Identity = ({ onDone }) => {
  const [answers, setAnswers] = useState(IDENTITY.map(() => ""));
  const [error, setError] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = () => {
    setChecking(true);
    setError(false);
    setTimeout(() => {
      setChecking(false);
      const ok = IDENTITY.every(
        (q, i) => q.ok.includes(Number(answers[i])) && answers[i] !== "",
      );
      if (ok) onDone();
      else setError(true);
    }, randomDelay(900, 1800));
  };

  return (
    <>
      <Win
        title="Подтверждение владельца профиля"
        icon={<MsgIcon type="shield" size={16} />}
        width={520}
        onClose={() => setCancel(true)}
      >
        <div className="rcPad">
          <div className="rcMsg rcMsgFlat">
            <MsgIcon type="shield" />
            <div className="rcMsgText">
              <p>
                Для восстановления данных профиля {USER} необходимо подтвердить,
                что вы являетесь его владельцем.
              </p>
              <p>Ответьте на контрольные вопросы.</p>
            </div>
          </div>
          <div className="rcForm">
            {IDENTITY.map((q, i) => (
              <React.Fragment key={q.label}>
                <label htmlFor={"rcQ" + i}>{q.label}</label>
                <select
                  id={"rcQ" + i}
                  value={answers[i]}
                  onChange={(e) => {
                    const a = [...answers];
                    a[i] = e.target.value;
                    setAnswers(a);
                  }}
                >
                  <option value="">(не выбрано)</option>
                  {q.options.map((o, k) => (
                    <option key={o} value={k}>
                      {o}
                    </option>
                  ))}
                </select>
              </React.Fragment>
            ))}
          </div>
          <p className="rcError" data-show={error}>
            Один или несколько ответов не совпадают с данными профиля.
          </p>
        </div>
        <div className="rcFoot">
          <Btn
            def
            disabled={checking || answers.some((a) => a === "")}
            onClick={submit}
          >
            {checking ? "Проверка…" : "ОК"}
          </Btn>
          <Btn onClick={() => setCancel(true)}>Отмена</Btn>
        </div>
      </Win>
      {cancel ? (
        <MsgBox
          title="Подтверждение владельца профиля"
          icon="error"
          onClose={() => setCancel(false)}
          buttons={[{ label: "ОК", onClick: () => setCancel(false) }]}
        >
          <p>
            Без подтверждения владельца восстановление профиля {USER}{" "}
            невозможно.
          </p>
        </MsgBox>
      ) : null}
    </>
  );
};

// «Средство диагностики DirectX»: собрать тестовое изображение
const DxDiag = ({ onDone }) => {
  const [order, setOrder] = useState(() => {
    let o;
    do o = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    while (o.filter((v, i) => v == i).length > 2);
    return o;
  });
  const [picked, setPicked] = useState(null);
  const solved = order.every((v, i) => v == i);

  const pick = (i) => {
    if (solved) return;
    if (picked == null) return setPicked(i);
    if (picked != i) {
      const o = [...order];
      [o[picked], o[i]] = [o[i], o[picked]];
      setOrder(o);
    }
    setPicked(null);
  };

  return (
    <Win
      title="Средство диагностики DirectX"
      icon={<MsgIcon type="monitor" size={16} />}
      width={440}
      onClose={() => {}}
    >
      <div className="rcPad">
        <p>
          {solved
            ? "Тест DirectDraw завершён. Неполадок не найдено."
            : "Тестовое изображение повреждено. Восстановите порядок фрагментов, чтобы продолжить проверку DirectDraw."}
        </p>
        <div className="rcPuzzle" data-solved={solved}>
          {order.map((piece, i) => {
            const x = (piece % 3) * 100;
            const y = Math.floor(piece / 3) * 100;
            return (
              <div
                key={i}
                className="rcPiece"
                data-picked={picked == i}
                onClick={() => pick(i)}
              >
                <PuzzlePicture viewBox={`${x} ${y} 100 100`} />
              </div>
            );
          })}
        </div>
        <p className="rcHint">
          {solved
            ? "\u00a0"
            : "Щёлкните два фрагмента, чтобы поменять их местами."}
        </p>
      </div>
      <div className="rcFoot">
        <Btn def disabled={!solved} onClick={onDone}>
          Далее &gt;
        </Btn>
      </div>
    </Win>
  );
};

// «Средство проверки памяти Windows»: настоящий текстовый режим 80×25,
// только знакоместа и цвета VGA. Нужно найти блоки с одинаковыми данными
const COLS = 4;
const CELL = 16;
const center = (str, width) => {
  const left = Math.floor((width - str.length) / 2);
  return " ".repeat(left) + str + " ".repeat(width - str.length - left);
};

const MemTest = ({ onDone }) => {
  const blocks = useMemo(
    () =>
      shuffle([...MEMORY_BLOCKS, ...MEMORY_BLOCKS]).map((word, i) => ({
        word,
        addr:
          "0x" +
          (0x1a000 + i * 0x1f40 + Math.floor(Math.random() * 0x40) * 0x10)
            .toString(16)
            .toUpperCase()
            .padStart(8, "0"),
      })),
    [],
  );
  const [cursor, setCursor] = useState(0);
  const [open, setOpen] = useState([]);
  const [found, setFound] = useState([]);
  const done = found.length == MEMORY_BLOCKS.length;
  const percent = Math.round((found.length / MEMORY_BLOCKS.length) * 100);

  const check = (i) => {
    if (done || open.length == 2 || open.includes(i)) return;
    if (found.includes(blocks[i].word)) return;
    const now = [...open, i];
    setOpen(now);
    if (now.length < 2) return;
    const [a, b] = now.map((k) => blocks[k]);
    const same = a.word == b.word;
    setTimeout(
      () => {
        if (same) setFound((f) => [...f, a.word]);
        setOpen([]);
      },
      same ? 500 : 1100,
    );
  };

  // стрелки двигают выделение, ВВОД проверяет блок
  const state = useRef();
  state.current = { cursor, check };
  useEffect(() => {
    const onKey = (e) => {
      const { cursor, check } = state.current;
      const n = blocks.length;
      const moves = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -COLS,
        ArrowDown: COLS,
      };
      if (moves[e.key] != null) {
        e.preventDefault();
        setCursor((cursor + moves[e.key] + n) % n);
      } else if (e.key == "Enter" || e.key == " ") {
        e.preventDefault();
        check(cursor);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [done]);

  const cell = (b, i) => {
    const isFound = found.includes(b.word);
    const isOpen = isFound || open.includes(i);
    const text = center(isOpen ? b.word : b.addr, CELL - 4);
    return (
      <React.Fragment key={i}>
        <span
          className="rcTm"
          data-color={isFound ? "green" : isOpen ? "yellow" : ""}
          data-cursor={cursor == i && !done}
          onClick={() => {
            setCursor(i);
            check(i);
          }}
        >
          {" " + text + " "}
        </span>
        {"  "}
      </React.Fragment>
    );
  };

  const rows = [];
  for (let r = 0; r < blocks.length / COLS; r++) {
    rows.push(
      <div key={"r" + r}>
        {"   "}
        {blocks
          .slice(r * COLS, r * COLS + COLS)
          .map((b, k) => cell(b, r * COLS + k))}
      </div>,
      <div key={"g" + r}> </div>,
    );
  }

  return (
    <div className="rcMem">
      <div className="rcMemBar rcMemTop">
        Средство диагностики памяти Windows
      </div>
      <div className="rcMemBody">
        <div> </div>
        <div>
          {"   Windows проверяет память. Это может занять несколько минут."}
        </div>
        <div>
          {"   Найдите блоки с одинаковыми данными, чтобы проверить их."}
        </div>
        <div> </div>
        <div>
          {"   Выполняется проход 1 из 1. Общее состояние: " + percent + "%"}
        </div>
        <div>
          {"   Состояние: "}
          <span data-color={done ? "white" : ""} className="rcTm">
            {done
              ? "неполадки оборудования не обнаружены."
              : "неполадки пока не обнаружены."}
          </span>
        </div>
        <div> </div>
        <div> </div>
        {rows}
        <div>
          {done
            ? "   Проверка завершена. Компьютер продолжит восстановление."
            : "   Стрелки — выбор блока, ВВОД — проверить блок."}
        </div>
      </div>
      <div className="rcMemBar rcMemBottom">
        <span>ESC=Выход</span>
        <span>F1=Параметры</span>
      </div>
    </div>
  );
};

// Окно Windows 11 «Введите ключ продукта» и активация
const normKey = (k) => k.toUpperCase().replace(/[^A-Z0-9]/g, "");

const formatKey = (raw) =>
  normKey(raw)
    .slice(0, 25)
    .replace(/(.{5})(?=.)/g, "$1-");

const ProductKey = ({ onDone }) => {
  const [key, setKey] = useState("");
  // "enter" | "checking" | "activate" | "activating" | "done"
  const [step, setStep] = useState("enter");
  const [wrong, setWrong] = useState(false);
  const [cancel, setCancel] = useState(false);
  const full = normKey(key).length == 25;

  const check = () => {
    setStep("checking");
    setWrong(false);
    setTimeout(() => {
      if (normKey(key) == normKey(PRODUCT.key)) setStep("activate");
      else {
        setWrong(true);
        setStep("enter");
      }
    }, randomDelay(1500, 2800));
  };

  const activate = () => {
    setStep("activating");
    setTimeout(() => setStep("done"), randomDelay(3000, 4500));
  };

  let body;
  let buttons;
  if (step == "enter" || step == "checking") {
    body = (
      <>
        <div className="rcDlgTitle">Введите ключ продукта</div>
        <p>
          Для завершения восстановления профиля {USER} требуется ключ продукта.{" "}
          {PRODUCT.hint}
        </p>
        <p className="rcMuted">
          Ключ продукта выглядит примерно так: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
        </p>
        <label className="rcFieldLabel" htmlFor="rcKey">
          Ключ продукта
        </label>
        <input
          id="rcKey"
          className="rcField"
          value={key}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          disabled={step == "checking"}
          onChange={(e) => setKey(formatKey(e.target.value))}
          onKeyDown={(e) => e.key == "Enter" && full && check()}
        />
        <p className="rcError" data-show={wrong}>
          Этот ключ продукта не работает. Проверьте его и повторите попытку или
          введите другой ключ. (0xC004F050)
        </p>
      </>
    );
    buttons = (
      <>
        <Btn def disabled={!full || step == "checking"} onClick={check}>
          {step == "checking" ? "Проверка…" : "Далее"}
        </Btn>
        <Btn disabled={step == "checking"} onClick={() => setCancel(true)}>
          Отмена
        </Btn>
      </>
    );
  } else if (step == "activate" || step == "activating") {
    body = (
      <>
        <div className="rcDlgTitle">Активировать Windows</div>
        <p>Выпуск: {PRODUCT.edition}</p>
        <p>
          {step == "activating"
            ? "Активация Windows…"
            : "Ключ продукта подходит. Активируйте эту копию Windows, чтобы завершить восстановление."}
        </p>
        {step == "activating" ? (
          <div className="rcBar rcBarMarquee">
            <div />
          </div>
        ) : null}
      </>
    );
    buttons = (
      <Btn def disabled={step == "activating"} onClick={activate}>
        Активировать
      </Btn>
    );
  } else {
    body = (
      <>
        <div className="rcDlgTitle">Активация Windows</div>
        <p>Мы активировали эту копию Windows.</p>
        <p>Выпуск: {PRODUCT.edition}</p>
      </>
    );
    buttons = (
      <Btn def onClick={onDone}>
        Закрыть
      </Btn>
    );
  }

  return (
    <>
      <Win
        title="Активация Windows"
        icon={<MsgIcon type="key" size={16} />}
        width={480}
        onClose={() => step == "enter" && setCancel(true)}
      >
        <div className="rcPad rcDlg">{body}</div>
        <div className="rcFoot rcFootWide">{buttons}</div>
      </Win>
      {cancel ? (
        <MsgBox
          title="Активация Windows"
          icon="error"
          onClose={() => setCancel(false)}
          buttons={[{ label: "ОК", onClick: () => setCancel(false) }]}
        >
          <p>
            Без ключа продукта восстановление профиля {USER} не может быть
            завершено.
          </p>
        </MsgBox>
      ) : null}
    </>
  );
};

// Блокнот с восстановленным файлом: текст печатается, клик дописывает
const Notepad = ({ onClose }) => {
  const [shown, setShown] = useState(0);
  const textRef = useRef();
  const done = shown >= NOTEPAD_TEXT.length;

  useEffect(() => {
    if (done) return;
    const ch = NOTEPAD_TEXT[shown];
    let wait = 22;
    if (ch == "\n") wait = 260;
    else if (/[.,—!?]/.test(ch)) wait = 140;
    const timer = setTimeout(() => setShown(shown + 1), wait);
    return () => clearTimeout(timer);
  }, [shown]);

  useEffect(() => {
    const el = textRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown]);

  const text = NOTEPAD_TEXT.slice(0, shown);
  const lines = text.split("\n");

  return (
    <Win
      title={NOTEPAD_FILE + " — Блокнот"}
      icon={<NotepadIcon />}
      width={760}
      onClose={onClose}
      className="rcNotepad"
    >
      <div className="rcNpMenu">
        <span>Файл</span>
        <span>Правка</span>
        <span>Просмотр</span>
      </div>
      <div
        className="rcNpText"
        ref={textRef}
        onClick={() => setShown(NOTEPAD_TEXT.length)}
      >
        {text}
        <span className="rcCaret" />
      </div>
      <div className="rcNpStatus">
        <span>
          Стр {lines.length}, стлб {lines[lines.length - 1].length + 1}
        </span>
        <span>100%</span>
        <span>Windows (CRLF)</span>
        <span>UTF-8</span>
      </div>
    </Win>
  );
};

const fileSteps = (files) =>
  files.map((f) => ({
    text: `Восстановление файлов: C:\\Users\\${USER}\\Documents\\${f}`,
    ms: randomDelay(700, 1400),
  }));

const HALF = Math.ceil(RESTORED_FILES.length / 2);

// Шаги восстановления между проверками
const STAGES = {
  init: {
    from: 0,
    to: 15,
    steps: [
      { text: "Восстановление системы инициализируется…", ms: 4000 },
      { text: "Проверка владельца профиля…", ms: 1800 },
    ],
    next: "identity",
  },
  files1: {
    from: 15,
    to: 45,
    steps: [
      ...fileSteps(RESTORED_FILES.slice(0, HALF)),
      { text: "Проверка видеоподсистемы…", ms: 1800 },
    ],
    next: "dxdiag",
  },
  files2: {
    from: 45,
    to: 75,
    steps: [
      ...fileSteps(RESTORED_FILES.slice(HALF)),
      { text: "Проверка памяти…", ms: 1800 },
    ],
    next: "memtest",
  },
  finish1: {
    from: 75,
    to: 90,
    steps: [
      { text: "Восстановление реестра…", ms: 3000 },
      { text: "Проверка лицензии…", ms: 2200 },
    ],
    next: "license",
  },
  finish2: {
    from: 90,
    to: 100,
    steps: [
      { text: "Удаление временных файлов…", ms: 2200 },
      { text: "Завершение…", ms: 1500 },
    ],
    next: "success",
  },
};

// Сценарий: в безопасном режиме на рабочем столе появляется ошибка,
// из неё запускается «Восстановление системы»; в конце приложение
// становится прозрачным и закрывается
export const Recovery = () => {
  const wall = useSelector((state) => state.wallpaper);
  const dispatch = useDispatch();
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (wall.locked || wall.recovered || phase != "idle") return;
    const timer = setTimeout(() => setPhase("error"), randomDelay(5000, 7000));
    return () => clearTimeout(timer);
  }, [wall.locked, wall.recovered, phase]);

  const closeApp = () => {
    setPhase("closing");
    const app = document.querySelector(".App");
    document.body.style.background = "#000";
    app.style.transition = "opacity 1.6s ease-in";
    app.style.opacity = "0";

    setTimeout(() => {
      try {
        const tauriWin = window.__TAURI__ && window.__TAURI__.window;
        if (tauriWin) tauriWin.appWindow.close();
      } catch (e) {}
      window.close();

      // в обычном браузере вкладку закрыть нельзя — показываем
      // рабочий стол уже без безопасного режима
      setTimeout(() => {
        dispatch({ type: "WALLRECOVERED" });
        setPhase("done");
        app.style.transition = "opacity 0.8s ease-out";
        app.style.opacity = "1";
      }, 1200);
    }, 1800);
  };

  const stage = STAGES[phase];

  return (
    <>
      {phase == "error" ? (
        <CorruptionError
          onRestore={() => setPhase("wizard")}
          onClose={() => setPhase("idle")}
        />
      ) : null}
      {phase == "wizard" ? (
        <Wizard
          onCancel={() => setPhase("idle")}
          onStart={() => setPhase("init")}
        />
      ) : null}
      {stage ? (
        <Progress
          key={phase}
          steps={stage.steps}
          from={stage.from}
          to={stage.to}
          onDone={() => setPhase(stage.next)}
        />
      ) : null}
      {phase == "identity" ? (
        <Identity onDone={() => setPhase("files1")} />
      ) : null}
      {phase == "dxdiag" ? <DxDiag onDone={() => setPhase("files2")} /> : null}
      {phase == "memtest" ? (
        <MemTest onDone={() => setPhase("finish1")} />
      ) : null}
      {phase == "license" ? (
        <ProductKey onDone={() => setPhase("finish2")} />
      ) : null}
      {phase == "success" ? (
        <MsgBox
          title="Восстановление системы"
          icon="info"
          onClose={() => setPhase("notepad")}
          z={0}
          buttons={[{ label: "Закрыть", onClick: () => setPhase("notepad") }]}
        >
          <p>Восстановление системы успешно завершено.</p>
          <p>
            Система была восстановлена до состояния на 03.11.2025. Ваши
            документы не были затронуты.
          </p>
        </MsgBox>
      ) : null}
      {phase == "notepad" ? <Notepad onClose={closeApp} /> : null}
    </>
  );
};
