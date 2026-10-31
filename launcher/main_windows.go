//go:build windows

package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

const (
	detachedProcess       = 0x00000008
	createNewProcessGroup = 0x00000200
	// заголовок вкладки сайта: по нему можно закрыть окно браузера,
	// даже если браузер передал его другому своему процессу
	pageTitle = "Win11 in React"
)

func hidden(cmd *exec.Cmd) *exec.Cmd {
	cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: createNoWindow}
	return cmd
}

func logPath() string { return filepath.Join(os.TempDir(), "otkrytka.log") }

// Запуск двойным щелчком: в окне консоли спрашиваем время, запускаем
// свою копию в фоне и закрываемся. Время можно передать аргументом
// (для планировщика заданий): otkrytka.exe 21:30
func main() {
	procSetProcessDPIAware.Call()
	if len(os.Args) > 2 && os.Args[1] == "--child" {
		at, err := time.Parse(time.RFC3339, os.Args[2])
		if err != nil {
			at = time.Now()
		}
		runChild(at)
		return
	}

	in := bufio.NewReader(os.Stdin)
	pause := func() {
		fmt.Print("\nНажмите Enter, чтобы закрыть окно.")
		in.ReadString('\n')
	}

	var at time.Time
	if len(os.Args) > 1 {
		t, err := parseStart(strings.Join(os.Args[1:], " "), time.Now())
		if err != nil {
			fmt.Println(err)
			pause()
			return
		}
		at = t
	} else {
		fmt.Println("Открытка")
		fmt.Println()
		for {
			fmt.Println("Во сколько включить? Введите время в формате ЧЧ:ММ, например 21:30.")
			fmt.Print("Или просто нажмите Enter, чтобы включить сейчас: ")
			line, _ := in.ReadString('\n')
			t, err := parseStart(line, time.Now())
			if err == nil {
				at = t
				break
			}
			fmt.Printf("%s. Попробуйте ещё раз.\n\n", err)
		}
	}

	self, err := os.Executable()
	if err == nil {
		cmd := exec.Command(self, "--child", at.Format(time.RFC3339))
		cmd.SysProcAttr = &syscall.SysProcAttr{
			CreationFlags: detachedProcess | createNewProcessGroup,
		}
		err = cmd.Start()
	}
	if err != nil {
		fmt.Println("\nНе удалось запустить открытку:", err)
		pause()
		return
	}

	fmt.Println()
	if time.Until(at) > 5*time.Second {
		day := "сегодня"
		if at.Day() != time.Now().Day() {
			day = "завтра"
		}
		fmt.Printf("Открытка включится %s в %s.\n", day, at.Format("15:04"))
		fmt.Println("Программа ждёт в фоне и не даст компьютеру уснуть.")
		fmt.Println("Не выключайте компьютер и не выходите из системы.")
	} else {
		fmt.Println("Открытка включается…")
	}
	fmt.Println("Журнал работы:", logPath())
	fmt.Println("\nЭто окно закроется само.")
	time.Sleep(6 * time.Second)
}

type browserKind int

const (
	kindEdge browserKind = iota
	kindChromium
	kindFirefox
)

// Запасной путь, если WebView2 недоступен: установленный браузер,
// который умеет полноэкранный режим без рамок (--kiosk): сначала Edge,
// потом популярные Chromium-браузеры, потом Zen и Firefox
func findBrowser() (string, browserKind) {
	env := os.Getenv
	pf, pf86, local := env("ProgramFiles"), env("ProgramFiles(x86)"), env("LocalAppData")
	candidates := []struct {
		path string
		kind browserKind
	}{
		{filepath.Join(pf86, `Microsoft\Edge\Application\msedge.exe`), kindEdge},
		{filepath.Join(pf, `Microsoft\Edge\Application\msedge.exe`), kindEdge},
		{filepath.Join(local, `Microsoft\Edge\Application\msedge.exe`), kindEdge},
		{filepath.Join(local, `Yandex\YandexBrowser\Application\browser.exe`), kindChromium},
		{filepath.Join(pf, `Yandex\YandexBrowser\Application\browser.exe`), kindChromium},
		{filepath.Join(pf86, `Yandex\YandexBrowser\Application\browser.exe`), kindChromium},
		{filepath.Join(pf, `Google\Chrome\Application\chrome.exe`), kindChromium},
		{filepath.Join(pf86, `Google\Chrome\Application\chrome.exe`), kindChromium},
		{filepath.Join(local, `Google\Chrome\Application\chrome.exe`), kindChromium},
		{filepath.Join(pf, `BraveSoftware\Brave-Browser\Application\brave.exe`), kindChromium},
		{filepath.Join(local, `BraveSoftware\Brave-Browser\Application\brave.exe`), kindChromium},
		{filepath.Join(local, `Vivaldi\Application\vivaldi.exe`), kindChromium},
		{filepath.Join(pf, `Vivaldi\Application\vivaldi.exe`), kindChromium},
		{filepath.Join(local, `Programs\Opera\opera.exe`), kindChromium},
		{filepath.Join(local, `Programs\Opera GX\opera.exe`), kindChromium},
		{filepath.Join(pf, `Zen Browser\zen.exe`), kindFirefox},
		{filepath.Join(local, `Zen Browser\zen.exe`), kindFirefox},
		{filepath.Join(local, `Programs\Zen Browser\zen.exe`), kindFirefox},
		{filepath.Join(pf, `Mozilla Firefox\firefox.exe`), kindFirefox},
		{filepath.Join(pf86, `Mozilla Firefox\firefox.exe`), kindFirefox},
	}
	for _, c := range candidates {
		if _, err := os.Stat(c.path); err == nil {
			return c.path, c.kind
		}
	}
	return "", kindChromium
}

func browserArgs(kind browserKind, url, profile string) []string {
	if kind == kindFirefox {
		return []string{"-kiosk", "-no-remote", "-profile", profile, url}
	}
	args := []string{"--kiosk", url, "--no-first-run", "--no-default-browser-check",
		"--user-data-dir=" + profile, "--autoplay-policy=no-user-gesture-required",
		"--lang=ru", "--disable-features=Translate,msEdgeTranslate"}
	if kind == kindEdge {
		args = append(args, "--edge-kiosk-type=fullscreen")
	}
	return args
}

// Фоновая копия: ждёт, снимает экран, открывает открытку на весь экран
// (в своём окне WebView2, а если его нет — в браузере) и закрывает окно,
// когда открытка скажет /__exit
func runChild(at time.Time) {
	if f, err := os.Create(logPath()); err == nil {
		defer f.Close()
		log.SetOutput(f)
	}
	log.Printf("запуск в %s", at.Format("02.01.2006 15:04:05"))

	keepAwake()
	s, err := startServer()
	if err != nil {
		log.Printf("сервер не запустился: %v", err)
		messageBox("Не удалось запустить открытку: "+err.Error(), "Открытка", mbIconError)
		return
	}
	log.Printf("сервер: %s", s.url)

	// ждём по настенным часам: так ожидание переживёт сон компьютера
	for time.Now().Round(0).Before(at) {
		time.Sleep(time.Second)
	}

	if png, err := captureScreen(); err == nil {
		s.setDesktop(png)
		log.Printf("снимок экрана: %d байт", len(png))
	} else {
		log.Printf("снимок экрана не получился: %v", err)
	}

	if runWebView(s) {
		log.Printf("готово")
		return
	}

	browser, kind := findBrowser()
	log.Printf("браузер: %q", browser)
	var cmd *exec.Cmd
	profile := filepath.Join(os.TempDir(), "otkrytka-profile")
	if browser == "" {
		// подходящего браузера нет: открываем в браузере по умолчанию
		// и сами нажимаем F11, чтобы развернуть на весь экран
		exec.Command("rundll32", "url.dll,FileProtocolHandler", s.url).Start()
		time.Sleep(4 * time.Second)
		pressF11()
	} else {
		os.RemoveAll(profile)
		os.MkdirAll(profile, 0o755)
		cmd = exec.Command(browser, browserArgs(kind, s.url, profile)...)
		if err := cmd.Start(); err != nil {
			log.Printf("браузер не запустился: %v", err)
			messageBox("Не удалось открыть браузер: "+err.Error(), "Открытка", mbIconError)
			return
		}
		go func() {
			err := cmd.Wait()
			log.Printf("процесс браузера завершился: %v", err)
		}()
	}

	// браузер может передать окно другому своему процессу, поэтому ждём
	// сигнала от открытки, а не завершения процесса
	select {
	case <-s.exit:
		log.Printf("открытка попросила закрыться")
	case <-time.After(6 * time.Hour):
		log.Printf("время ожидания вышло")
	}
	if cmd != nil && cmd.Process != nil {
		hidden(exec.Command("taskkill", "/PID", fmt.Sprint(cmd.Process.Pid), "/T", "/F")).Run()
	}
	hidden(exec.Command("taskkill", "/F", "/FI", "WINDOWTITLE eq "+pageTitle+"*")).Run()
	time.Sleep(time.Second)
	os.RemoveAll(profile)
	log.Printf("готово")
}
