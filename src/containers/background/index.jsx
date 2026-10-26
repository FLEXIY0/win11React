import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Battery from "../../components/shared/Battery";
import { Icon } from "../../utils/general";
import "./back.scss";

const randomDelay = (min, max) => min + Math.random() * (max - min);

// Надписи безопасного режима: по углам и номер сборки сверху
const SAFE_MODE_BUILD =
  "Microsoft (R) Windows (R) (Build 26100.ge_release.240331-1435)";

export const Background = () => {
  return (
    <div
      className="background"
      style={{
        backgroundColor: "#000",
      }}
    >
      <div className="safeMode safeTL">Безопасный режим</div>
      <div className="safeMode safeTR">Безопасный режим</div>
      <div className="safeMode safeBL">Безопасный режим</div>
      <div className="safeMode safeBR">Безопасный режим</div>
      <div className="safeMode safeBuild">{SAFE_MODE_BUILD}</div>
    </div>
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

// QR-код на https://www.windows.com/stopcode
const STOPCODE_QR =
  "M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM8 0h1v1h-1zM9 0h1v1h-1zM11 0h1v1h-1zM13 0h1v1h-1zM15 0h1v1h-1zM16 0h1v1h-1zM18 0h1v1h-1zM19 0h1v1h-1zM20 0h1v1h-1zM21 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM10 1h1v1h-1zM16 1h1v1h-1zM18 1h1v1h-1zM24 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM8 2h1v1h-1zM9 2h1v1h-1zM14 2h1v1h-1zM18 2h1v1h-1zM20 2h1v1h-1zM21 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM11 3h1v1h-1zM13 3h1v1h-1zM14 3h1v1h-1zM16 3h1v1h-1zM18 3h1v1h-1zM20 3h1v1h-1zM21 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM11 4h1v1h-1zM13 4h1v1h-1zM15 4h1v1h-1zM16 4h1v1h-1zM18 4h1v1h-1zM20 4h1v1h-1zM21 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM8 5h1v1h-1zM10 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM18 5h1v1h-1zM24 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM19 6h1v1h-1zM20 6h1v1h-1zM21 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM9 7h1v1h-1zM10 7h1v1h-1zM11 7h1v1h-1zM14 7h1v1h-1zM15 7h1v1h-1zM0 8h1v1h-1zM1 8h1v1h-1zM4 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM9 8h1v1h-1zM10 8h1v1h-1zM14 8h1v1h-1zM19 8h1v1h-1zM21 8h1v1h-1zM22 8h1v1h-1zM23 8h1v1h-1zM24 8h1v1h-1zM3 9h1v1h-1zM5 9h1v1h-1zM8 9h1v1h-1zM11 9h1v1h-1zM14 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM17 9h1v1h-1zM20 9h1v1h-1zM21 9h1v1h-1zM23 9h1v1h-1zM0 10h1v1h-1zM2 10h1v1h-1zM3 10h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM11 10h1v1h-1zM12 10h1v1h-1zM13 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM16 10h1v1h-1zM19 10h1v1h-1zM20 10h1v1h-1zM21 10h1v1h-1zM22 10h1v1h-1zM0 11h1v1h-1zM1 11h1v1h-1zM5 11h1v1h-1zM7 11h1v1h-1zM8 11h1v1h-1zM9 11h1v1h-1zM12 11h1v1h-1zM18 11h1v1h-1zM19 11h1v1h-1zM22 11h1v1h-1zM23 11h1v1h-1zM0 12h1v1h-1zM2 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM11 12h1v1h-1zM12 12h1v1h-1zM15 12h1v1h-1zM17 12h1v1h-1zM18 12h1v1h-1zM21 12h1v1h-1zM22 12h1v1h-1zM23 12h1v1h-1zM24 12h1v1h-1zM0 13h1v1h-1zM1 13h1v1h-1zM3 13h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1zM11 13h1v1h-1zM13 13h1v1h-1zM14 13h1v1h-1zM15 13h1v1h-1zM16 13h1v1h-1zM17 13h1v1h-1zM20 13h1v1h-1zM23 13h1v1h-1zM6 14h1v1h-1zM8 14h1v1h-1zM9 14h1v1h-1zM10 14h1v1h-1zM11 14h1v1h-1zM13 14h1v1h-1zM15 14h1v1h-1zM19 14h1v1h-1zM20 14h1v1h-1zM21 14h1v1h-1zM22 14h1v1h-1zM2 15h1v1h-1zM3 15h1v1h-1zM4 15h1v1h-1zM8 15h1v1h-1zM10 15h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM14 15h1v1h-1zM15 15h1v1h-1zM16 15h1v1h-1zM18 15h1v1h-1zM19 15h1v1h-1zM20 15h1v1h-1zM22 15h1v1h-1zM23 15h1v1h-1zM0 16h1v1h-1zM1 16h1v1h-1zM5 16h1v1h-1zM6 16h1v1h-1zM7 16h1v1h-1zM8 16h1v1h-1zM10 16h1v1h-1zM15 16h1v1h-1zM16 16h1v1h-1zM17 16h1v1h-1zM18 16h1v1h-1zM19 16h1v1h-1zM20 16h1v1h-1zM21 16h1v1h-1zM22 16h1v1h-1zM8 17h1v1h-1zM9 17h1v1h-1zM11 17h1v1h-1zM14 17h1v1h-1zM16 17h1v1h-1zM20 17h1v1h-1zM0 18h1v1h-1zM1 18h1v1h-1zM2 18h1v1h-1zM3 18h1v1h-1zM4 18h1v1h-1zM5 18h1v1h-1zM6 18h1v1h-1zM9 18h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM13 18h1v1h-1zM14 18h1v1h-1zM16 18h1v1h-1zM18 18h1v1h-1zM20 18h1v1h-1zM0 19h1v1h-1zM6 19h1v1h-1zM8 19h1v1h-1zM9 19h1v1h-1zM10 19h1v1h-1zM14 19h1v1h-1zM16 19h1v1h-1zM20 19h1v1h-1zM21 19h1v1h-1zM22 19h1v1h-1zM23 19h1v1h-1zM0 20h1v1h-1zM2 20h1v1h-1zM3 20h1v1h-1zM4 20h1v1h-1zM6 20h1v1h-1zM8 20h1v1h-1zM9 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM18 20h1v1h-1zM19 20h1v1h-1zM20 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM24 20h1v1h-1zM0 21h1v1h-1zM2 21h1v1h-1zM3 21h1v1h-1zM4 21h1v1h-1zM6 21h1v1h-1zM10 21h1v1h-1zM11 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM18 21h1v1h-1zM19 21h1v1h-1zM22 21h1v1h-1zM0 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM6 22h1v1h-1zM10 22h1v1h-1zM11 22h1v1h-1zM12 22h1v1h-1zM14 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM18 22h1v1h-1zM21 22h1v1h-1zM23 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM12 23h1v1h-1zM14 23h1v1h-1zM18 23h1v1h-1zM19 23h1v1h-1zM20 23h1v1h-1zM21 23h1v1h-1zM22 23h1v1h-1zM23 23h1v1h-1zM0 24h1v1h-1zM1 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM5 24h1v1h-1zM6 24h1v1h-1zM8 24h1v1h-1zM9 24h1v1h-1zM11 24h1v1h-1zM12 24h1v1h-1zM14 24h1v1h-1zM15 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM24 24h1v1h-1z";

// Синий экран при первом запуске: проценты доходят до 100, затем
// экран гаснет и компьютер «перезагружается»
export const Bsod = ({ onDone, code = "CRITICAL_PROCESS_DIED" }) => {
  const [percent, setPercent] = useState(0);
  const [blackout, setBlackout] = useState(false);

  useEffect(() => {
    let timer;
    // одно случайное «подвисание» где-то посередине
    const stallAt = Math.round(randomDelay(30, 75));
    let stalled = false;

    const step = (cur) => {
      if (cur >= 100) {
        // 100% ещё немного висит, потом экран гаснет и долго остаётся чёрным
        timer = setTimeout(
          () => {
            setBlackout(true);
            timer = setTimeout(onDone, randomDelay(3500, 5000));
          },
          randomDelay(1500, 2500),
        );
        return;
      }

      let wait = randomDelay(800, 3200);
      if (cur == 0) wait = randomDelay(5000, 8000);
      else if (!stalled && cur >= stallAt) {
        stalled = true;
        wait = randomDelay(6000, 10000);
      }

      timer = setTimeout(() => {
        // в основном маленькие шаги, иногда рывок
        const inc =
          Math.random() < 0.15
            ? Math.round(randomDelay(10, 20))
            : Math.round(randomDelay(1, 8));
        const next = Math.min(100, cur + inc);
        setPercent(next);
        step(next);
      }, wait);
    };
    step(0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bsod" data-blackout={blackout}>
      {!blackout ? (
        <div className="bsodCont">
          <div className="bsodFace">:(</div>
          <div className="bsodText">
            На вашем ПК возникла проблема, и его необходимо перезагрузить. Мы
            лишь собираем некоторые сведения об ошибке, а затем будет
            автоматически выполнен перезапуск.
          </div>
          <div className="bsodText bsodPercent">{percent}% завершено</div>
          <div className="bsodInfo">
            <svg className="bsodQr" viewBox="-2 -2 29 29">
              <rect x="-2" y="-2" width="29" height="29" fill="#fff" />
              <path d={STOPCODE_QR} fill="#0078d7" />
            </svg>
            <div>
              <div>
                Дополнительные сведения об этой ошибке и возможных исправлениях
                можно найти на странице https://www.windows.com/stopcode
              </div>
              <div className="bsodSupport">
                Если вы будете звонить в службу поддержки, сообщите им следующие
                сведения:
                <br />
                Код остановки: {code}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// сколько длится экран загрузки после синего экрана
export const BOOT_TIME = 9000;

export const BootScreen = (props) => {
  const dispatch = useDispatch();
  const wall = useSelector((state) => state.wallpaper);
  const [blackout, setBlackOut] = useState(false);
  // «шероховатости» первого запуска: чёрная пауза, логотип без кольца,
  // мигание при смене разрешения, чёрный экран перед экраном входа
  const [stage, setStage] = useState(props.dir < 0 ? "logo" : "black");
  const [ring, setRing] = useState(props.dir < 0);
  const [rescaled, setRescaled] = useState(false);

  useEffect(() => {
    if (!props.active || props.dir < 0) return;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const logoAt = randomDelay(800, 1500);
    const glitchAt = randomDelay(3500, 4500);
    const glitchLen = randomDelay(120, 350);

    at(logoAt, () => setStage("logo"));
    at(logoAt + randomDelay(1200, 2200), () => setRing(true));
    at(glitchAt, () => setStage("black"));
    at(glitchAt + glitchLen, () => {
      setRescaled(true);
      setStage("logo");
    });
    at(BOOT_TIME - randomDelay(700, 1100), () => setStage("black"));
    return () => timers.forEach(clearTimeout);
  }, [props.active]);

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
      <div
        className={blackout || stage == "black" ? "hidden" : ""}
        data-rescaled={rescaled}
      >
        <BootLogo />
        <div className="mt-48" id="loader" data-hide={!ring}>
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
  const booted = useSelector((state) => state.wallpaper.booted);
  const [time, setTime] = useState(new Date());
  // после загрузки экран блокировки «просыпается» не сразу: долгая
  // чернота, часы, короткое мигание, потом значки внизу
  const bootedAtMount = useRef(booted).current;
  const ready = useRef(false);
  const [clockOn, setClockOn] = useState(false);
  const [iconsOn, setIconsOn] = useState(false);
  const [credsOn, setCredsOn] = useState(false);

  useEffect(() => {
    if (!booted) return;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const clockAt = bootedAtMount
      ? randomDelay(400, 900)
      : randomDelay(2500, 4000);
    const flickAt = clockAt + randomDelay(600, 1200);

    at(clockAt, () => {
      ready.current = true;
      setClockOn(true);
    });
    at(flickAt, () => setClockOn(false));
    at(flickAt + randomDelay(100, 250), () => setClockOn(true));
    at(clockAt + randomDelay(1000, 2000), () => setIconsOn(true));
    return () => timers.forEach(clearTimeout);
  }, [booted]);

  // поле пароля подгружается чуть позже аватара и имени
  useEffect(() => {
    if (!lock) return;
    const timer = setTimeout(() => setCredsOn(true), randomDelay(500, 1100));
    return () => clearTimeout(timer);
  }, [lock]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKey = () => ready.current && setLock(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  const action = (e) => {
    if (e.target.dataset.action == "splash" && ready.current) setLock(true);
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
      <div
        className="splashScreen mt-40"
        data-faded={lock}
        style={{ visibility: clockOn ? "visible" : "hidden" }}
      >
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
        ) : !credsOn ? null : mode == "questions" ? (
          renderQuestions()
        ) : (
          renderPassword()
        )}
      </div>
      <div
        className="bottomInfo flex"
        style={{ visibility: iconsOn ? "visible" : "hidden" }}
      >
        <Icon className="mx-2" src="wifi" ui width={16} invert />
        <Battery invert />
      </div>
      <LockToast show={toast} onClose={() => setToast(false)} />
    </div>
  );
};
