package main

import (
	"embed"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"sync"
)

// Собранный сайт кладётся в launcher/site скриптом scripts/build-exe.sh
//
//go:embed all:site
var siteFS embed.FS

// Сервер открытки на 127.0.0.1 со случайным портом.
// /__desktop.png — снимок рабочего стола перед запуском: в конце открытка
// плавно проявляет его, и закрытие окна выглядит как «прозрачность в ноль».
// /__exit — открытка сообщает, что пора закрывать окно.
type server struct {
	url     string
	exit    chan struct{}
	mu      sync.Mutex
	desktop []byte
}

func init() {
	// на Windows типы файлов берутся из реестра и иногда ломаются
	// (.js как text/plain), поэтому задаём их явно
	for ext, typ := range map[string]string{
		".html":        "text/html; charset=utf-8",
		".js":          "text/javascript; charset=utf-8",
		".css":         "text/css; charset=utf-8",
		".json":        "application/json",
		".svg":         "image/svg+xml",
		".png":         "image/png",
		".jpg":         "image/jpeg",
		".gif":         "image/gif",
		".webp":        "image/webp",
		".ico":         "image/x-icon",
		".woff2":       "font/woff2",
		".ttf":         "font/ttf",
		".webmanifest": "application/manifest+json",
	} {
		mime.AddExtensionType(ext, typ)
	}
}

func startServer() (*server, error) {
	sub, err := fs.Sub(siteFS, "site")
	if err != nil {
		return nil, err
	}
	s := &server{exit: make(chan struct{})}
	var once sync.Once

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/__desktop.png", func(w http.ResponseWriter, r *http.Request) {
		s.mu.Lock()
		img := s.desktop
		s.mu.Unlock()
		if img == nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "image/png")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(img)
	})
	mux.HandleFunc("/__exit", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
		once.Do(func() { close(s.exit) })
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	s.url = "http://" + ln.Addr().String() + "/"
	go http.Serve(ln, mux)
	return s, nil
}

func (s *server) setDesktop(png []byte) {
	s.mu.Lock()
	s.desktop = png
	s.mu.Unlock()
}
