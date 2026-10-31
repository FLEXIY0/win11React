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
	// даже если Edge передал его другому своему процессу
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

func findBrowser() (path string, edge bool) {
	env := os.Getenv
	for _, p := range []string{
		filepath.Join(env("ProgramFiles(x86)"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(env("ProgramFiles"), `Microsoft\Edge\Application\msedge.exe`),
		filepath.Join(env("LocalAppData"), `Microsoft\Edge\Application\msedge.exe`),
	} {
		if _, err := os.Stat(p); err == nil {
			return p, true
		}
	}
	for _, p := range []string{
		filepath.Join(env("ProgramFiles"), `Google\Chrome\Application\chrome.exe`),
		filepath.Join(env("ProgramFiles(x86)"), `Google\Chrome\Application\chrome.exe`),
		filepath.Join(env("LocalAppData"), `Google\Chrome\Application\chrome.exe`),
	} {
		if _, err := os.Stat(p); err == nil {
			return p, false
		}
	}
	return "", false
}

// Фоновая копия: ждёт, снимает экран, открывает открытку на весь экран
// и закрывает браузер, когда открытка скажет /__exit
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

	browser, edge := findBrowser()
	log.Printf("браузер: %q", browser)
	var cmd *exec.Cmd
	profile := filepath.Join(os.TempDir(), "otkrytka-profile")
	if browser == "" {
		exec.Command("rundll32", "url.dll,FileProtocolHandler", s.url).Start()
	} else {
		os.RemoveAll(profile)
		args := []string{"--kiosk", s.url, "--no-first-run", "--no-default-browser-check",
			"--user-data-dir=" + profile, "--autoplay-policy=no-user-gesture-required"}
		if edge {
			args = append(args, "--edge-kiosk-type=fullscreen")
		}
		cmd = exec.Command(browser, args...)
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

	// Edge может передать окно другому своему процессу, поэтому ждём
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
