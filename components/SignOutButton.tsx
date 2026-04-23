'use client'

export default function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="post">
      <button
        type="submit"
        style={{
          background: 'none', border: 'none',
          color: '#8a7560', cursor: 'pointer', fontSize: '1rem'
        }}
        title="Sign out"
      >
        ↪
      </button>
    </form>
  )
}
