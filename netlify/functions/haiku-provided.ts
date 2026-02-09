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
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: 'Method not allowed' }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Server not configured' }) }
  }

  try {
    const { messages, maxTokens, temperature } = JSON.parse(event.body || '{}')

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'messages required' }) }
    }

    // Extract system message
    const systemMessages = messages.filter((m: any) => m.role === 'system')
    const chatMessages = messages.filter((m: any) => m.role !== 'system')
    const systemText = systemMessages.map((m: any) => m.content).join('\n')

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens || 1024,
        temperature: temperature ?? 0.85,
        system: systemText
          ? [{ type: 'text', text: systemText, cache_control: { type: 'ephemeral' } }]
          : undefined,
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
