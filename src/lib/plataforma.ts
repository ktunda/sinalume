// Detecção de plataforma e de recursos do navegador (para dar a mesma experiência no iPhone e no Android).

export function ehIOS(): boolean {
  const ua = navigator.userAgent
  // iPadOS se apresenta como Mac, mas tem toque
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function ehAndroid(): boolean {
  return /Android/.test(navigator.userAgent)
}

/** O app está aberto como aplicativo instalado (tela inicial), e não dentro do navegador? */
export function instalado(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true
}

export const suporta = {
  reconhecimentoNavegador: () =>
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
  gravacaoAudio: () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  telaCheia: () => !!document.documentElement.requestFullscreen,
  telaAcesa: () => 'wakeLock' in navigator,
  webgpu: () => 'gpu' in navigator,
}
