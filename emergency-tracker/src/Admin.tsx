import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import './App.css'

interface LocationRecord {
  id: string
  latitude: number
  longitude: number
  accuracy: number
  ip_address?: string
  city?: string
  region?: string
  country?: string
  fingerprint?: any
  timestamp: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Admin() {
  const [allLocations, setAllLocations] = useState<LocationRecord[]>([])

  const fetchAllLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/locations`)
      const data = await response.json()
      setAllLocations(data.locations || [])
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    }
  }

  const clearAllLocations = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/locations`, { method: 'DELETE' })
      setAllLocations([])
    } catch (err) {
      console.error('Failed to clear locations:', err)
    }
  }

  useEffect(() => {
    fetchAllLocations()
    const interval = setInterval(fetchAllLocations, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Emergency Location Dashboard</h1>
          <div className="flex gap-2">
            <Button onClick={clearAllLocations} variant="destructive">
              Clear All
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Locations Captured: {allLocations.length}</CardTitle>
              <CardDescription>Real-time location tracking dashboard (auto-refreshes every 5 seconds)</CardDescription>
            </CardHeader>
          </Card>

          {allLocations.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No locations captured yet. Share the tracking link to start collecting locations.</p>
              </CardContent>
            </Card>
          )}

          {allLocations.map((loc) => (
            <Card key={loc.id}>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location Details</h3>
                    {loc.latitude !== 0 && loc.longitude !== 0 ? (
                      <>
                        <p><strong>Coordinates:</strong> {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</p>
                        <p><strong>Accuracy:</strong> {Math.round(loc.accuracy)} meters</p>
                        <p><strong>Timestamp:</strong> {new Date(loc.timestamp).toLocaleString()}</p>
                        <a 
                          href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View on Google Maps
                        </a>
                      </>
                    ) : (
                      <>
                        <p className="text-orange-600"><strong>GPS Location:</strong> Not available (permission denied or timed out)</p>
                        <p><strong>Timestamp:</strong> {new Date(loc.timestamp).toLocaleString()}</p>
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Network Info</h3>
                    <p><strong>IP:</strong> {loc.ip_address}</p>
                    {loc.city && <p><strong>City:</strong> {loc.city}</p>}
                    {loc.region && <p><strong>Region:</strong> {loc.region}</p>}
                    {loc.country && <p><strong>Country:</strong> {loc.country}</p>}
                  </div>
                </div>
                
                {loc.fingerprint && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2">Device Fingerprint</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Fingerprint ID:</strong> <span className="font-mono text-xs">{loc.fingerprint.fingerprint}</span></p>
                        {loc.fingerprint.hardware && (
                          <>
                            <p><strong>Screen:</strong> {loc.fingerprint.hardware.screen}</p>
                            <p><strong>Platform:</strong> {loc.fingerprint.hardware.platform}</p>
                            <p><strong>CPU Cores:</strong> {loc.fingerprint.hardware.cores}</p>
                            {loc.fingerprint.hardware.memory && <p><strong>Memory:</strong> {loc.fingerprint.hardware.memory} GB</p>}
                            <p><strong>Timezone:</strong> {loc.fingerprint.hardware.timezone}</p>
                            <p><strong>Language:</strong> {loc.fingerprint.hardware.language}</p>
                          </>
                        )}
                      </div>
                      <div>
                        {loc.fingerprint.webgl && (
                          <>
                            <p><strong>GPU Vendor:</strong> {loc.fingerprint.webgl.vendor}</p>
                            <p><strong>GPU Renderer:</strong> {loc.fingerprint.webgl.renderer}</p>
                          </>
                        )}
                        {loc.fingerprint.localIP && <p><strong>Local IP:</strong> {loc.fingerprint.localIP}</p>}
                        {loc.fingerprint.media && (
                          <>
                            <p><strong>Cameras:</strong> {loc.fingerprint.media.videoInputs}</p>
                            <p><strong>Microphones:</strong> {loc.fingerprint.media.audioInputs}</p>
                          </>
                        )}
                        {loc.fingerprint.services && (
                          <p className="text-xs mt-2">
                            <strong>Services:</strong> {Object.entries(loc.fingerprint.services)
                              .filter(([_, v]) => v)
                              .map(([k]) => k)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Admin
