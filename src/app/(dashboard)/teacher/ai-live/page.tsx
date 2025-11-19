'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopLoader } from '@/components/ui/top-loader'
import { useRouter } from 'next/navigation'
import { HelpCircle, QrCode, CheckCircle2, AlertCircle, Loader2, Brain, Shield, School, Scan, X, RotateCw, Copy, Link2, ShieldCheck, Info } from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'

interface AssignedClass {
  id: string
  class_name: string
  subject?: string
  grade_level?: string | number
}

export default function TeacherAiLivePage() {
  const router = useRouter()
  const profile = useAppSelector((s) => s.auth.profile)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<AssignedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [activating, setActivating] = useState(false)
  const [activationMsg, setActivationMsg] = useState<string | null>(null)
  const [manualSessionId, setManualSessionId] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanActiveRef = useRef(false)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/luminex/class-info')
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to load class info' }))
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!mounted) return
        const classes: AssignedClass[] = data.classes || []
        setClasses(classes)
        if (classes.length > 0) setSelectedClassId(classes[0].id)
      } catch (e: any) {
        setError(e.message || 'Failed to load class info')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const selectedClass = useMemo(() => classes.find((c) => c.id === selectedClassId), [classes, selectedClassId])
  const busy = loading || activating || scanning
  const currentStep = manualSessionId ? 3 : (scanning ? 2 : 1)

  const copySessionId = async () => {
    try {
      if (!manualSessionId) return
      await navigator.clipboard.writeText(manualSessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Clipboard not available')
    }
  }

  const stopScan = () => {
    try {
      scanActiveRef.current = false
      const v = videoRef.current
      const stream = v && (v.srcObject as MediaStream | null)
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      if (v) v.srcObject = null
      trackRef.current = null
      setTorchOn(false)
    } catch {}
  }

  const extractSessionId = (text: string): string | null => {
    try {
      let u: URL | null = null
      if (text.startsWith('http') || text.includes('://')) {
        u = new URL(text.startsWith('http') ? text : `https://${text}`)
      } else if (text.includes('luminexlive.app')) {
        u = new URL(text.startsWith('http') ? text : `https://${text}`)
      }
      if (u) {
        const q = u.searchParams.get('sessionId')
        if (q) return q
        const parts = u.pathname.split('/').filter(Boolean)
        if (parts.length > 0) return parts[parts.length - 1]
      }
      return text.trim()
    } catch {
      return text.trim()
    }
  }

  const startScan = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      setScanError(null)
      setScanning(true)
      scanActiveRef.current = true
      const md = (navigator as any).mediaDevices
      if (!md || !md.getUserMedia) throw new Error('Camera not available')
      const stream = await md.getUserMedia({ video: { facingMode: facing } })
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      const Det = (window as any).BarcodeDetector
      if (!Det) throw new Error('QR scanning not supported in this browser')
      const detector = new Det({ formats: ['qr_code'] })
      // keep reference to first video track for torch control
      const tracks = stream.getVideoTracks()
      trackRef.current = tracks && tracks.length > 0 ? tracks[0] : null
      // try to apply torch if requested
      if (torchOn && trackRef.current && (trackRef.current as any).applyConstraints) {
        try { await (trackRef.current as any).applyConstraints({ advanced: [{ torch: true }] }) } catch {}
      }
      const loop = async () => {
        if (!scanActiveRef.current || !videoRef.current) return
        try {
          const results = await detector.detect(videoRef.current)
          if (results && results.length > 0) {
            const raw = results[0].rawValue || results[0].raw || results[0].value
            if (raw) {
              const sid = extractSessionId(String(raw))
              setManualSessionId(sid || '')
              setScanning(false)
              scanActiveRef.current = false
              stopScan()
              return
            }
          }
        } catch {}
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    } catch (e: any) {
      setScanError(e.message || 'Scan failed')
      setScanning(false)
      scanActiveRef.current = false
      stopScan()
    }
  }

  const toggleTorch = async () => {
    const track: any = trackRef.current
    if (!track || !track.applyConstraints) return
    try {
      const next = !torchOn
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch {
      setScanError('Torch not supported on this device')
    }
  }

  const flipCamera = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment'
    setCameraFacing(next)
    stopScan()
    await startScan(next)
  }

  const pasteSessionId = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setManualSessionId(text.trim())
    } catch {
      setError('Clipboard not available')
    }
  }

  useEffect(() => {
    return () => {
      stopScan()
    }
  }, [])

  const handleActivate = async () => {
    try {
      setError(null)
      setActivationMsg(null)
      setActivating(true)
      if (!selectedClassId) throw new Error('Please select a class')
      if (!manualSessionId) throw new Error('Enter a sessionId (or use the mobile deep link flow)')
      const res = await fetch('/api/luminex/activate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: manualSessionId, classId: selectedClassId })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`)
      setActivationMsg(data.message || 'Luminex Live activated.')
    } catch (e: any) {
      setError(e.message || 'Activation failed')
    } finally {
      setActivating(false)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-900 relative min-h-screen flex overflow-hidden transition-colors duration-300 pb-24 lg:pb-0">
      <TopLoader isLoading={busy} color="#8b5cf6" height={3} speed={450} />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 dark:from-blue-900/5 dark:via-slate-900 dark:to-indigo-900/5" />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Luminex Live</h1>
                <p className="text-sm text-slate-600">Securely activate your live AI classroom session</p>
              </div>
              <div className="ml-auto hidden sm:block">
                <Badge variant="secondary" className="bg-slate-100 border border-slate-200 text-slate-700">
                  Status: {activating ? 'Activating…' : scanning ? 'Scanning…' : loading ? 'Loading…' : 'Idle'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
            {/* Stepper */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
              {[1,2,3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center font-semibold ${currentStep >= i ? 'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i}</div>
                  <div className={`hidden sm:block ${i===1 ? '' : 'w-24 h-0.5'} ${i<3 ? 'bg-slate-200' : ''}`}></div>
                </div>
              ))}
              <div className="ml-2 text-slate-500">{currentStep === 1 ? 'Select Class' : currentStep === 2 ? 'Scan QR' : 'Activate'}</div>
            </div>
            {/* Flow Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><School className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">1. Smartboard shows QR</div>
                    <div className="text-xs text-slate-500">Open Luminex Live on the Smartboard.</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Scan className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">2. Scan using mobile app</div>
                    <div className="text-xs text-slate-500">CatalystWells app deep link triggers activation.</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Shield className="h-5 w-5" /></div>
                  <div>
                    <div className="font-semibold">3. Secure activation</div>
                    <div className="text-xs text-slate-500">HMAC signature and ownership checks.</div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left column (2/3) */}
              <div className="space-y-4 lg:col-span-2">
                {/* Class Selection */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold">Select your class</div>
                    {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <select
                      className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={loading || classes.length === 0}
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.class_name} {c.subject ? `• ${c.subject}` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-slate-500">
                      Ensure the selected class matches the Smartboard room.
                    </div>
                  </div>
                </Card>

                {/* Activation Helper / Manual entry */}
                <Card className="p-4">
                  <div className="mb-3 font-semibold">Mobile Deep Link</div>
                  <div className="text-sm text-slate-600 mb-3">
                    Scan the Smartboard QR using the CatalystWells mobile app. It will open:
                    <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">catalystwells://luminex/activate?sessionId=…</code>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button variant="outline" onClick={() => startScan()} disabled={scanning}>
                      {scanning ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning…</>
                      ) : (
                        <><Scan className="h-4 w-4 mr-2" /> Scan QR code</>
                      )}
                    </Button>
                    <Button variant="outline" onClick={pasteSessionId} disabled={scanning}>Paste</Button>
                    {scanError && <span className="text-xs text-red-600">{scanError}</span>}
                  </div>
                  <div className="mb-1 font-semibold">Manual activation</div>
                  <div className="flex items-center gap-2">
                    <input
                      value={manualSessionId}
                      onChange={(e) => setManualSessionId(e.target.value)}
                      placeholder="Enter sessionId from Smartboard"
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    />
                    <Button onClick={handleActivate} disabled={activating || !selectedClassId || !manualSessionId} className="hidden sm:inline-flex">
                      {activating ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activating…</>
                      ) : (
                        <><QrCode className="h-4 w-4 mr-2" /> Activate</>
                      )}
                    </Button>
                  </div>
                  {activationMsg && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">{activationMsg}</span>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right column (1/3) */}
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-fuchsia-600" />
                      <div className="font-semibold">Session Details</div>
                    </div>
                    {manualSessionId && (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Ready</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={manualSessionId}
                      placeholder="Awaiting QR scan or paste"
                      className="flex-1 rounded-xl border-2 border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-700"
                    />
                    <Button variant="outline" onClick={copySessionId} disabled={!manualSessionId} title="Copy sessionId">
                      {copied ? 'Copied' : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {manualSessionId && (
                    <a
                      href={`catalystwells://luminex/activate?sessionId=${encodeURIComponent(manualSessionId)}`}
                      className="inline-flex items-center text-xs text-fuchsia-700 hover:underline mt-2"
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1" /> Open deep link
                    </a>
                  )}
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2"><ShieldCheck className="h-4 w-4 text-purple-600" /><div className="font-semibold">Security & Compliance</div></div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200">HMAC-SHA256</Badge>
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200">5 min window</Badge>
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200">Class ownership</Badge>
                    <Badge className="bg-slate-100 text-slate-700 border border-slate-200">School check</Badge>
                  </div>
                  <div className="text-xs text-slate-600 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 mt-0.5 text-slate-400" />
                    Activation is allowed only for teachers assigned to the selected class and school. All requests are signed and time-bound.
                  </div>
                </Card>
              </div>
            </div>

            {/* Tips */}
            <div className="text-xs text-slate-500">
              Note: QR codes are generated by Luminex Live (Smartboard). CatalystWells scans and activates them securely.
            </div>
            {/* Mobile sticky activate bar */}
            <div className="lg:hidden" />
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white/90 dark:bg-slate-900/85 backdrop-blur border-t border-slate-200/70 dark:border-slate-700/60">
          <Button onClick={handleActivate} disabled={activating || !selectedClassId || !manualSessionId} className="w-full">
            {activating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activating…</>) : (<><QrCode className="h-4 w-4 mr-2" /> Activate Luminex Live</>)}
          </Button>
        </div>
      </div>

      {/* Fullscreen scanner overlay */}
      {scanning && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="absolute top-3 right-3">
            <Button variant="ghost" onClick={() => { setScanning(false); stopScan() }} className="text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <div className="text-white text-sm mb-3">Point your camera at the Smartboard QR</div>
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden ring-2 ring-white/30">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-6 border-2 border-white/30 rounded-xl pointer-events-none" />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={flipCamera} className="bg-white/10 hover:bg-white/20 text-white">
                <RotateCw className="h-4 w-4 mr-2" /> Flip
              </Button>
              <Button onClick={toggleTorch} disabled={!trackRef.current} className="bg-white/10 hover:bg-white/20 text-white">
                {torchOn ? 'Torch off' : 'Torch on'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
