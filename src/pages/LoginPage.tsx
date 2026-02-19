import { useNavigate } from 'react-router-dom'

// login screen — first point of contact for the user
// social login buttons navigate directly to dashboard as auth is out of scope
export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', backgroundColor: 'white',
      padding: '40px 24px', maxWidth: '430px', margin: '0 auto'
    }}>

      {/* logo and branding */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#333333' }}>Better</span>
          <div style={{
            backgroundColor: '#FE7F3C', borderRadius: '8px',
            padding: '2px 10px'
          }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>Me</span>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: '#999999' }}>
          improve yourself on your own terms
        </p>
      </div>

      {/* main heading */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#333333', marginBottom: '8px' }}>
          let's get started!
        </h1>
        <p style={{ fontSize: '14px', color: '#999999', lineHeight: '1.5' }}>
          a new journey brings excitement, opportunities and actions — take the first step today.
        </p>
      </div>

      {/* social login buttons */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/personalisation')}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid #f0f0f0', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', cursor: 'pointer', fontSize: '14px', color: '#333333',
            fontWeight: 500
          }}>
          {/* google favicon loaded from public url */}
          <img src="https://www.google.com/favicon.ico" width={18} height={18} alt="google" />
          continue with Google
        </button>

        <button
          onClick={() => navigate('/personalisation')}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid #f0f0f0', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', cursor: 'pointer', fontSize: '14px', color: '#333333',
            fontWeight: 500
          }}>
          {/* apple unicode symbol used as icon */}
          <span style={{ fontSize: '18px' }}>🍎</span>
          continue with Apple
        </button>

        <button
          onClick={() => navigate('/personalisation')}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid #f0f0f0', backgroundColor: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', cursor: 'pointer', fontSize: '14px', color: '#333333',
            fontWeight: 500
          }}>
          <span style={{ fontSize: '18px' }}>📧</span>
          continue with Email
        </button>
      </div>

      {/* primary login button */}
      <button
        onClick={() => navigate('/personalisation')}
        style={{
          width: '100%', padding: '16px', borderRadius: '999px',
          backgroundColor: '#FE7F3C', border: 'none',
          color: 'white', fontSize: '16px', fontWeight: 600,
          cursor: 'pointer', marginBottom: '16px'
        }}>
        login
      </button>

      {/* register link */}
      <p style={{ fontSize: '14px', color: '#999999' }}>
        don't have an account?{' '}
        <span
          onClick={() => navigate('/personalisation')}
          style={{ color: '#FE7F3C', cursor: 'pointer', fontWeight: 500 }}>
          register
        </span>
      </p>
    </div>
  )
}