export interface FingerprintData {
  fingerprint: string
  canvas: string
  webgl: WebGLInfo | null
  hardware: HardwareInfo
  fonts: FontInfo[]
  services: ServiceInfo
  localIP: string | null
  audio: AudioInfo | null
  media: MediaInfo | null
  timestamp: number
}

interface WebGLInfo {
  vendor: string
  renderer: string
  version: string
  shadingLanguageVersion: string
}

interface HardwareInfo {
  screen: string
  timezone: string
  cores: number
  memory: number | undefined
  connection: string | undefined
  platform: string
  cookieEnabled: boolean
  language: string
  languages: readonly string[]
}

interface FontInfo {
  font: string
  width: number
}

interface ServiceInfo {
  serviceWorker: boolean
  pushManager: boolean
  notifications: boolean
  webRTC: boolean
  bluetooth: boolean
  geolocation: boolean
  battery: boolean
}

interface AudioInfo {
  sampleRate: number
  maxChannelCount: number
  state: string
}

interface MediaInfo {
  videoInputs: number
  audioInputs: number
  audioOutputs: number
}

function getCanvasFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  ctx.textBaseline = 'top'
  ctx.font = '14px Arial'
  ctx.fillText('Browser fingerprint', 2, 2)
  return canvas.toDataURL().slice(-50)
}

function getWebGLFingerprint(): WebGLInfo | null {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  if (!gl) return null
  
  return {
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
  }
}

function getHardwareProfile(): HardwareInfo {
  return {
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cores: navigator.hardwareConcurrency,
    memory: (navigator as any).deviceMemory,
    connection: (navigator as any).connection?.effectiveType,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    language: navigator.language,
    languages: navigator.languages
  }
}

function detectFonts(): FontInfo[] {
  const fonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Georgia', 'Verdana']
  const detected: FontInfo[] = []
  
  fonts.forEach(font => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.font = `12px ${font}`
    const width = ctx.measureText('test').width
    detected.push({font, width})
  })
  
  return detected
}

function detectServices(): ServiceInfo {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notifications: 'Notification' in window,
    webRTC: !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection),
    bluetooth: 'bluetooth' in navigator,
    geolocation: 'geolocation' in navigator,
    battery: 'getBattery' in navigator
  }
}

async function scanLocalNetwork(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({iceServers: []})
      pc.createDataChannel('')
      pc.createOffer().then(offer => pc.setLocalDescription(offer))
      
      const timeout = setTimeout(() => resolve(null), 3000)
      
      pc.onicecandidate = (ice) => {
        if (ice.candidate) {
          const ip = ice.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
          if (ip) {
            clearTimeout(timeout)
            resolve(ip[1])
          }
        }
      }
    } catch (e) {
      resolve(null)
    }
  })
}

function getAudioFingerprint(): AudioInfo | null {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContext()
    
    return {
      sampleRate: audioContext.sampleRate,
      maxChannelCount: audioContext.destination.maxChannelCount,
      state: audioContext.state
    }
  } catch (e) {
    return null
  }
}

async function getMediaDevices(): Promise<MediaInfo | null> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return {
      videoInputs: devices.filter(d => d.kind === 'videoinput').length,
      audioInputs: devices.filter(d => d.kind === 'audioinput').length,
      audioOutputs: devices.filter(d => d.kind === 'audiooutput').length
    }
  } catch (e) {
    return null
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

export async function generateFingerprint(): Promise<FingerprintData> {
  const canvas = getCanvasFingerprint()
  const webgl = getWebGLFingerprint()
  const hardware = getHardwareProfile()
  const fonts = detectFonts()
  const services = detectServices()
  const localIP = await scanLocalNetwork()
  const audio = getAudioFingerprint()
  const media = await getMediaDevices()
  const timestamp = Date.now()
  
  const fingerprintData = {
    canvas,
    webgl,
    hardware,
    fonts,
    services,
    localIP,
    audio,
    media,
    timestamp
  }
  
  const fingerprintString = JSON.stringify(fingerprintData)
  const fingerprint = await hashString(fingerprintString)
  
  return {
    fingerprint,
    canvas,
    webgl,
    hardware,
    fonts,
    services,
    localIP,
    audio,
    media,
    timestamp
  }
}
