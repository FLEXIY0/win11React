//go:build windows

package main

import (
	"log"
	"os"
	"path/filepath"
	"runtime"

	webview2 "github.com/jchv/go-webview2"
	"github.com/jchv/go-webview2/webviewloader"
)

// окно WebView2 должно создаваться и обрабатывать сообщения в одном потоке
func init() { runtime.LockOSThread() }

var (
	procSetWindowLongPtrW = user32.NewProc("SetWindowLongPtrW")
	procSetWindowPos      = user32.NewProc("SetWindowPos")
)

const (
	gwlStyle        = ^uintptr(15) // -16
	hwndTopmost     = ^uintptr(0)  // -1
	wsPopup         = 0x80000000
	wsVisible       = 0x10000000
	swpFrameChanged = 0x0020
	swpShowWindow   = 0x0040
)

// Открытка в собственном окне на движке WebView2 (он встроен в Windows 11
// и не зависит от браузера): окно без рамок на весь экран поверх панели
// задач. Возвращает false, если WebView2 недоступен
func runWebView(s *server) bool {
	version, err := webviewloader.GetInstalledVersion()
	if err != nil || version == "" {
		log.Printf("WebView2 недоступен: %v", err)
		return false
	}
	log.Printf("WebView2 %s", version)

	// чёрный фон, пока страница грузится, русский язык, без перевода
	os.Setenv("WEBVIEW2_DEFAULT_BACKGROUND_COLOR", "FF000000")
	os.Setenv("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
		"--autoplay-policy=no-user-gesture-required --lang=ru --disable-features=Translate")

	sw, _, _ := procGetSystemMetrics.Call(smCxScreen)
	sh, _, _ := procGetSystemMetrics.Call(smCyScreen)
	w := webview2.NewWithOptions(webview2.WebViewOptions{
		DataPath:  filepath.Join(os.TempDir(), "otkrytka-webview2"),
		AutoFocus: true,
		WindowOptions: webview2.WindowOptions{
			Title:  pageTitle,
			Width:  uint(sw),
			Height: uint(sh),
			Center: true,
		},
	})
	if w == nil {
		log.Printf("окно WebView2 не создалось")
		return false
	}

	hwnd := uintptr(w.Window())
	procSetWindowLongPtrW.Call(hwnd, gwlStyle, wsPopup|wsVisible)
	procSetWindowPos.Call(hwnd, hwndTopmost, 0, 0, sw, sh, swpFrameChanged|swpShowWindow)

	go func() {
		<-s.exit
		log.Printf("открытка попросила закрыться")
		w.Dispatch(w.Terminate)
	}()

	w.Navigate(s.url)
	w.Run()
	log.Printf("окно закрыто")
	return true
}
