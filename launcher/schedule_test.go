package main

import (
	"testing"
	"time"
)

func TestParseStart(t *testing.T) {
	now := time.Date(2026, 11, 3, 20, 0, 0, 0, time.Local)
	cases := map[string]time.Time{
		"":       now,
		"сейчас": now,
		"21:30":  time.Date(2026, 11, 3, 21, 30, 0, 0, time.Local),
		"21.30":  time.Date(2026, 11, 3, 21, 30, 0, 0, time.Local),
		"9:05":   time.Date(2026, 11, 4, 9, 5, 0, 0, time.Local),
		"20:00":  time.Date(2026, 11, 4, 20, 0, 0, 0, time.Local),
		"22":     time.Date(2026, 11, 3, 22, 0, 0, 0, time.Local),
	}
	for in, want := range cases {
		got, err := parseStart(in, now)
		if err != nil || !got.Equal(want) {
			t.Errorf("parseStart(%q) = %v, %v; want %v", in, got, err, want)
		}
	}
	for _, in := range []string{"25:00", "abc", "12:61"} {
		if _, err := parseStart(in, now); err == nil {
			t.Errorf("parseStart(%q) should fail", in)
		}
	}
}
