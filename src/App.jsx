import { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import "./i18nextConf";
import "./index.css";

import ActMenu from "./components/menu";
import {
  BandPane,
  CalnWid,
  DesktopApp,
  SidePane,
  StartMenu,
  WidPane,
} from "./components/start";
import Taskbar from "./components/taskbar";
import {
  Background,
  BOOT_TIME,
  Bsod,
  BootScreen,
  LockScreen,
} from "./containers/background";

import { loadSettings } from "./actions";
import * as Applications from "./containers/applications";
import * as Drafts from "./containers/applications/draft";

function ErrorFallback({ error }) {
  return (
    <Bsod
      code={error.message || "CRITICAL_PROCESS_DIED"}
      onDone={() => window.location.reload()}
    />
  );
}

function App() {
  const apps = useSelector((state) => state.apps);
  const wall = useSelector((state) => state.wallpaper);
  const dispatch = useDispatch();

  const afterMath = (event) => {
    var ess = [
      ["START", "STARTHID"],
      ["BAND", "BANDHIDE"],
      ["PANE", "PANEHIDE"],
      ["WIDG", "WIDGHIDE"],
      ["CALN", "CALNHIDE"],
      ["MENU", "MENUHIDE"],
    ];

    var actionType = "";
    try {
      actionType = event.target.dataset.action || "";
    } catch (err) {}

    var actionType0 = getComputedStyle(event.target).getPropertyValue(
      "--prefix",
    );

    ess.forEach((item, i) => {
      if (!actionType.startsWith(item[0]) && !actionType0.startsWith(item[0])) {
        dispatch({
          type: item[1],
        });
      }
    });
  };

  window.oncontextmenu = (e) => {
    afterMath(e);
    e.preventDefault();
    // dispatch({ type: 'GARBAGE'});
    var data = {
      top: e.clientY,
      left: e.clientX,
    };

    if (e.target.dataset.menu != null) {
      data.menu = e.target.dataset.menu;
      data.attr = e.target.attributes;
      data.dataset = e.target.dataset;
      dispatch({
        type: "MENUSHOW",
        payload: data,
      });
    }
  };

  window.onclick = afterMath;

  // при первом запуске сначала «падает» синий экран
  const [crashed, setCrashed] = useState(true);

  useEffect(() => {
    if (!crashed && !window.onstart) {
      loadSettings();
      window.onstart = setTimeout(() => {
        // console.log("prematurely loading ( ﾉ ﾟｰﾟ)ﾉ");
        dispatch({ type: "WALLBOOTED" });
      }, BOOT_TIME);
    }
  });

  // после входа рабочий стол «догружается»: панель задач появляется
  // с задержкой, курсор какое-то время занят
  const [taskbarReady, setTaskbarReady] = useState(false);

  useEffect(() => {
    if (wall.locked) {
      setTaskbarReady(false);
      return;
    }
    document.body.style.cursor = "progress";
    const t1 = setTimeout(
      () => setTaskbarReady(true),
      900 + Math.random() * 900,
    );
    const t2 = setTimeout(
      () => (document.body.style.cursor = ""),
      2200 + Math.random() * 1200,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.cursor = "";
    };
  }, [wall.locked]);

  return (
    <div className="App">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {crashed ? <Bsod onDone={() => setCrashed(false)} /> : null}
        {!wall.booted ? <BootScreen dir={wall.dir} active={!crashed} /> : null}
        {wall.locked ? <LockScreen dir={wall.dir} /> : null}
        <div className="appwrap">
          <Background />
          <div className="desktop" data-menu="desk">
            <DesktopApp />
            {Object.keys(Applications).map((key, idx) => {
              var WinApp = Applications[key];
              return <WinApp key={idx} />;
            })}
            {Object.keys(apps)
              .filter((x) => x != "hz")
              .map((key) => apps[key])
              .map((app, i) => {
                if (app.pwa) {
                  var WinApp = Drafts[app.data.type];
                  return <WinApp key={i} icon={app.icon} {...app.data} />;
                }
              })}
            <StartMenu />
            <BandPane />
            <SidePane />
            <WidPane />
            <CalnWid />
          </div>
          {taskbarReady ? <Taskbar /> : null}
          <ActMenu />
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default App;
