import { useState, useEffect } from 'react'
import { MapPin, Globe, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

function App() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [ipData, setIpData] = useState<IPData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown')

  const getIPInfo = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      setIpData(data)
    } catch (err) {
      console.error('Failed to get IP info:', err)
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        setIpData({ ip: data.ip })
      } catch (fallbackErr) {
        console.error('Failed to get IP:', fallbackErr)
      }
    }
  }

  const getLocation = () => {
    setLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      setLoading(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
        setLoading(false)
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.'
            setPermissionStatus('denied')
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setError(errorMessage)
        setLoading(false)
      },
      options
    )
  }

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state)
      })
    }
  }, [])

  useEffect(() => {
    getIPInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Location Tracker</h1>
          <p className="text-lg text-gray-600">Get your precise GPS location and IP information</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* GPS Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                GPS Location
              </CardTitle>
              <CardDescription>
                Your precise geographical coordinates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={getLocation} 
                disabled={loading}
                className="w-full mb-4"
              >
                {loading ? 'Getting Location...' : 'Get My Location'}
              </Button>

              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {location && (
                <div className="space-y-3">
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
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="text-lg">{new Date(location.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="pt-2">
                    <a 
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-4 text-sm text-gray-500">
                Permission Status: <span className="font-medium">{permissionStatus}</span>
              </div>
            </CardContent>
          </Card>

          {/* IP Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Information
              </CardTitle>
              <CardDescription>
                Your network and location details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ipData ? (
                <div className="space-y-3">
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
                  {ipData.timezone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Timezone</label>
                      <p className="text-lg">{ipData.timezone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Loading IP information...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p>• <strong>GPS Location:</strong> Uses your device's GPS to get precise coordinates (requires permission)</p>
              <p>• <strong>IP Information:</strong> Shows your public IP address and approximate location</p>
              <p>• <strong>Accuracy:</strong> GPS is typically accurate within 3-5 meters on mobile devices</p>
              <p>• <strong>Privacy:</strong> All data is processed locally in your browser - nothing is stored</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
