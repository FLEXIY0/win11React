import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { WinToast } from "../background";
import {
  BROKEN_FILES,
  CONFIG_FIX,
  FINAL_TOAST,
  HARD_TIMES,
  HER,
  LETTER,
  LOVE_FILE,
  MEMORIES,
  PAIRS,
  QUIZ,
} from "./data";
import "./recovery.scss";

const randomDelay = (min, max) => min + Math.random() * (max - min);

const NOISE = "█▓▒░#%&@$*?";

// «Битый» текст, который восстанавливается слева направо
const useDecode = (text, duration, start) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!start) return;
    const tick = 30;
    const step = Math.max(1, Math.ceil(text.length / (duration / tick)));
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(text.length, cur + step);
      setShown(cur);
      if (cur >= text.length) clearInterval(timer);
    }, tick);
    return () => clearInterval(timer);
  }, [start]);

  const rest = text
    .slice(shown)
    .replace(/\S/gu, () => NOISE[Math.floor(Math.random() * NOISE.length)]);
  return [text.slice(0, shown) + rest, shown >= text.length];
};

// Текст печатается по буквам; клик дописывает сразу
const useTypewriter = (text, speed = 35) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= text.length) return;
    const ch = text[shown];
    let wait = speed;
    if (ch == "\n") wait = speed * 8;
    else if (/[.,—!?]/.test(ch)) wait = speed * 6;
    const timer = setTimeout(() => setShown(shown + 1), wait);
    return () => clearTimeout(timer);
  }, [shown]);

  const skip = () => setShown(text.length);
  return [text.slice(0, shown), shown >= text.length, skip];
};

// Действие, которое становится доступным через ms
const useReadyAfter = (ms, deps = []) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, deps);

  return ready;
};

const ErrorIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="15" fill="#ff99a4" />
    <path
      d="M11 11l10 10M21 11L11 21"
      stroke="#000"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="8" fill="#6ccb5f" />
    <path
      d="M4.5 8.2l2.2 2.2 4.8-4.8"
      stroke="#000"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RecoveryIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <path
      d="M8 1.5a6.5 6.5 0 1 1-6.2 4.6"
      stroke="#60cdff"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M1.2 2.2l.6 4.1 4-1.1z" fill="#60cdff" />
    <path
      d="M8 4.5V8l2.4 1.6"
      stroke="#fff"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Button = ({ accent, disabled, onClick, children }) => (
  <div
    className={"recBtn" + (accent ? " recBtnAccent" : "")}
    data-disabled={!!disabled}
    onClick={disabled ? null : onClick}
  >
    {children}
  </div>
);

const useShake = () => {
  const [shake, setShake] = useState(false);
  const run = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };
  return [shake, run];
};

// Окно ошибки Windows: повреждены системные файлы
const CorruptionError = ({ onRepair }) => {
  const [refused, setRefused] = useState(0);
  const [shake, runShake] = useShake();

  const close = () => {
    setRefused(refused + 1);
    runShake();
  };

  return (
    <div className="recOverlay">
      <div className="recShake" data-shake={shake}>
        <div className="recDialog">
          <div className="recTitleBar">
            <span>Windows</span>
            <div className="recTitleBtn" onClick={close}>
              ✕
            </div>
          </div>
          <div className="recDialogBody">
            <div className="recDialogIcon">
              <ErrorIcon />
            </div>
            <div>
              <div className="recDialogTitle">Повреждены системные файлы</div>
              <div className="recText">
                Windows не может продолжить работу: повреждены важные файлы
                памяти. Не удалось загрузить:
              </div>
              <div className="recFileList">
                {BROKEN_FILES.slice(0, 5).map((f) => (
                  <div key={f}>{f}</div>
                ))}
                <div className="recMuted">…и ещё {BROKEN_FILES.length - 5}</div>
              </div>
              <div className="recText">
                Рекомендуется запустить восстановление системы.
              </div>
              {refused ? (
                <div className="recRefused">
                  {refused == 1
                    ? "Закрыть не получится: без этих файлов система не запустится."
                    : "Ну правда, они очень важные 🙂"}
                </div>
              ) : null}
            </div>
          </div>
          <div className="recDialogFoot">
            <Button accent onClick={onRepair}>
              Восстановить систему
            </Button>
            <Button onClick={close}>Закрыть</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IntroStep = ({ next }) => (
  <div className="recStep">
    <div className="recBigIcon">
      <RecoveryIcon size={56} />
    </div>
    <div className="recH1">Мастер восстановления системы</div>
    <div className="recText">
      {HER}, похоже, в системе повреждены очень важные файлы — наши
      воспоминания. Мастер поможет восстановить их по одному.
    </div>
    <div className="recText recMuted">
      Не закрывай окно и не выключай компьютер.
    </div>
    <div className="recActions">
      <Button accent onClick={next}>
        Начать восстановление
      </Button>
    </div>
  </div>
);

const SCAN_OK = [
  "C:\\Windows\\System32\\kernel32.dll",
  "C:\\Windows\\System32\\ntoskrnl.exe",
  "C:\\Windows\\System32\\drivers\\acpi.sys",
  "C:\\Windows\\System32\\winlogon.exe",
  "C:\\Windows\\Fonts\\segoeui.ttf",
];

const ScanStep = ({ next }) => {
  // вперемешку: системные файлы целы, наши — повреждены
  const lines = useMemo(() => {
    const out = [];
    let i = 0;
    BROKEN_FILES.forEach((f, k) => {
      if (k % 2 == 0 && SCAN_OK[i]) out.push({ path: SCAN_OK[i++] });
      out.push({ path: "C:\\Память\\" + f, bad: true });
    });
    while (SCAN_OK[i]) out.push({ path: SCAN_OK[i++] });
    return out;
  }, []);

  const [count, setCount] = useState(0);
  const logRef = useRef();

  useEffect(() => {
    if (count >= lines.length) return;
    const wait = count == 0 ? 1200 : randomDelay(250, 750);
    const timer = setTimeout(() => setCount(count + 1), wait);
    return () => clearTimeout(timer);
  }, [count]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [count]);

  const done = count >= lines.length;
  const percent = Math.round((count / lines.length) * 100);

  return (
    <div className="recStep">
      <div className="recH2">Сканирование системы</div>
      <div className="recText recMuted">
        {done ? "Сканирование завершено" : `Проверка файлов… ${percent}%`}
      </div>
      <div className="recProgress">
        <div style={{ width: percent + "%" }} />
      </div>
      <div className="recLog" ref={logRef}>
        {lines.slice(0, count).map((l) => (
          <div key={l.path} className="recLogLine">
            <span className="recLogPath">{l.path}</span>
            <span className={l.bad ? "recBad" : "recOk"}>
              {l.bad ? "повреждён" : "OK"}
            </span>
          </div>
        ))}
      </div>
      {done ? (
        <div className="recText">
          Обнаружено повреждённых файлов: <b>{BROKEN_FILES.length}</b>. Все они
          очень важны.
        </div>
      ) : null}
      <div className="recActions">
        <Button accent disabled={!done} onClick={next}>
          Восстановить
        </Button>
      </div>
    </div>
  );
};

// Карточка файла: сначала «повреждён», потом текст восстанавливается
const FileCard = ({ icon, file, caption, text, onDone }) => {
  const restoring = useReadyAfter(1000);
  const [shown, done] = useDecode(text, 2800, restoring);

  useEffect(() => {
    if (done && onDone) onDone();
  }, [done]);

  return (
    <div className="recCard" data-done={done}>
      <div className="recCardHead">
        <div className="recCardIcon">{icon}</div>
        <div className="recCardName">
          <div className="recMono">{file}</div>
          {caption ? <div className="recMuted recSmall">{caption}</div> : null}
        </div>
        <div className="recCardStatus">
          {done ? (
            <>
              <CheckIcon /> Восстановлено
            </>
          ) : restoring ? (
            <span className="recMuted">Восстановление…</span>
          ) : (
            <span className="recBad">Повреждён</span>
          )}
        </div>
      </div>
      <div className="recCardText">{shown}</div>
      <div className="recProgress recProgressThin" data-hide={done}>
        <div className="recProgressRun" data-run={restoring} />
      </div>
    </div>
  );
};

const MemoriesStep = ({ next }) => {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const mem = MEMORIES[idx];
  const last = idx == MEMORIES.length - 1;

  const go = () => {
    if (last) return next();
    setDone(false);
    setIdx(idx + 1);
  };

  return (
    <div className="recStep">
      <div className="recH2">Восстановление памяти</div>
      <div className="recDots">
        {MEMORIES.map((m, i) => (
          <i key={i} data-state={i < idx ? "done" : i == idx ? "cur" : ""} />
        ))}
      </div>
      <FileCard
        key={idx}
        icon={mem.icon}
        file={mem.file}
        caption={`Сектор ${idx + 1} из ${MEMORIES.length}`}
        text={mem.text}
        onDone={() => setDone(true)}
      />
      <div className="recActions">
        <Button accent disabled={!done} onClick={go}>
          {last ? "Далее" : "Следующий файл"}
        </Button>
      </div>
    </div>
  );
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// «Мемори»: найти пары, каждая пара восстанавливает сектор
const GamesStep = ({ next }) => {
  const cards = useMemo(
    () => shuffle([...PAIRS, ...PAIRS].map((p, i) => ({ ...p, id: i }))),
    [],
  );
  const [open, setOpen] = useState([]);
  const [found, setFound] = useState([]);
  const [caption, setCaption] = useState(null);

  const flip = (i) => {
    if (open.length == 2 || open.includes(i)) return;
    if (found.includes(cards[i].icon)) return;
    const now = [...open, i];
    setOpen(now);
    if (now.length < 2) return;

    const [a, b] = now.map((k) => cards[k]);
    if (a.icon == b.icon) {
      setTimeout(() => {
        setFound((f) => [...f, a.icon]);
        setCaption(a);
        setOpen([]);
      }, 450);
    } else {
      setTimeout(() => setOpen([]), 900);
    }
  };

  const done = found.length == PAIRS.length;

  return (
    <div className="recStep">
      <div className="recH2">Восстановление игр</div>
      <div className="recText recMuted">
        Сектор «Игры» повреждён. Найди все пары, чтобы восстановить его.
      </div>
      <div className="recGame">
        {cards.map((c, i) => {
          const isFound = found.includes(c.icon);
          const isOpen = isFound || open.includes(i);
          return (
            <div
              key={c.id}
              className="recGameCard"
              data-open={isOpen}
              data-found={isFound}
              onClick={() => flip(i)}
            >
              <div className="recGameInner">
                <div className="recGameBack">?</div>
                <div className="recGameFront">{c.icon}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="recGameCaption">
        {caption ? (
          <>
            <span className="recEmoji">{caption.icon}</span> {caption.caption}
          </>
        ) : (
          <span className="recMuted">
            Восстановлено пар: 0 из {PAIRS.length}
          </span>
        )}
      </div>
      <div className="recActions">
        <span className="recMuted recSmall">
          {done
            ? "Сектор восстановлен"
            : `Восстановлено пар: ${found.length} из ${PAIRS.length}`}
        </span>
        <Button accent disabled={!done} onClick={next}>
          Далее
        </Button>
      </div>
    </div>
  );
};

const QuizStep = ({ next }) => {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState([]);
  const [answer, setAnswer] = useState(null);
  const [shake, runShake] = useShake();
  const q = QUIZ[idx];
  const last = idx == QUIZ.length - 1;

  const pick = (i) => {
    if (answer != null) return;
    if (i == q.ok || (q.accepted && q.accepted[i])) {
      setAnswer(i);
    } else {
      setWrong([...wrong, i]);
      runShake();
    }
  };

  const go = () => {
    if (last) return next();
    setIdx(idx + 1);
    setWrong([]);
    setAnswer(null);
  };

  let message = null;
  if (answer != null) {
    message =
      answer == q.ok ? (
        <>
          <CheckIcon /> Целостность подтверждена
        </>
      ) : (
        q.accepted[answer]
      );
  } else if (wrong.length) message = q.wrong;

  return (
    <div className="recStep">
      <div className="recH2">Проверка целостности</div>
      <div className="recText recMuted">
        Вопрос {idx + 1} из {QUIZ.length}. Система проверяет, что все
        воспоминания на месте.
      </div>
      <div className="recQuestion">{q.question}</div>
      <div className="recOptions" data-shake={shake}>
        {q.options.map((o, i) => (
          <div
            key={idx + "-" + i}
            className="recOption"
            data-state={answer == i ? "ok" : wrong.includes(i) ? "wrong" : ""}
            onClick={() => pick(i)}
          >
            {o}
          </div>
        ))}
      </div>
      <div className="recQuizMessage" data-ok={answer != null}>
        {message}
      </div>
      <div className="recActions">
        <Button accent disabled={answer == null} onClick={go}>
          {last ? "Далее" : "Следующий вопрос"}
        </Button>
      </div>
    </div>
  );
};

// Исправление «бага» в настройках: старые строки вычёркиваются,
// новые появляются по одной
const ConfigFix = ({ onDone }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const total = 2 + CONFIG_FIX.added.length;
    if (stage >= total) {
      onDone();
      return;
    }
    const wait = stage == 0 ? 1600 : stage == 1 ? 1400 : 700;
    const timer = setTimeout(() => setStage(stage + 1), wait);
    return () => clearTimeout(timer);
  }, [stage]);

  return (
    <div className="recCard" data-done={stage >= 2 + CONFIG_FIX.added.length}>
      <div className="recCardHead">
        <div className="recCardIcon">⚙️</div>
        <div className="recCardName">
          <div className="recMono">{CONFIG_FIX.file}</div>
          <div className="recMuted recSmall">Файл настроек</div>
        </div>
        <div className="recCardStatus">
          {stage >= 2 + CONFIG_FIX.added.length ? (
            <>
              <CheckIcon /> Исправлено
            </>
          ) : stage >= 1 ? (
            <span className="recMuted">Исправление…</span>
          ) : (
            <span className="recBad">Ошибка</span>
          )}
        </div>
      </div>
      <div className="recCardText">{CONFIG_FIX.problem}</div>
      <div className="recDiff">
        {CONFIG_FIX.removed.map((l) => (
          <div key={l} className="recDiffDel" data-struck={stage >= 1}>
            − {l}
          </div>
        ))}
        {CONFIG_FIX.added.slice(0, Math.max(0, stage - 1)).map((l) => (
          <div key={l} className="recDiffAdd">
            + {l}
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemStep = ({ next }) => {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);

  const go = () => {
    if (stage == 1) return next();
    setDone(false);
    setStage(1);
  };

  return (
    <div className="recStep">
      <div className="recH2">Системные файлы</div>
      <div className="recText recMuted">
        Осталось несколько критически важных файлов.
      </div>
      {stage == 0 ? (
        <FileCard
          icon="💛"
          file={HARD_TIMES.file}
          caption="Критический системный файл"
          text={HARD_TIMES.text}
          onDone={() => setDone(true)}
        />
      ) : (
        <ConfigFix onDone={() => setDone(true)} />
      )}
      <div className="recActions">
        <Button accent disabled={!done} onClick={go}>
          Далее
        </Button>
      </div>
    </div>
  );
};

const Letter = ({ onDone }) => {
  const [text, done, skip] = useTypewriter(LETTER);

  useEffect(() => {
    if (done) onDone();
  }, [done]);

  return (
    <div className="recLetter" onClick={skip}>
      <div className="recLetterBar">{LOVE_FILE} — Блокнот</div>
      <div className="recLetterText">
        {text}
        {done ? null : <span className="recCaret" />}
      </div>
    </div>
  );
};

const LoveStep = ({ next }) => {
  const checked = useReadyAfter(3200);
  const [opened, setOpened] = useState(false);
  const [read, setRead] = useState(false);

  if (opened) {
    return (
      <div className="recStep">
        <Letter onDone={() => setRead(true)} />
        <div className="recActions">
          <Button accent disabled={!read} onClick={next}>
            Завершить восстановление
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="recStep">
      <div className="recH2">Последний файл</div>
      <div className="recCard" data-done={checked}>
        <div className="recCardHead">
          <div className="recCardIcon">❤️</div>
          <div className="recCardName">
            <div className="recMono">{LOVE_FILE}</div>
            <div className="recMuted recSmall">Приложение</div>
          </div>
          <div className="recCardStatus">
            {checked ? (
              <>
                <CheckIcon /> Не повреждён
              </>
            ) : (
              <span className="recMuted">Проверка…</span>
            )}
          </div>
        </div>
        <div className="recCardText">
          {checked
            ? "Этот файл не повреждён. Его невозможно повредить."
            : "Проверка целостности файла…"}
        </div>
        <div className="recProgress recProgressThin" data-hide={checked}>
          <div className="recProgressRun recProgressSlow" data-run={true} />
        </div>
      </div>
      <div className="recActions">
        <Button accent disabled={!checked} onClick={() => setOpened(true)}>
          Открыть {LOVE_FILE}
        </Button>
      </div>
    </div>
  );
};

const FinishStep = ({ finish }) => (
  <div className="recStep">
    <div className="recBigIcon">
      <CheckIcon size={56} />
    </div>
    <div className="recH1">Восстановление завершено</div>
    <div className="recText">
      Восстановлено файлов: {BROKEN_FILES.length} из {BROKEN_FILES.length}.
      Ошибок не найдено.
    </div>
    <div className="recText recMuted">
      Чтобы применить изменения, нужно перезагрузить компьютер.
    </div>
    <div className="recActions">
      <Button accent onClick={finish}>
        Перезагрузить сейчас
      </Button>
    </div>
  </div>
);

const STEPS = [
  { name: "Начало", Comp: IntroStep },
  { name: "Сканирование", Comp: ScanStep },
  { name: "Восстановление памяти", Comp: MemoriesStep },
  { name: "Восстановление игр", Comp: GamesStep },
  { name: "Проверка целостности", Comp: QuizStep },
  { name: "Системные файлы", Comp: SystemStep },
  { name: LOVE_FILE, Comp: LoveStep },
  { name: "Завершение", Comp: FinishStep },
];

const Wizard = ({ finish }) => {
  const [step, setStep] = useState(0);
  const [shake, runShake] = useShake();
  const { Comp } = STEPS[step];

  return (
    <div className="recOverlay">
      <div className="recShake" data-shake={shake}>
        <div className="recWindow">
          <div className="recTitleBar">
            <RecoveryIcon />
            <span>Восстановление системы</span>
            <div className="recTitleBtns">
              <div className="recTitleBtn" onClick={runShake}>
                —
              </div>
              <div className="recTitleBtn" onClick={runShake}>
                ☐
              </div>
              <div className="recTitleBtn" onClick={runShake}>
                ✕
              </div>
            </div>
          </div>
          <div className="recWindowBody">
            <div className="recSide">
              {STEPS.map((s, i) => (
                <div
                  key={s.name}
                  className="recSideItem"
                  data-state={i < step ? "done" : i == step ? "cur" : ""}
                >
                  <span className="recSideMark">
                    {i < step ? <CheckIcon size={14} /> : i + 1}
                  </span>
                  {s.name}
                </div>
              ))}
            </div>
            <div className="recMain">
              <Comp key={step} next={() => setStep(step + 1)} finish={finish} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Сценарий: в безопасном режиме через несколько секунд на рабочем столе
// появляется ошибка, из неё запускается мастер восстановления, после
// перезагрузки система работает в обычном режиме
export const Recovery = () => {
  const wall = useSelector((state) => state.wallpaper);
  const dispatch = useDispatch();
  // "idle" | "error" | "wizard"
  const [phase, setPhase] = useState("idle");
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (wall.locked || wall.recovered || phase != "idle") return;
    const timer = setTimeout(() => setPhase("error"), randomDelay(5000, 7000));
    return () => clearTimeout(timer);
  }, [wall.locked, wall.recovered, phase]);

  useEffect(() => {
    if (!wall.recovered || wall.locked) return;
    const t1 = setTimeout(() => setToast(true), 3500);
    const t2 = setTimeout(() => setToast(false), 15000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [wall.recovered, wall.locked]);

  const finish = () => {
    setPhase("idle");
    dispatch({ type: "WALLRECOVERED" });
    dispatch({ type: "WALLRESTART" });
  };

  return (
    <>
      {phase == "error" ? (
        <CorruptionError onRepair={() => setPhase("wizard")} />
      ) : null}
      {phase == "wizard" ? <Wizard finish={finish} /> : null}
      <div className="recToastWrap">
        <WinToast
          show={toast}
          onClose={() => setToast(false)}
          title={FINAL_TOAST.title}
          text={FINAL_TOAST.text}
        />
      </div>
    </>
  );
};
