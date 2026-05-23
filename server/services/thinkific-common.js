import { dbGet } from '../db/init.js'

export async function getThinkificCredentials() {
    const [apiKeyRow, subdomainRow] = await Promise.all([
        dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_api_key'"),
        dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_subdomain'")
    ])
    return {
        apiKey: apiKeyRow?.value || process.env.THINKIFIC_API_KEY || '',
        subdomain: subdomainRow?.value || process.env.THINKIFIC_SUBDOMAIN || ''
    }
}
