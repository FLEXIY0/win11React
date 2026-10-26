import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { changeTheme } from "../../../actions";
import { Image, ToolBar } from "../../../utils/general";
import LangSwitch from "./assets/Langswitch";
import "./assets/settings.scss";
import data from "./assets/settingsData.json";

const pageNames = {
  System: "Система",
  "Bluetooth & devices": "Bluetooth и устройства",
  "Network & internet": "Сеть и Интернет",
  Personalisation: "Персонализация",
  Apps: "Приложения",
  Accounts: "Учётные записи",
  "Time & language": "Время и язык",
  Gaming: "Игры",
  Accessibility: "Специальные возможности",
  "Privacy & security": "Конфиденциальность и защита",
  "Windows Update": "Центр обновления Windows",
};

export const Settings = () => {
  const wnapp = useSelector((state) => state.apps.settings);
  const theme = useSelector((state) => state.setting.person.theme);
  const dispatch = useDispatch();

  const wall = useSelector((state) => state.wallpaper);

  const [page, setPage] = useState("System"); // default System
  const [nav, setNav] = useState("");
  const [updating, setUpdating] = useState(false);
  const [upmodalOpen, setUpmodalOpen] = useState(false);

  const themechecker = {
    default: "light",
    dark: "dark",
    ThemeA: "dark",
    ThemeB: "dark",
    ThemeD: "light",
    ThemeC: "light",
  };

  const handleWallAndTheme = (e) => {
    var payload = e.target.dataset.payload;
    var theme_nxt = themechecker[payload.split("/")[0]],
      src = payload;

    if (theme_nxt != theme) {
      changeTheme();
    }

    dispatch({
      type: "WALLSET",
      payload: src,
    });
  };

  const userName = useSelector((state) => state.setting.person.name);

  return (
    <div
      className="settingsApp floatTab dpShad"
      data-size={wnapp.size}
      data-max={wnapp.max}
      style={{
        ...(wnapp.size == "cstm" ? wnapp.dim : null),
        zIndex: wnapp.z,
      }}
      data-hide={wnapp.hide}
      id={wnapp.icon + "App"}
    >
      <ToolBar
        app={wnapp.action}
        icon={wnapp.icon}
        size={wnapp.size}
        name="Параметры"
      />
      <div className="windowScreen flex flex-col" data-dock="true">
        <div className="restWindow flex-grow flex flex-col">
          <nav className={nav}>
            <div className="nav_top">
              <div className="account" onClick={() => setPage("Accounts")}>
                <img
                  src="img/settings/defAccount.webp"
                  alt=""
                  height={60}
                  width={60}
                />
                <div>
                  <p>{userName}</p>
                  <p>Локальная учётная запись</p>
                </div>
              </div>
              <input
                type="text"
                className="search"
                placeholder="Найти параметр"
                name="search"
              />
            </div>
            <div className="nav_bottom win11Scroll">
              {Object.keys(data).map((e) => {
                return (
                  <div
                    key={e}
                    className={`navLink ${e === page ? "selected" : ""}`}
                    onClick={() => {
                      // avoid inline functions
                      setPage(e);
                    }}
                  >
                    <img
                      src={`img/settings/${e}.webp`}
                      alt=""
                      height={16}
                      width={16}
                    />
                    {pageNames[e] || e}
                  </div>
                );
              })}
              <div className="marker"></div>
            </div>
          </nav>

          {Object.keys(data).map((e) => {
            return (
              page === e && (
                <main key={e}>
                  <h1>{pageNames[e] || e}</h1>
                  <div className="tilesCont win11Scroll">
                    {data[e].map((e, i) => {
                      switch (e.type) {
                        case "sysTop":
                          return (
                            <div key={i} className={e.type}>
                              <div className="left">
                                <img
                                  src={`img/wallpaper/${wall.src}`}
                                  alt=""
                                  className="device_img"
                                />
                                <div className="column_device">
                                  <p className="device_name">Liber-V</p>
                                  <p className="device_model">NS14A8</p>
                                  <p className="device_rename">Переименовать</p>
                                </div>
                              </div>
                              <div className="right">
                                <div className="column">
                                  <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/25/Microsoft_icon.svg"
                                    height={20}
                                    alt=""
                                  />
                                  <p>
                                    Microsoft 365
                                    <br />
                                    <span className="column_lower">
                                      Просмотреть преимущества
                                    </span>
                                  </p>
                                </div>
                                <div
                                  className="column"
                                  onClick={() => setPage("Windows Update")}
                                >
                                  <img
                                    src="img/settings/Windows Update.webp"
                                    alt=""
                                    height={20}
                                  />
                                  <p>
                                    Центр обновления Windows
                                    <br />
                                    <span className="column_lower">
                                      Установлены все обновления
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        case "netTop":
                          return (
                            <div key={i} className="netTop">
                              <div>
                                <img
                                  src="img/settings/wifi.png"
                                  alt=""
                                  height={100}
                                />
                                <div>
                                  <h2 className="font-medium text-lg">Wi-Fi</h2>
                                  <p>Подключено, защищено</p>
                                </div>
                              </div>
                              <div className="box">
                                <span className="settingsIcon"></span>
                                <div>
                                  <h3>Свойства</h3>
                                  <p>Общедоступная сеть 5 ГГц</p>
                                </div>
                              </div>
                              <div className="box">
                                <span className="settingsIcon"></span>
                                <div>
                                  <h3>Использование данных</h3>
                                  <p>
                                    {Math.round(Math.random() * 100)} ГБ за
                                    последние 30 дней
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        case "personaliseTop":
                          return (
                            <div key={i} className="personaliseTop">
                              <img
                                className="mainImg"
                                src={`img/wallpaper/${wall.src}`}
                                alt=""
                              />
                              <div>
                                <h3>Выберите тему</h3>
                                <div className="bgBox">
                                  {wall.themes.map((e, i) => {
                                    return (
                                      <Image
                                        key={i}
                                        className={
                                          wall.src.includes(e) ? "selected" : ""
                                        }
                                        src={`img/wallpaper/${e}/img0.jpg`}
                                        ext
                                        onClick={handleWallAndTheme}
                                        click="WALLSET"
                                        payload={`${e}/img0.jpg`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        case "accountsTop":
                          return (
                            <div key={i} className="accountsTop ">
                              <img
                                src="img/settings/defAccount.webp"
                                alt=""
                                width={90}
                              />
                              <div>
                                <p>{userName.toUpperCase()}</p>
                                <p>Локальная учётная запись</p>
                                <p>Администратор</p>
                              </div>
                            </div>
                          );
                        case "timeTop":
                          return (
                            <div className="timeTop">
                              <h1>
                                {new Date().toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "Europe/Moscow",
                                })}
                              </h1>
                            </div>
                          );
                        case "langSwitcher":
                          return (
                            <div key={i} className="tile langSwitcherTile">
                              <span className="settingsIcon"></span>
                              <div className="tile_content">
                                <p>Язык интерфейса Windows</p>
                                <p className="tile_desc">
                                  Параметры, Проводник и другие компоненты
                                  Windows будут отображаться на этом языке
                                </p>
                              </div>
                              <LangSwitch />
                            </div>
                          );
                        case "updateTop":
                          return (
                            <div key={i} className="updateTop">
                              <div className="left">
                                <img
                                  src="img/settings/update.png"
                                  width={90}
                                  alt=""
                                />
                                <div>
                                  <h2>Установлены все обновления</h2>
                                  <p>Последняя проверка: сегодня</p>
                                </div>
                              </div>
                              <div className="right">
                                <div
                                  className="btn"
                                  onClick={() => {
                                    setUpdating(true);
                                    setTimeout(() => {
                                      setUpdating(false);
                                      setUpmodalOpen(true);
                                    }, Math.random() * 2000);
                                  }}
                                >
                                  {updating
                                    ? "Проверка обновлений..."
                                    : "Проверить наличие обновлений"}
                                </div>
                              </div>
                            </div>
                          );

                        case "subHeading":
                        case "spacer":
                          return (
                            <div key={i} className={e.type}>
                              {e.name}
                            </div>
                          );
                        case "tile":
                        case "tile square":
                        case "tile thin-blue":
                          return (
                            <div key={e.name} className={e.type}>
                              <span className="settingsIcon">{e.icon}</span>
                              <div>
                                <p>{e.name}</p>
                                <p className="tile_desc">{e.desc}</p>
                              </div>
                            </div>
                          );
                        default:
                          return console.log(
                            `error - type ${e.type} not found`,
                          );
                      }
                    })}
                  </div>
                </main>
              )
            );
          })}

          {upmodalOpen && (
            <>
              <div className="absolute z-30 bg-black bg-opacity-60 h-full w-full top-0 left-0"></div>

              <div
                className="absolute top-[50%] left-[50%] z-50 rounded"
                style={{
                  transform: `translateX(-50%) translateY(-50%)`,
                  background: `var(--wintheme)`,
                  padding: `1.5rem`,
                }}
              >
                <h1
                  style={{
                    marginBottom: `10px`,
                  }}
                  className="text-2xl font-semibold"
                >
                  Требуется перезагрузка
                </h1>
                <p>
                  Некоторые изменения вступят в силу только после перезагрузки
                  устройства.
                </p>

                <div
                  className="flex"
                  style={{
                    marginTop: `14px`,
                  }}
                >
                  <button
                    style={{
                      padding: "10px",
                      backgroundColor: "var(--clrPrm)",
                      color: "var(--alt-txt)",
                      marginRight: "10px",
                    }}
                    onClick={() => {
                      // Clear the cache and reload the page
                      window.location =
                        window.location.href + `?clearCache=${Math.random()}`;
                    }}
                    className="flex-1 rounded border-none hover:opacity-95"
                  >
                    Перезагрузить сейчас
                  </button>
                  <button
                    style={{
                      padding: "10px",
                      color: "var(--sat-txt)",
                    }}
                    className="flex-1 rounded border"
                    onClick={() => {
                      setUpmodalOpen(false);
                    }}
                  >
                    Перезагрузить позже
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="navMenuBtn" onClick={() => setNav(nav ? "" : "open")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 48 48"
              width={24}
              height={24}
            >
              <path d="M5.5 9a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37zm0 13.5a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37zm0 13.5a1.5 1.5 0 1 0 0 3h37a1.5 1.5 0 1 0 0-3h-37z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
