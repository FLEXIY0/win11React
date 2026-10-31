import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AFFECTED,
  ERROR_PATH,
  IDENTITY,
  MEMORY_PAIRS,
  AFFIRMATIONS,
  CMD_PROMPT,
  CMD_SCRIPT,
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
  keyboard: "img/icon/win/1479.png",
  terminal: "img/icon/terminal.png",
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
// только знакоместа и цвета VGA. Нужно найти пары связанных блоков;
// каждая пара восстанавливает строчку воспоминания внизу экрана
const COLS = 4;
const CELL = 16;
const center = (str, width) => {
  const left = Math.floor((width - str.length) / 2);
  return " ".repeat(left) + str + " ".repeat(width - str.length - left);
};

const MemTest = ({ onDone }) => {
  const blocks = useMemo(
    () =>
      shuffle(
        MEMORY_PAIRS.flatMap((p, k) => [
          { pair: k, word: p.a },
          { pair: k, word: p.b },
        ]),
      ).map((b, i) => ({
        ...b,
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
  const done = found.length == MEMORY_PAIRS.length;
  const percent = Math.round((found.length / MEMORY_PAIRS.length) * 100);

  const check = (i) => {
    if (done || open.length == 2 || open.includes(i)) return;
    if (found.includes(blocks[i].pair)) return;
    const now = [...open, i];
    setOpen(now);
    if (now.length < 2) return;
    const [a, b] = now.map((k) => blocks[k]);
    const same = a.pair == b.pair;
    setTimeout(
      () => {
        if (same) setFound((f) => [...f, a.pair]);
        setOpen([]);
      },
      same ? 500 : 1200,
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
    const timer = setTimeout(onDone, 6000);
    return () => clearTimeout(timer);
  }, [done]);

  const cell = (b, i) => {
    const isFound = found.includes(b.pair);
    const isOpen = isFound || open.includes(i);
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
          {center(isOpen ? b.word : b.addr, CELL)}
        </span>
        {"  "}
      </React.Fragment>
    );
  };

  const rows = [];
  for (let r = 0; r < blocks.length / COLS; r++) {
    rows.push(
      <div key={r}>
        {" "}
        {blocks
          .slice(r * COLS, r * COLS + COLS)
          .map((b, k) => cell(b, r * COLS + k))}
      </div>,
    );
  }

  const log = MEMORY_PAIRS.map((_, k) => {
    const p = MEMORY_PAIRS[found[k]];
    if (!p) return <div key={k}> </div>;
    return (
      <div key={k}>
        {"   "}
        <span className="rcTm" data-color="green">
          [OK]
        </span>{" "}
        <span className="rcTm" data-color="white">
          {p.a + " + " + p.b}
        </span>
        {" — " + p.line}
      </div>
    );
  });

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
          {
            "   Найдите связанные блоки данных, чтобы восстановить воспоминания."
          }
        </div>
        <div> </div>
        <div>
          {"   Выполняется проход 1 из 1. Общее состояние: " + percent + "%"}
        </div>
        <div>
          {"   Состояние: "}
          <span data-color={done ? "white" : ""} className="rcTm">
            {done
              ? "все воспоминания восстановлены. Повреждений не обнаружено."
              : "неполадки пока не обнаружены."}
          </span>
        </div>
        <div> </div>
        {rows}
        <div> </div>
        <div>{"   Восстановленные воспоминания:"}</div>
        {log}
        <div> </div>
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

// «Калибровка клавиатуры»: ввести контрольные фразы точно как показано
const normPhrase = (t) =>
  t
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const Keyboard = ({ onDone }) => {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  // "" | "ok" | "wrong"
  const [result, setResult] = useState("");
  const inputRef = useRef();
  const finished = idx >= AFFIRMATIONS.length;
  const phrase = AFFIRMATIONS[Math.min(idx, AFFIRMATIONS.length - 1)];

  const submit = () => {
    if (result == "ok") return;
    if (normPhrase(text) != normPhrase(phrase)) return setResult("wrong");
    setResult("ok");
    setTimeout(() => {
      setResult("");
      setText("");
      setIdx((i) => i + 1);
      if (inputRef.current) inputRef.current.focus();
    }, 1400);
  };

  return (
    <Win
      title="Калибровка клавиатуры"
      icon={<MsgIcon type="keyboard" size={16} />}
      width={500}
      onClose={() => {}}
    >
      <div className="rcPad rcDlg">
        <div className="rcMsg rcMsgFlat">
          <MsgIcon type="keyboard" />
          <div className="rcMsgText">
            {finished ? (
              <p>Калибровка завершена. Устройства ввода работают правильно.</p>
            ) : (
              <p>
                Чтобы проверить клавиатуру, введите контрольную фразу точно так,
                как она показана ниже. Фраза {idx + 1} из {AFFIRMATIONS.length}.
              </p>
            )}
          </div>
        </div>
        {finished ? (
          <div className="rcPhraseDone">
            {AFFIRMATIONS.map((a) => (
              <div key={a}>✓ {a}</div>
            ))}
          </div>
        ) : (
          <>
            <div className="rcPhrase">{phrase}</div>
            <input
              ref={inputRef}
              className="rcField rcFieldText"
              value={text}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="Введите фразу"
              onChange={(e) => {
                setText(e.target.value);
                if (result == "wrong") setResult("");
              }}
              onKeyDown={(e) => e.key == "Enter" && submit()}
            />
            <p className="rcKbdResult" data-result={result}>
              {result == "ok"
                ? "✓ Ввод распознан."
                : result == "wrong"
                ? "Введённый текст не совпадает с контрольной фразой. Повторите ввод."
                : "\u00a0"}
            </p>
          </>
        )}
      </div>
      <div className="rcFoot rcFootWide">
        {finished ? (
          <Btn def onClick={onDone}>
            Готово
          </Btn>
        ) : (
          <Btn def disabled={!text.trim() || result == "ok"} onClick={submit}>
            Далее
          </Btn>
        )}
      </div>
    </Win>
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
        <p>
          <b>Расположение комплекта:</b> {PRODUCT.where}
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
        <div className="rcProps">
          {PRODUCT.details.map(([k, v]) => (
            <React.Fragment key={k}>
              <span>{k}:</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
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

// Командная строка: команды набираются сами, вывод появляется
// построчно; письмо — медленно, чтобы его можно было прочитать.
// Клик дописывает письмо сразу. В конце после долгой паузы само
// набирается «люблю», Windows отвечает, что такой команды нет,
// окно мигает и исчезает
const CMD_HEADER = `Microsoft Windows [Version 10.0.26100.2033]
(c) Корпорация Майкрософт (Microsoft Corporation). Все права защищены.
`;

// паузы между буквами последней команды: человек сомневается
const HESITATION = [900, 700, 1300, 600, 1000];

const cmdTimeline = () => {
  const steps = [{ add: CMD_HEADER, wait: 1500 }];
  let finalAt = 0;
  CMD_SCRIPT.forEach(({ cmd, out, pace }) => {
    const final = pace == "final";
    if (final) finalAt = steps.length;
    steps.push({ add: "\n" + CMD_PROMPT, wait: final ? 4500 : 900 });
    [...cmd].forEach((ch, i) =>
      steps.push({
        add: ch,
        wait: final ? HESITATION[i % HESITATION.length] : randomDelay(60, 160),
      }),
    );
    steps.push({ add: "\n", wait: pace == "system" ? 700 : 1200 });
    out.split("\n").forEach((line) => {
      // письмо читают медленно: короткая строка держится не меньше
      // секунды, пустая строка — пауза
      let wait = pace == "read" ? Math.max(1100, line.length * 55) : 90;
      if (!line.trim()) wait = pace == "read" ? 900 : 60;
      steps.push({ add: line + "\n", wait });
    });
  });
  steps.push({ add: "\n" + CMD_PROMPT, wait: 3500 });
  return { steps, finalAt };
};

const Cmd = ({ onClose, closing }) => {
  const { steps, finalAt } = useMemo(cmdTimeline, []);
  const [idx, setIdx] = useState(0);
  const [blink, setBlink] = useState(false);
  const textRef = useRef();
  const done = idx >= steps.length;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setIdx(idx + 1), steps[idx].wait);
    return () => clearTimeout(timer);
  }, [idx]);

  useEffect(() => {
    const el = textRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [idx]);

  useEffect(() => {
    if (!done) return;
    setBlink(true);
    const timer = setTimeout(onClose, 1100);
    return () => clearTimeout(timer);
  }, [done]);

  const shown = steps
    .slice(0, idx)
    .map((st) => st.add)
    .join("");

  let cls = "rcCmd";
  if (closing) cls += " rcFadeOut";
  else if (blink) cls += " rcCmdBlink";

  return (
    <Win
      title={"C:\\WINDOWS\\system32\\cmd.exe"}
      icon={<MsgIcon type="terminal" size={16} />}
      width={900}
      onClose={onClose}
      className={cls}
    >
      <div
        className="rcCmdText"
        ref={textRef}
        onClick={() => idx < finalAt && setIdx(finalAt)}
      >
        {shown}
        <span className="rcCmdCaret" />
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
  inputs: {
    from: 75,
    to: 80,
    steps: [{ text: "Проверка устройств ввода…", ms: 2000 }],
    next: "keyboard",
  },
  finish1: {
    from: 80,
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
  const [desktopShot, setDesktopShot] = useState(null);

  useEffect(() => {
    if (wall.locked || wall.recovered || phase != "idle") return;
    const timer = setTimeout(() => setPhase("error"), randomDelay(5000, 7000));
    return () => clearTimeout(timer);
  }, [wall.locked, wall.recovered, phase]);

  // Конец. В exe-версии программа перед запуском сняла экран
  // (__desktop.png): снимок плавно проявляется поверх всего, и после
  // __exit окно закрывается — под ним тот же самый настоящий рабочий
  // стол. В браузере чёрный безопасный режим тает в обычные обои
  const closeApp = () => {
    setPhase("closing");
    const shot = new Image();
    shot.onload = () => {
      setDesktopShot(shot.src);
      setTimeout(() => fetch("__exit").catch(() => {}), 2800);
    };
    shot.onerror = () => {
      dispatch({ type: "WALLRECOVERED" });
      setTimeout(() => {
        setPhase("done");
        try {
          const tauriWin = window.__TAURI__ && window.__TAURI__.window;
          if (tauriWin) tauriWin.appWindow.close();
        } catch (e) {}
        window.close();
      }, 2600);
    };
    shot.src = "__desktop.png";
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
        <MemTest onDone={() => setPhase("inputs")} />
      ) : null}
      {phase == "keyboard" ? (
        <Keyboard onDone={() => setPhase("finish1")} />
      ) : null}
      {phase == "license" ? (
        <ProductKey onDone={() => setPhase("finish2")} />
      ) : null}
      {phase == "success" ? (
        <MsgBox
          title="Восстановление системы"
          icon="info"
          onClose={() => setPhase("letter")}
          z={0}
          buttons={[{ label: "Закрыть", onClick: () => setPhase("letter") }]}
        >
          <p>Восстановление системы успешно завершено.</p>
          <p>
            Система была восстановлена до состояния на 03.11.2025. Ваши
            документы не были затронуты.
          </p>
        </MsgBox>
      ) : null}
      {desktopShot ? (
        <img className="rcRealDesktop" src={desktopShot} alt="" />
      ) : null}
      {phase == "letter" || phase == "closing" ? (
        <Cmd onClose={closeApp} closing={phase == "closing"} />
      ) : null}
    </>
  );
};
