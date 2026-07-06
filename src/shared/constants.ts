// Shared constants

import type { ProviderAdapterInfo } from './types/provider'

export const APP_NAME = 'Aureon Desk'
export const DB_FILENAME = 'ivory.db'
export const IMPORTS_DIR = 'imports'

export const PROVIDER_ADAPTERS: ProviderAdapterInfo[] = [
  {
    slug: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models via Anthropic API',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', contextWindow: 200000 },
      { name: 'claude-opus-4-20250514', displayName: 'Claude Opus 4', contextWindow: 200000 },
      { name: 'claude-haiku-3-5-20241022', displayName: 'Claude 3.5 Haiku', contextWindow: 200000 }
    ]
  },
  {
    slug: 'openai',
    name: 'OpenAI',
    description: 'GPT models via OpenAI API',
    defaultBaseUrl: 'https://api.openai.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming', 'json_mode', 'embeddings'],
    defaultModels: [
      { name: 'gpt-4o', displayName: 'GPT-4o', contextWindow: 128000 },
      { name: 'gpt-4o-mini', displayName: 'GPT-4o Mini', contextWindow: 128000 }
    ]
  },
  {
    slug: 'google',
    name: 'Google Gemini',
    description: 'Gemini models via Google AI',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', contextWindow: 1048576 },
      { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', contextWindow: 1048576 }
    ]
  },
  {
    slug: 'mistral',
    name: 'Mistral AI',
    description: 'Mistral models via Mistral API',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming', 'json_mode'],
    defaultModels: [
      { name: 'mistral-large-latest', displayName: 'Mistral Large', contextWindow: 128000 },
      { name: 'mistral-small-latest', displayName: 'Mistral Small', contextWindow: 32000 }
    ]
  },
  {
    slug: 'groq',
    name: 'Groq',
    description: 'Fast inference via Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'llama-4-scout-17b-16e-instruct', displayName: 'Llama 4 Scout', contextWindow: 131072 }
    ]
  },
  {
    slug: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek models via DeepSeek API',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'deepseek-chat', displayName: 'DeepSeek Chat', contextWindow: 131072 }
    ]
  },
  {
    slug: 'openrouter',
    name: 'OpenRouter',
    description: 'Multi-provider routing via OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    authType: 'api_key',
    capabilities: ['text', 'tool_use', 'streaming'],
    defaultModels: [
      { name: 'openrouter/auto', displayName: 'Auto (best model)', contextWindow: 200000 }
    ]
  },
  {
    slug: 'ollama',
    name: 'Ollama',
    description: 'Local models via Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    authType: 'none',
    capabilities: ['text', 'streaming', 'local'],
    defaultModels: []
  },
  {
    slug: 'lmstudio',
    name: 'LM Studio',
    description: 'Local models via LM Studio',
    defaultBaseUrl: 'http://localhost:1234/v1',
    authType: 'none',
    capabilities: ['text', 'streaming', 'local'],
    defaultModels: []
  },
  {
    slug: 'custom',
    name: 'Custom OpenAI-Compatible',
    description: 'Any OpenAI-compatible API endpoint',
    defaultBaseUrl: 'http://localhost:8000/v1',
    authType: 'api_key',
    capabilities: ['text', 'vision', 'tool_use', 'streaming', 'json_mode'],
    defaultModels: []
  }
]
