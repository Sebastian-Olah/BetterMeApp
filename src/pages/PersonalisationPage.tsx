export default function PersonalisationPage() {
  return <div>Personalisation Page</div>
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savePreferences, getPreferences } from '../utils/storage'

// converts camelCase keys to readable display labels
const sliderLabel = (key: string) => ({
  warm: 'Warm',
  enthusiastic: 'Enthusiastic',
  headerLists: 'Header & Lists',
  directness: 'Directness',
}[key] || key)

// returns a label based on slider position
const sliderValueLabel = (val: number) => {
  if (val < 35) return 'Less'
  if (val > 65) return 'More'
  return 'Neutral'
}

export default function PersonalisationPage() {
  const navigate = useNavigate()
  const saved = getPreferences()

  // tone options for the AI coach
  const toneOptions = ['Strict', 'Neutral', 'Balanced', 'Warm', 'Soft']

  const [selectedTone, setSelectedTone] = useState(saved.tone || 'Balanced')
  const [characteristics, setCharacteristics] = useState(
    saved.characteristics || { warm: 50, enthusiastic: 50, headerLists: 50, directness: 50 }
  )
  const [collectData, setCollectData] = useState(saved.collectData || false)
  const [locationTracking, setLocationTracking] = useState(saved.locationTracking || false)

  // saves all preferences to localStorage and navigates to dashboard
  const handleSave = () => {
    savePreferences({
      tone: selectedTone,
      characteristics,
      collectData,
      locationTracking,
      notificationTime: saved.notificationTime || '09:00',
      notificationsEnabled: saved.notificationsEnabled || false,
      onboardingComplete: true,
    })
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'white',
      maxWidth: '430px', margin: '0 auto', padding: '24px'
    }}>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#333333' }}>Personalisation</h1>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#FE7F3C', color: 'white', border: 'none',
            borderRadius: '999px', padding: '8px 20px', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer'
          }}>
          Save
        </button>
      </div>

      {/* base tone selector */}
      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '10px' }}>Base style and tone</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {toneOptions.map(tone => (
          <button
            key={tone}
            onClick={() => setSelectedTone(tone)}
            style={{
              padding: '8px 16px', borderRadius: '999px', fontSize: '13px',
              fontWeight: 500, cursor: 'pointer', border: 'none',
              backgroundColor: selectedTone === tone ? '#FE7F3C' : '#f5f5f5',
              color: selectedTone === tone ? 'white' : '#333333',
            }}>
            {tone}
          </button>
        ))}
      </div>

      {/* characteristic sliders — rendered dynamically from object keys */}
      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '16px' }}>Characteristics</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        {Object.keys(characteristics).map(key => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', color: '#333333' }}>{sliderLabel(key)}</span>
              <span style={{ fontSize: '12px', color: '#FE7F3C', fontWeight: 500 }}>
                {sliderValueLabel(characteristics[key as keyof typeof characteristics])}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={characteristics[key as keyof typeof characteristics]}
              onChange={e => setCharacteristics(prev => ({ ...prev, [key]: Number(e.target.value) }))}
              style={{ width: '100%', accentColor: '#FE7F3C' }}
            />
          </div>
        ))}
      </div>

      {/* privacy toggles */}
      <p style={{ fontSize: '13px', color: '#999999', marginBottom: '16px' }}>Privacy & Security</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Collect User Data', key: 'collectData', value: collectData, set: setCollectData },
          { label: 'Allow Location Tracking', key: 'locationTracking', value: locationTracking, set: setLocationTracking },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#333333' }}>{item.label}</span>
            {/* custom toggle built with nested divs — no external library needed */}
            <div
              onClick={() => item.set(!item.value)}
              style={{
                width: '44px', height: '24px', borderRadius: '999px',
                backgroundColor: item.value ? '#FE7F3C' : '#e0e0e0',
                cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s'
              }}>
              <div style={{
                position: 'absolute', top: '2px',
                left: item.value ? '22px' : '2px',
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: 'white', transition: 'left 0.2s'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* save button at the bottom */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '16px', borderRadius: '999px',
          backgroundColor: '#FE7F3C', border: 'none',
          color: 'white', fontSize: '16px', fontWeight: 600, cursor: 'pointer'
        }}>
        save and continue
      </button>
    </div>
  )
}