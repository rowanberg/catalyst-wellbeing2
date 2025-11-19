'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, Brain, QrCode } from 'lucide-react'

interface AssignedClass { id: string; class_name: string; subject?: string }

export default function LuminexActivatePage() {
  const router = useRouter()
  const params = useSearchParams()

  const sessionId = params.get('sessionId') || ''
  const classIdParam = params.get('classId') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<AssignedClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (!sessionId) {
          throw new Error('Missing sessionId. Please scan QR from Luminex Live Smartboard.')
        }
        // If classId provided, attempt immediate activation
        if (classIdParam) {
          setSelectedClassId(classIdParam)
          await activate(sessionId, classIdParam)
          return
        }
        // Else fetch classes for selection
        const res = await fetch('/api/luminex/class-info')
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to load classes')
        const list: AssignedClass[] = data.classes || []
        if (!mounted) return
        setClasses(list)
        if (list.length > 0) setSelectedClassId(list[0].id)
      } catch (e: any) {
        setError(e.message || 'Failed to initialize activation')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, classIdParam])

  const activate = async (sid: string, cid: string) => {
    try {
      setError(null)
      setActivating(true)
      const res = await fetch('/api/luminex/activate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, classId: cid })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
      setActivated(true)
    } catch (e: any) {
      setError(e.message || 'Activation failed')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Preparing activation…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Luminex Live Activation</div>
            <div className="text-xs text-slate-500">Secure connection with Smartboard</div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-3">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {activated ? (
          <div className="text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <div className="font-semibold mb-1">Luminex Live activated</div>
            <div className="text-sm text-slate-500">You can now return to your class on the Smartboard.</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">Session</div>
              <div className="text-sm font-mono bg-slate-50 border border-slate-200 rounded p-2 break-all">{sessionId}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Select Class</div>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.class_name} {c.subject ? `• ${c.subject}` : ''}</option>
                ))}
              </select>
            </div>
            <Button onClick={() => activate(sessionId, selectedClassId)} disabled={activating || !selectedClassId}>
              {activating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activating…</>) : (<><QrCode className="h-4 w-4 mr-2" /> Activate Session</>)}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
