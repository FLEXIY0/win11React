import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Battery from "../../components/shared/Battery";
import { Icon, Image } from "../../utils/general";
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
        <Image src="asset/bootlogo" w={180} />
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

// Заглушка: пароль для входа на экране блокировки
const LOCK_PASSWORD = "03112025";

const randomDelay = (min, max) => min + Math.random() * (max - min);

const Spinner = () => (
  <svg className="progressRing" height={32} width={32} viewBox="0 0 16 16">
    <circle cx="8px" cy="8px" r="7px"></circle>
  </svg>
);

export const LockScreen = (props) => {
  const wall = useSelector((state) => state.wallpaper);
  const [lock, setLock] = useState(false);
  const [unlocked, setUnLock] = useState(false);
  const [password, setPass] = useState("");
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [peek, setPeek] = useState(false);
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

  const action = (e) => {
    if (e.target.dataset.action == "splash") setLock(true);
  };

  const proceed = () => {
    if (checking || welcome) return;

    setPeek(false);
    setChecking(true);

    if (password != LOCK_PASSWORD) {
      setTimeout(
        () => {
          setChecking(false);
          setWrong(true);
          setPass("");
        },
        randomDelay(700, 2500),
      );
      return;
    }

    // иногда вход проходит почти сразу, иногда «компьютер задумывается»
    const think =
      Math.random() < 0.3 ? randomDelay(200, 600) : randomDelay(800, 3000);

    setTimeout(() => {
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
      <div className="fadeinScreen" data-faded={!lock} data-unlock={unlocked}>
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
          <div className="flex items-center mt-6 gap-4 text-xl text-gray-100">
            <Spinner />
            Добро пожаловать
          </div>
        ) : checking ? (
          <div className="mt-6">
            <Spinner />
          </div>
        ) : wrong ? (
          <>
            <div className="mt-6 text-sm text-gray-100">
              Неверный пароль. Попробуйте ещё раз.
            </div>
            <div
              className="flex items-center mt-6 signInBtn"
              onClick={() => setWrong(false)}
            >
              ОК
            </div>
          </>
        ) : (
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5C6.5 5 2.7 9.4 1.6 11.4a1.3 1.3 0 0 0 0 1.2C2.7 14.6 6.5 19 12 19s9.3-4.4 10.4-6.4a1.3 1.3 0 0 0 0-1.2C21.3 9.4 17.5 5 12 5Zm0 12.5c-4.5 0-7.8-3.6-8.9-5.5C4.2 10.1 7.5 6.5 12 6.5s7.8 3.6 8.9 5.5c-1.1 1.9-4.4 5.5-8.9 5.5ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 6.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            ) : null}
            <div className="passGo" onClick={proceed}>
              <Icon fafa="faArrowRight" width={14} />
            </div>
          </div>
        )}
      </div>
      <div className="bottomInfo flex">
        <Icon className="mx-2" src="wifi" ui width={16} invert />
        <Battery invert />
      </div>
    </div>
  );
};
