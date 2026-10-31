//go:build windows

package main

import (
	"bytes"
	"errors"
	"image"
	"image/png"
	"syscall"
	"unsafe"
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	gdi32    = syscall.NewLazyDLL("gdi32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procSetProcessDPIAware      = user32.NewProc("SetProcessDPIAware")
	procGetSystemMetrics        = user32.NewProc("GetSystemMetrics")
	procGetDC                   = user32.NewProc("GetDC")
	procReleaseDC               = user32.NewProc("ReleaseDC")
	procMessageBoxW             = user32.NewProc("MessageBoxW")
	procCreateCompatibleDC      = gdi32.NewProc("CreateCompatibleDC")
	procCreateCompatibleBitmap  = gdi32.NewProc("CreateCompatibleBitmap")
	procSelectObject            = gdi32.NewProc("SelectObject")
	procBitBlt                  = gdi32.NewProc("BitBlt")
	procGetDIBits               = gdi32.NewProc("GetDIBits")
	procDeleteObject            = gdi32.NewProc("DeleteObject")
	procDeleteDC                = gdi32.NewProc("DeleteDC")
	procSetThreadExecutionState = kernel32.NewProc("SetThreadExecutionState")
)

const (
	mbOK           = 0x0
	mbIconError    = 0x10
	mbIconInfo     = 0x40
	mbTopmost      = 0x40000
	mbForeground   = 0x10000
	srcCopy        = 0x00CC0020
	esContinuous   = 0x80000000
	esSystem       = 0x00000001
	esDisplay      = 0x00000002
	smCxScreen     = 0
	smCyScreen     = 1
	dibRGBColors   = 0
	createNoWindow = 0x08000000
)

func messageBox(text, caption string, flags uintptr) {
	t, _ := syscall.UTF16PtrFromString(text)
	c, _ := syscall.UTF16PtrFromString(caption)
	procMessageBoxW.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)),
		flags|mbTopmost|mbForeground)
}

// Не даёт компьютеру уснуть и погасить экран, пока программа ждёт
func keepAwake() {
	procSetThreadExecutionState.Call(esContinuous | esSystem | esDisplay)
}

type bitmapInfo struct {
	Size          uint32
	Width         int32
	Height        int32
	Planes        uint16
	BitCount      uint16
	Compression   uint32
	SizeImage     uint32
	XPelsPerMeter int32
	YPelsPerMeter int32
	ClrUsed       uint32
	ClrImportant  uint32
	Colors        [4]uint32
}

// Снимок основного экрана в PNG
func captureScreen() ([]byte, error) {
	w, _, _ := procGetSystemMetrics.Call(smCxScreen)
	h, _, _ := procGetSystemMetrics.Call(smCyScreen)
	if w == 0 || h == 0 {
		return nil, errors.New("не удалось узнать размер экрана")
	}
	screen, _, _ := procGetDC.Call(0)
	defer procReleaseDC.Call(0, screen)
	mem, _, _ := procCreateCompatibleDC.Call(screen)
	defer procDeleteDC.Call(mem)
	bmp, _, _ := procCreateCompatibleBitmap.Call(screen, w, h)
	defer procDeleteObject.Call(bmp)

	old, _, _ := procSelectObject.Call(mem, bmp)
	ok, _, _ := procBitBlt.Call(mem, 0, 0, w, h, screen, 0, 0, srcCopy)
	procSelectObject.Call(mem, old)
	if ok == 0 {
		return nil, errors.New("не удалось сделать снимок экрана")
	}

	info := bitmapInfo{Width: int32(w), Height: -int32(h), Planes: 1, BitCount: 32}
	info.Size = 40
	buf := make([]byte, int(w)*int(h)*4)
	lines, _, _ := procGetDIBits.Call(mem, bmp, 0, h,
		uintptr(unsafe.Pointer(&buf[0])), uintptr(unsafe.Pointer(&info)), dibRGBColors)
	if lines == 0 {
		return nil, errors.New("не удалось прочитать снимок экрана")
	}

	img := image.NewRGBA(image.Rect(0, 0, int(w), int(h)))
	for i := 0; i < len(buf); i += 4 {
		img.Pix[i] = buf[i+2]
		img.Pix[i+1] = buf[i+1]
		img.Pix[i+2] = buf[i]
		img.Pix[i+3] = 255
	}
	var out bytes.Buffer
	enc := png.Encoder{CompressionLevel: png.BestSpeed}
	if err := enc.Encode(&out, img); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
