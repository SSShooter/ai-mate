/**
 * AI Mate Chrome Extension - Cloudflare Worker 同步服务
 * 
 * 部署说明：
 * 1. 在 Cloudflare Dashboard 中创建一个新的 Worker
 * 2. 将此代码复制到 Worker 编辑器中
 * 3. 创建一个 KV 命名空间，命名为 "AI_MATE_SYNC"
 * 4. 在 Worker 设置中绑定 KV 命名空间：变量名 "AI_MATE_SYNC"，KV 命名空间选择刚创建的
 * 5. 部署 Worker 并获取 Worker URL
 * 6. 在 Chrome 插件中配置 Worker URL 和自定义的 API Key
 */

// CORS 头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// 处理 CORS 预检请求
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

// 创建响应的辅助函数
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

// 验证 API Key
function validateApiKey(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7) // 移除 "Bearer " 前缀
}

// 合并数据的核心逻辑 - Last-Write-Wins 策略，支持软删除
function mergeData(clientData, serverData) {
  const merged = {
    records: [],
    prompts: [],
    settings: clientData.settings, // 设置通常采用客户端版本
    lastSyncTime: Date.now()
  }

  // 合并 records
  const allRecords = new Map()

  // 先添加服务器端的记录
  if (serverData && serverData.records) {
    serverData.records.forEach(record => {
      allRecords.set(record.id, record)
    })
  }

  // 再添加客户端的记录，如果时间戳更新则覆盖
  if (clientData.records) {
    clientData.records.forEach(record => {
      const existing = allRecords.get(record.id)
      if (!existing || record.updatedAt > existing.updatedAt) {
        allRecords.set(record.id, record)
      }
    })
  }

  // 过滤掉已删除的记录，但保留删除标记用于同步
  merged.records = Array.from(allRecords.values())

  // 合并 prompts
  const allPrompts = new Map()

  // 先添加服务器端的提示
  if (serverData && serverData.prompts) {
    serverData.prompts.forEach(prompt => {
      allPrompts.set(prompt.id, prompt)
    })
  }

  // 再添加客户端的提示，如果时间戳更新则覆盖
  if (clientData.prompts) {
    clientData.prompts.forEach(prompt => {
      const existing = allPrompts.get(prompt.id)
      if (!existing || prompt.updatedAt > existing.updatedAt) {
        allPrompts.set(prompt.id, prompt)
      }
    })
  }

  // 过滤掉已删除的提示，但保留删除标记用于同步
  merged.prompts = Array.from(allPrompts.values())

  return merged
}

// 主要的请求处理函数
async function handleRequest(request, env) {
  const url = new URL(request.url)
  
  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  // 验证 API Key
  const apiKey = validateApiKey(request)
  if (!apiKey) {
    return createResponse({ error: 'Missing or invalid API key' }, 401)
  }

  // 只处理 /sync 端点
  if (url.pathname !== '/sync') {
    return createResponse({ error: 'Endpoint not found' }, 404)
  }

  // 只接受 POST 请求
  if (request.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // 解析客户端发送的数据
    const clientData = await request.json()
    
    // 验证数据格式
    if (!clientData || typeof clientData !== 'object') {
      return createResponse({ error: 'Invalid data format' }, 400)
    }

    // 从 KV 存储中获取服务器端数据
    const serverDataJson = await env.AI_MATE_SYNC.get(apiKey)
    let serverData = null
    
    if (serverDataJson) {
      try {
        serverData = JSON.parse(serverDataJson)
      } catch (e) {
        console.error('Failed to parse server data:', e)
        // 如果解析失败，将服务器数据视为空
        serverData = null
      }
    }

    // 合并客户端和服务器端数据
    const mergedData = mergeData(clientData, serverData)

    // 将合并后的数据保存到 KV 存储
    await env.AI_MATE_SYNC.put(apiKey, JSON.stringify(mergedData))

    // 返回合并后的完整数据给客户端
    return createResponse({
      success: true,
      data: mergedData,
      message: 'Sync completed successfully'
    })

  } catch (error) {
    console.error('Sync error:', error)
    return createResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
}

// Worker 入口点
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env)
  }
}
