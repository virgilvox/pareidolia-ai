import type { Handler } from '@netlify/functions'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { apiKey, model, messages, maxTokens, temperature, system, cacheControl } = JSON.parse(event.body || '{}')

    if (!apiKey || !model || !messages) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'apiKey, model, and messages required' }) }
    }

    // Use explicit system field if provided, otherwise extract from messages
    let systemParam: any = undefined
    if (system) {
      const systemText = typeof system === 'string' ? system : ''
      if (systemText) {
        systemParam = cacheControl !== false
          ? [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }]
          : systemText
      }
    } else {
      const systemMessages = messages.filter((m: any) => m.role === 'system')
      const systemText = systemMessages.map((m: any) => m.content).join('\n')
      if (systemText) {
        systemParam = [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }]
      }
    }

    const chatMessages = messages.filter((m: any) => m.role !== 'system')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 1024,
        temperature: temperature ?? 0.85,
        system: systemParam,
        messages: chatMessages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errText }),
      }
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ text }),
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal error' }),
    }
  }
}

export { handler }
