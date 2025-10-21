import { useState, useEffect } from 'react'
import { MapPin, Shield, Clock, CheckCircle, AlertTriangle, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Location Tracker</h1>
          <p className="text-lg text-gray-600">Your location is being captured for emergency assistance</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'loading' && <Clock className="h-5 w-5 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {status === 'error' && <AlertTriangle className="h-5 w-5 text-red-600" />}
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center">
                <p className="text-lg mb-2">Capturing your location...</p>
                <p className="text-sm text-gray-600">Please allow location access when prompted</p>
              </div>
            )}

            {status === 'success' && location && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Location captured successfully and sent to emergency services
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Latitude</label>
                    <p className="text-lg font-mono">{location.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Longitude</label>
                    <p className="text-lg font-mono">{location.longitude.toFixed(6)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Accuracy</label>
                  <p className="text-lg">{Math.round(location.accuracy)} meters</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Captured At</label>
                  <p className="text-lg">{new Date(location.timestamp).toLocaleString()}</p>
                </div>

                <a 
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 hover:text-blue-800 underline"
                >
                  View Location on Google Maps
                </a>
              </div>
            )}

            {status === 'error' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {ipData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Network Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-lg font-mono">{ipData.ip}</p>
                </div>
                {ipData.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">City</label>
                    <p className="text-lg">{ipData.city}</p>
                  </div>
                )}
                {ipData.region && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Region</label>
                    <p className="text-lg">{ipData.region}</p>
                  </div>
                )}
                {ipData.country && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Country</label>
                    <p className="text-lg">{ipData.country}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p>• Your location has been automatically captured and sent to emergency services</p>
              <p>• This information helps responders locate you quickly in an emergency</p>
              <p>• Keep this page open if possible for continued tracking</p>
              <p>• Your privacy is protected - location data is only used for emergency response</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button onClick={toggleAdminView} variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Admin View
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
