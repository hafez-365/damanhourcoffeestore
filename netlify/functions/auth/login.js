// netlify/functions/auth/login.js
import { createClient } from '@supabase/supabase-js'

export default async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { email, password } = JSON.parse(event.body)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({ user: data.user })
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error.message })
    }
  }
}