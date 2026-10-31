//go:build windows

package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unicode/utf16"
)

const title = "Восстановление системы"

func hidden(cmd *exec.Cmd) *exec.Cmd {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWindow}
	return cmd
}

// Окно ввода времени: стандартный InputBox через PowerShell.
// Пустой ответ — нажали «Отмена»
func askTime() (string, bool) {
	script := `Add-Type -AssemblyName Microsoft.VisualBasic
[Console]::OutputEncoding = [Text.Encoding]::UTF8
[Microsoft.VisualBasic.Interaction]::InputBox(` +
		`"Во сколько включить открытку?` + "`n`n" +
		`Введите время в формате ЧЧ:ММ, например 21:30.` + "`n" +
		`Оставьте «сейчас», чтобы включить сразу.", "Открытка", "сейчас")`
	u := utf16.Encode([]rune(script))
	b := make([]byte, len(u)*2)
	for i, c := range u {
		b[i*2] = byte(c)
		b[i*2+1] = byte(c >> 8)
	}
	out, err := hidden(exec.Command("powershell", "-NoProfile", "-NonInteractive",
		"-EncodedCommand", base64.StdEncoding.EncodeToString(b))).Output()
	if err != nil {
		return "сейчас", true
	}
	answer := strings.TrimSpace(string(out))
	return answer, answer != ""
}

func findBrowser() (path string, edge bool) {
	env := func(k string) string { return os.Getenv(k) }
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

func main() {
	procSetProcessDPIAware.Call()

	// время можно передать аргументом (для планировщика заданий):
	// otkrytka.exe 21:30
	var at time.Time
	for {
		var answer string
		if len(os.Args) > 1 {
			answer = strings.Join(os.Args[1:], " ")
		} else {
			var ok bool
			if answer, ok = askTime(); !ok {
				return
			}
		}
		t, err := parseStart(answer, time.Now())
		if err == nil {
			at = t
			break
		}
		messageBox(err.Error()+".\nВведите время в формате ЧЧ:ММ, например 21:30.",
			title, mbIconError)
		if len(os.Args) > 1 {
			return
		}
	}

	keepAwake()
	if time.Until(at) > 5*time.Second {
		day := "сегодня"
		if at.Day() != time.Now().Day() {
			day = "завтра"
		}
		messageBox(fmt.Sprintf("Открытка включится %s в %s.\n\n"+
			"Программа ждёт в фоне и не даст компьютеру уснуть. "+
			"Не выключайте компьютер и не выходите из системы.",
			day, at.Format("15:04")), "Открытка", mbIconInfo)
	}

	s, err := startServer()
	if err != nil {
		messageBox("Не удалось запустить открытку: "+err.Error(), title, mbIconError)
		return
	}

	// ждём по настенным часам: так ожидание переживёт сон компьютера
	for time.Now().Round(0).Before(at) {
		time.Sleep(time.Second)
	}

	if png, err := captureScreen(); err == nil {
		s.setDesktop(png)
	}

	browser, edge := findBrowser()
	if browser == "" {
		exec.Command("rundll32", "url.dll,FileProtocolHandler", s.url).Start()
		<-s.exit
		return
	}

	profile := filepath.Join(os.TempDir(), "otkrytka-profile")
	os.RemoveAll(profile)
	args := []string{"--kiosk", s.url, "--no-first-run", "--no-default-browser-check",
		"--user-data-dir=" + profile, "--autoplay-policy=no-user-gesture-required"}
	if edge {
		args = append(args, "--edge-kiosk-type=fullscreen")
	}
	cmd := exec.Command(browser, args...)
	if err := cmd.Start(); err != nil {
		messageBox("Не удалось открыть браузер: "+err.Error(), title, mbIconError)
		return
	}

	closed := make(chan struct{})
	go func() {
		cmd.Wait()
		close(closed)
	}()

	select {
	case <-s.exit:
		hidden(exec.Command("taskkill", "/PID", fmt.Sprint(cmd.Process.Pid), "/T", "/F")).Run()
	case <-closed:
	}
	time.Sleep(500 * time.Millisecond)
	os.RemoveAll(profile)
}
