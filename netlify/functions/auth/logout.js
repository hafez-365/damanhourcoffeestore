// netlify/functions/auth/logout.js
import { createClient } from '@supabase/supabase-js'

export default async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  try {
    // قراءة token من الكوكيز
    const token = event.headers.cookie
      ?.split('; ')
      ?.find(row => row.startsWith('sb-access-token='))
      ?.split('=')[1]

    if (token) {
      await supabase.auth.admin.signOut(token)
    }

    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': [
          'sb-access-token=; HttpOnly; Secure; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'sb-refresh-token=; HttpOnly; Secure; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        ],
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }
}