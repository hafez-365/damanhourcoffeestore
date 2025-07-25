import { createClient } from '@supabase/supabase-js'

export default async (event, context) => {
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

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid session' })
      }
    }

    // التحقق من صحة الجلسة
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({ user })
    }
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: error.message || 'Invalid session' })
    }
  }
}