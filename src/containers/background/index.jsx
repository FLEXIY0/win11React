import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Battery from "../../components/shared/Battery";
import { Icon } from "../../utils/general";
import "./back.scss";

export const Background = () => {
  return (
    <div
      className="background"
      style={{
        backgroundColor: "#000",
      }}
    ></div>
  );
};

// Крутящиеся точки экрана входа Windows; анимация по CSS-Windows-Loader
// (github.com/JkDevArg/CSS-Windows-Loader, MIT)
const Spinner = ({ size = 22 }) => (
  <div className="winSpinner" style={{ "--size": size + "px" }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <i key={i} />
    ))}
  </div>
);

const BootLogo = () => (
  <svg width={150} height={150} viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bootLogoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5ecbfa" />
        <stop offset="1" stopColor="#0067c0" />
      </linearGradient>
    </defs>
    <path
      fill="url(#bootLogoGrad)"
      d="M0 0H48V48H0ZM52 0H100V48H52ZM0 52H48V100H0ZM52 52H100V100H52Z"
    />
  </svg>
);

export const BootScreen = (props) => {
  const dispatch = useDispatch();
  const wall = useSelector((state) => state.wallpaper);
  const [blackout, setBlackOut] = useState(false);

  useEffect(() => {
    if (props.dir < 0) {
      setTimeout(() => {
        console.log("blackout");
        setBlackOut(true);
      }, 4000);
    }
  }, [props.dir]);

  useEffect(() => {
    if (props.dir < 0) {
      if (blackout) {
        if (wall.act == "restart") {
          setTimeout(() => {
            setBlackOut(false);
            setTimeout(() => {
              dispatch({ type: "WALLBOOTED" });
            }, 4000);
          }, 2000);
        }
      }
    }
  }, [blackout]);

  return (
    <div className="bootscreen">
      <div className={blackout ? "hidden" : ""}>
        <BootLogo />
        <div className="mt-48" id="loader">
          <svg
            className="progressRing"
            height={48}
            width={48}
            viewBox="0 0 16 16"
          >
            <circle cx="8px" cy="8px" r="7px"></circle>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Пароль с экрана входа не подходит никогда: войти можно только через
// подсказку, «Сбросить пароль» и контрольные вопросы.

// answer: null — подходит любой непустой ответ
const SECURITY_QUESTIONS = [
  {
    question: "Здание, около которого мы впервые встретились?",
    placeholder: "Ответ на контрольный вопрос 1",
    answer: null,
  },
  {
    question: "Прозвище, которое ты дала своему парню?",
    placeholder: "Ответ на контрольный вопрос 2",
    answer: null,
  },
  {
    question: "Дата важного дня в твоей жизни?",
    placeholder: "ддммгггг",
    answer: "03112025",
    digits: true,
  },
];

const normalizeAnswer = (val, digits) =>
  digits
    ? val.replace(/\D/g, "")
    : val.trim().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ");

const answersCorrect = (answers) =>
  SECURITY_QUESTIONS.every((q, i) => {
    const given = normalizeAnswer(answers[i] || "", q.digits);
    if (!given) return false;
    return q.answer == null || given == normalizeAnswer(q.answer, q.digits);
  });

const randomDelay = (min, max) => min + Math.random() * (max - min);

// Пароль, при вводе которого с первой попытки на экране блокировки
// появляется уведомление (войти он всё равно не даёт)
const TOAST_PASSWORD = "03112025";

const WindowsLogo = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      fill="#3ea8f4"
      d="M0 0H48V48H0ZM52 0H100V48H52ZM0 52H48V100H0ZM52 52H100V100H52Z"
    />
  </svg>
);

// Уведомление Windows 11: сверху область атрибуции (значок и имя
// приложения, «…» и «✕»), ниже значок 48×48 слева, заголовок и текст
const LockToast = ({ show, onClose }) => (
  <div
    className="winToast"
    data-show={show}
    onClick={(e) => e.stopPropagation()}
  >
    <div className="winToastHead">
      <WindowsLogo size={16} />
      <span className="winToastApp">Windows</span>
      <div className="winToastBtn" title="Параметры">
        <Icon fafa="faEllipsisH" width={12} />
      </div>
      <div className="winToastBtn" title="Закрыть" onClick={onClose}>
        <Icon fafa="faTimes" width={12} />
      </div>
    </div>
    <div className="winToastVisual">
      <div className="winToastLogo">
        <svg viewBox="0 0 101 101" width="100%" height="100%" fill="#fff">
          <circle cx="50.5" cy="38.5" r="13" />
          <path d="M27.5 60A5 5 0 0 1 32.5 55H68.5A5 5 0 0 1 73.5 60V63.5A23 13.5 0 0 1 27.5 63.5Z" />
        </svg>
      </div>
      <div className="winToastTexts">
        <div className="winToastTitle">Ты большая молодец!</div>
        <div className="winToastText">Но я хочу тебе кое-что показать)</div>
      </div>
    </div>
  </div>
);

export const LockScreen = (props) => {
  const [lock, setLock] = useState(false);
  const [unlocked, setUnLock] = useState(false);
  const [password, setPass] = useState("");
  // "password" | "questions"
  const [mode, setMode] = useState("password");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [wrong, setWrong] = useState(null);
  const [forgotLink, setForgotLink] = useState(false);
  const [checking, setChecking] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [peek, setPeek] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [toast, setToast] = useState(false);
  const dispatch = useDispatch();

  const userName = useSelector((state) => state.setting.person.name);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKey = () => setLock(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  const action = (e) => {
    if (e.target.dataset.action == "splash") setLock(true);
  };

  const signIn = () => {
    setChecking(false);
    setWelcome(true);
    setTimeout(
      () => {
        setUnLock(true);
        setTimeout(() => {
          dispatch({ type: "WALLUNLOCK" });
        }, 1000);
      },
      randomDelay(1200, 3500),
    );
  };

  const proceed = () => {
    if (checking || welcome) return;

    setPeek(false);
    setChecking(true);

    const firstTry = attempts == 0 && password.trim() == TOAST_PASSWORD;
    setAttempts(attempts + 1);

    setTimeout(
      () => {
        setChecking(false);
        setWrong("password");
        setForgotLink(true);
        setPass("");
        if (firstTry) setToast(true);
      },
      randomDelay(700, 2500),
    );
  };

  const submitAnswers = () => {
    if (checking || welcome) return;

    setChecking(true);
    const ok = answersCorrect(answers);

    // иногда проверка проходит почти сразу, иногда «компьютер задумывается»
    const think =
      Math.random() < 0.3 ? randomDelay(200, 600) : randomDelay(800, 3000);

    setTimeout(() => {
      if (ok) {
        signIn();
      } else {
        setChecking(false);
        setWrong("answers");
      }
    }, think);
  };

  const peekOn = (e) => {
    e.preventDefault();
    setPeek(true);
  };

  const peekOff = () => setPeek(false);

  const action2 = (e) => {
    if (e.key == "Enter") proceed();
  };

  const answerKey = (i) => (e) => {
    if (e.key != "Enter") return;
    if (i < SECURITY_QUESTIONS.length - 1) {
      const next = document.getElementById("secAnswer" + (i + 1));
      if (next) next.focus();
    } else submitAnswers();
  };

  const setAnswer = (i, val) => {
    const tmp = [...answers];
    tmp[i] = val;
    setAnswers(tmp);
  };

  const openQuestions = () => {
    setMode("questions");
    setWrong(null);
  };

  const cancelQuestions = () => {
    setMode("password");
    setAnswers(["", "", ""]);
    setWrong(null);
  };

  const eyeIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5C6.5 5 2.7 9.4 1.6 11.4a1.3 1.3 0 0 0 0 1.2C2.7 14.6 6.5 19 12 19s9.3-4.4 10.4-6.4a1.3 1.3 0 0 0 0-1.2C21.3 9.4 17.5 5 12 5Zm0 12.5c-4.5 0-7.8-3.6-8.9-5.5C4.2 10.1 7.5 6.5 12 6.5s7.8 3.6 8.9 5.5c-1.1 1.9-4.4 5.5-8.9 5.5ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        fill="currentColor"
      />
    </svg>
  );

  const renderPassword = () => (
    <>
      <div className="passBox mt-6">
        {lock ? (
          <input
            type={peek ? "text" : "password"}
            value={password}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={action2}
            placeholder="Пароль"
            autoFocus
          />
        ) : null}
        {password.length ? (
          <div
            className="passEye"
            title="Показать пароль"
            onPointerDown={peekOn}
            onPointerUp={peekOff}
            onPointerLeave={peekOff}
          >
            {eyeIcon}
          </div>
        ) : null}
        <div className="passGo" onClick={proceed}>
          <Icon fafa="faArrowRight" width={14} />
        </div>
      </div>
      {forgotLink ? (
        <div className="lockLink mt-4" onClick={openQuestions}>
          Сбросить пароль
        </div>
      ) : null}
    </>
  );

  const renderQuestions = () => (
    <div className="secQuestions mt-4">
      {SECURITY_QUESTIONS.map((q, i) => (
        <React.Fragment key={i}>
          <div className="secQuestion">{q.question}</div>
          <div className="passBox">
            <input
              id={"secAnswer" + i}
              type="text"
              value={answers[i]}
              onChange={(e) => setAnswer(i, e.target.value)}
              onKeyDown={answerKey(i)}
              placeholder={q.placeholder}
              autoFocus={i == 0}
              autoComplete="off"
            />
            {i == SECURITY_QUESTIONS.length - 1 ? (
              <div className="passGo" onClick={submitAnswers}>
                <Icon fafa="faArrowRight" width={14} />
              </div>
            ) : null}
          </div>
        </React.Fragment>
      ))}
      <div className="lockLink mt-5" onClick={cancelQuestions}>
        Отмена
      </div>
    </div>
  );

  return (
    <div
      className={"lockscreen " + (props.dir == -1 ? "slowfadein" : "")}
      data-unlock={unlocked}
      style={{
        backgroundColor: "#000",
      }}
      onClick={action}
      data-action="splash"
      data-blur={lock}
    >
      <div className="splashScreen mt-40" data-faded={lock}>
        <div className="text-6xl font-semibold text-gray-100">
          {time.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Europe/Moscow",
          })}
        </div>
        <div className="text-lg font-medium text-gray-200">
          {time.toLocaleDateString("ru-RU", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "Europe/Moscow",
          })}
        </div>
      </div>
      <div
        className="fadeinScreen"
        data-faded={!lock}
        data-unlock={unlocked}
        data-mode={mode}
      >
        <div className="defAvatar">
          <svg viewBox="0 0 101 101" width="100%" height="100%" fill="#fff">
            <circle cx="50.5" cy="38.5" r="13" />
            <path d="M27.5 60A5 5 0 0 1 32.5 55H68.5A5 5 0 0 1 73.5 60V63.5A23 13.5 0 0 1 27.5 63.5Z" />
          </svg>
        </div>
        <div className="mt-5 text-2xl font-medium text-gray-200">
          {userName}
        </div>
        {welcome ? (
          <div className="flex flex-col items-center mt-6">
            <Spinner />
            <div className="mt-6 text-lg font-medium text-gray-100">
              Добро пожаловать
            </div>
          </div>
        ) : checking ? (
          <div className="mt-6">
            <Spinner />
          </div>
        ) : wrong ? (
          <>
            <div className="mt-6 text-sm text-gray-100 text-center px-4">
              {wrong == "answers"
                ? "Неверный ответ на один или несколько контрольных вопросов. Попробуйте ещё раз."
                : "Неверный пароль. Попробуйте ещё раз."}
            </div>
            <div
              className="flex items-center mt-6 signInBtn"
              onClick={() => setWrong(null)}
            >
              ОК
            </div>
          </>
        ) : mode == "questions" ? (
          renderQuestions()
        ) : (
          renderPassword()
        )}
      </div>
      <div className="bottomInfo flex">
        <Icon className="mx-2" src="wifi" ui width={16} invert />
        <Battery invert />
      </div>
      <LockToast show={toast} onClose={() => setToast(false)} />
    </div>
  );
};
