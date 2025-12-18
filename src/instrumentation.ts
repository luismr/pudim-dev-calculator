export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const timestamp = new Date().toISOString()
    
    // Get all environment variables
    const envVars = Object.keys(process.env)
      .sort()
      .reduce((acc, key) => {
        // Mask sensitive values (passwords, tokens, keys, secrets)
        const isSensitive = /(password|token|key|secret|auth|credential|api[_-]?key)/i.test(key)
        const value = process.env[key]
        acc[key] = isSensitive && value 
          ? `${value.substring(0, 4)}${'*'.repeat(Math.max(4, value.length - 4))}`
          : value || '(not set)'
        return acc
      }, {} as Record<string, string>)
    
    // Log startup message with all environment variables in JSON format (Grafana Loki compatible)
    console.log(JSON.stringify({
      level: 'info',
      message: '[Application Startup] Environment variables loaded',
      timestamp,
      env_vars: envVars,
      env_var_count: Object.keys(envVars).length,
    }))
  }
}

