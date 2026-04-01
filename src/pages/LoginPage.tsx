import { useNavigate } from 'react-router-dom'
import { GoogleLogo, FacebookLogo } from '@phosphor-icons/react'
import appleLogo from '../assets/apple.svg'

export default function LoginPage() {
  const navigate = useNavigate()

  const socialBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', width: '100%', padding: '14px', borderRadius: '999px',
    border: '1px solid #999999', backgroundColor: 'white',
    color: '#333333', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    marginBottom: '12px'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh',
      backgroundColor: 'white', padding: '0 24px', maxWidth: '430px', margin: '0 auto' }}>

      {/* Logo */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '60px', marginBottom: '8px' }}>
  <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#333333', marginRight: '6px' }}>Better</span>
  <div style={{ borderRadius: '50%', backgroundColor: '#FE7F3C',
    padding: '6px 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '37px' }}>Me</span>
  </div>
</div>

      {/* Tagline */}
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#999999', marginBottom: '40px' }}>
        Improve yourself on your own terms
      </p>

      {/* Heading */}
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', textAlign: 'center', color: '#333333', marginBottom: '8px' }}>
        Let's Get Started!
      </h1>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#999999', marginBottom: '32px', lineHeight: '1.6' }}>
        A new journey brings excitement, opportunities and a chance to see this first step today.
      </p>

      {/* Social buttons */}
      <button style={socialBtn} onClick={() => navigate('/dashboard')}>
        <GoogleLogo size={20} color="#333333" weight="regular" aria-hidden />
        Continue with Google
      </button>

      <button style={socialBtn} onClick={() => navigate('/dashboard')}>
        <img src={appleLogo} alt="" width={20} height={20} style={{ display: 'block' }} />
        Continue with Apple
      </button>

      <button style={socialBtn} onClick={() => navigate('/dashboard')}>
        <FacebookLogo size={20} color="#1877F2" weight="fill" aria-hidden />
        Continue with Facebook
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 20px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
        <span style={{ color: '#999999', fontSize: '12px' }}>or</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
      </div>

      {/* Login button */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{ width: '100%', padding: '16px', borderRadius: '999px', backgroundColor: '#FE7F3C',
          color: 'white', fontWeight: 600, fontSize: '16px', border: 'none', cursor: 'pointer', marginBottom: '16px' }}>
        Login
      </button>

      {/* Register */}
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#999999' }}>
        Don't have an account?{' '}
        <span onClick={() => navigate('/personalisation')}
          style={{ color: '#FE7F3C', fontWeight: 600, cursor: 'pointer' }}>
          Register
        </span>
      </p>

      {/* Privacy */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: '#999999', marginTop: 'auto', paddingBottom: '24px', paddingTop: '32px' }}>
        You control what is tracked
      </p>
    </div>
  )
}