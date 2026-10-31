//go:build !windows

package main

import (
	"fmt"
	"os"
)

// Для проверки на Linux/macOS: запускает сервер открытки и печатает
// адрес. Первый аргумент — картинка, которая отдаётся как снимок
// рабочего стола
func main() {
	s, err := startServer()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	if len(os.Args) > 1 {
		if img, err := os.ReadFile(os.Args[1]); err == nil {
			s.setDesktop(img)
		}
	}
	fmt.Println(s.url)
	<-s.exit
	fmt.Println("exit")
}
