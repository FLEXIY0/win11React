package main

import (
	"fmt"
	"strings"
	"time"
)

// Разбирает время запуска: пусто или «сейчас» — сразу, «ЧЧ:ММ» — сегодня
// в это время, а если оно уже прошло — завтра
func parseStart(input string, now time.Time) (time.Time, error) {
	t := strings.TrimSpace(strings.ToLower(input))
	if t == "" || t == "сейчас" || t == "now" {
		return now, nil
	}
	t = strings.NewReplacer(".", ":", "-", ":", " ", ":").Replace(t)
	var h, m int
	if _, err := fmt.Sscanf(t, "%d:%d", &h, &m); err != nil {
		if _, err := fmt.Sscanf(t, "%d", &h); err != nil {
			return now, fmt.Errorf("не понял время «%s»", input)
		}
	}
	if h < 0 || h > 23 || m < 0 || m > 59 {
		return now, fmt.Errorf("не понял время «%s»", input)
	}
	at := time.Date(now.Year(), now.Month(), now.Day(), h, m, 0, 0, now.Location())
	if !at.After(now) {
		at = at.Add(24 * time.Hour)
	}
	return at, nil
}
