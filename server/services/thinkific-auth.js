/**
 * Thinkific Auth Helper — single source of truth for Thinkific API auth.
 *
 * Two auth modes:
 *  - access-token (PRIMARY): new API Access Token (Bearer). Required for the
 *    GraphQL API (https://api.thinkific.com/beta/graphql) and usable for REST.
 *  - legacy-key (FALLBACK): X-Auth-API-Key + X-Auth-Subdomain (REST v1 only).
 *
 * Rollout rule: use the new token where it's confirmed to work; otherwise keep
 * the working legacy call. GraphQL is access-token-only (legacy keys can't call
 * GraphQL). REST prefers the token and falls back to the legacy key on 401/403.
 *
 * SECRETS: the token is read from config only (system_settings → env) and is
 * NEVER logged, not even partially. We log the active MODE only.
 */
import axios from 'axios'
import https from 'https'
import { dbGet } from '../db/init.js'
import { getThinkificCredentials } from './thinkific-common.js'

const GRAPHQL_URL = 'https://api.thinkific.com/beta/graphql'
const REST_BASE = 'https://api.thinkific.com/api/public/v1'
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 10 })

// Read the new API Access Token from config only. Never hardcode/commit.
export async function getAccessToken() {
    let row = null
    try { row = await dbGet("SELECT value FROM system_settings WHERE key = 'thinkific_api_access_token'") } catch (_) {}
    return (row?.value || process.env.THINKIFIC_API_ACCESS_TOKEN || '').trim()
}

export async function getThinkificAuthMode() {
    return (await getAccessToken()) ? 'access-token' : 'legacy-key'
}

let _loggedMode = null
async function logModeOnce(context) {
    const mode = await getThinkificAuthMode()
    const key = `${context}:${mode}`
    if (_loggedMode !== key) {
        _loggedMode = key
        console.log(`🔐 thinkific auth [${context}]: ${mode}`) // never logs the token itself
    }
    return mode
}

async function withRetry(fn, label = 'request', attempts = 3) {
    for (let i = 0; i < attempts; i++) {
        try { return await fn() }
        catch (err) {
            const retryable = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED'].includes(err.code)
                || (err.response?.status >= 500)
            if (!retryable || i === attempts - 1) throw err
            const delay = 1000 * Math.pow(2, i)
            console.warn(`⚠️ [thinkific-auth] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay / 1000}s`)
            await new Promise(r => setTimeout(r, delay))
        }
    }
}

/**
 * Execute a named GraphQL operation against the Thinkific Graph.
 * access-token only. Throws with a clear message if no token is configured or
 * if the response carries GraphQL errors.
 */
export async function thinkificGraphQL(query, variables = {}, { label = 'graphql' } = {}) {
    const token = await getAccessToken()
    if (!token) {
        const e = new Error('Thinkific API Access Token not configured (set THINKIFIC_API_ACCESS_TOKEN or the thinkific_api_access_token setting). GraphQL requires the new token.')
        e.code = 'NO_ACCESS_TOKEN'
        throw e
    }
    await logModeOnce(label)
    const res = await withRetry(() => axios.post(
        GRAPHQL_URL,
        { query, variables },
        {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 120000,
            httpsAgent: keepAliveAgent,
            validateStatus: () => true,
        }
    ), label)

    if (res.status === 401 || res.status === 403) {
        const e = new Error(`Thinkific GraphQL auth rejected (HTTP ${res.status}) — check the API Access Token`)
        e.code = 'GRAPHQL_AUTH'
        throw e
    }
    if (res.data?.errors?.length) {
        const msg = res.data.errors.map(x => x.message).join('; ')
        const e = new Error(`Thinkific GraphQL error: ${msg}`)
        e.graphqlErrors = res.data.errors
        throw e
    }
    if (!res.data?.data) {
        throw new Error(`Thinkific GraphQL returned no data (HTTP ${res.status})`)
    }
    return res.data.data
}

/**
 * Execute a REST v1 call, preferring the new token (Bearer) and falling back to
 * the legacy key headers on 401/403 (or when no token is configured). Existing
 * services keep their own legacy calls; this is for new code + the spike.
 */
export async function thinkificRest(method, path, { params, data } = {}, { label = 'rest' } = {}) {
    const token = await getAccessToken()
    const url = `${REST_BASE}${path}`
    if (token) {
        await logModeOnce(label)
        const res = await withRetry(() => axios.request({
            method, url, params, data,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            timeout: 120000, httpsAgent: keepAliveAgent, validateStatus: () => true,
        }), label)
        if (res.status !== 401 && res.status !== 403) return res
        console.warn(`⚠️ [thinkific-auth] ${label}: access-token REST got ${res.status}, falling back to legacy key`)
    }
    // Legacy fallback
    const { apiKey, subdomain } = await getThinkificCredentials()
    console.log(`🔐 thinkific auth [${label}]: legacy-key (fallback)`)
    return withRetry(() => axios.request({
        method, url, params, data,
        headers: { 'X-Auth-API-Key': apiKey, 'X-Auth-Subdomain': subdomain, 'Content-Type': 'application/json' },
        timeout: 120000, httpsAgent: keepAliveAgent, validateStatus: () => true,
    }), label)
}

export { GRAPHQL_URL, REST_BASE }
