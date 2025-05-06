# AI Integration Guide for MCP Server

This document explains how to integrate AI applications with the MCP server, focusing on practical implementation details and best practices.

## Table of Contents

1. [Introduction](#introduction)
2. [AI Integration Architecture](#ai-integration-architecture)
3. [Implementing AI-Driven Tool Selection](#implementing-ai-driven-tool-selection)
4. [Handling Tool Results in AI Applications](#handling-tool-results-in-ai-applications)
5. [Security Considerations](#security-considerations)
6. [Advanced Integration Patterns](#advanced-integration-patterns)
7. [Example: Integrating with Claude](#example-integrating-with-claude)
8. [Example: Integrating with Custom AI Applications](#example-integrating-with-custom-ai-applications)

## Introduction

The MCP (Model Context Protocol) server provides a standardized way for AI applications to interact with system resources. This guide focuses on how to effectively integrate AI models with the MCP server to create powerful, context-aware applications.

## AI Integration Architecture

A typical AI integration with the MCP server involves these components:

1. **AI Model**: The language model or AI system (e.g., Claude, GPT, or custom model)
2. **MCP Client**: A client library that handles communication with the MCP server
3. **Tool Selection Logic**: Code that determines which tools to invoke based on AI output
4. **Result Processing**: Logic that processes tool results and feeds them back to the AI
5. **User Interface**: Components that display results and gather user input

The general flow is:
1. User provides input to the AI
2. AI determines required system actions
3. Integration layer invokes appropriate MCP tools
4. MCP server executes the tools and returns results
5. Results are processed and fed back to the AI
6. AI generates a response incorporating the tool results
7. Response is presented to the user

## Implementing AI-Driven Tool Selection

There are several approaches to implementing tool selection based on AI output:

### 1. Structured Output Parsing

Have the AI generate structured output (JSON, XML, etc.) that explicitly specifies which tools to invoke:

```javascript
// Example AI output
{
  "action": "runShellCommand",
  "parameters": {
    "command": "ls -la /home/user/documents"
  },
  "reason": "Need to list files in the documents directory to find PDF files"
}
```

Implementation:
```javascript
async function processAIResponse(aiResponse) {
  try {
    const action = JSON.parse(aiResponse);
    if (action.action && mcpClient.hasToolNamed(action.action)) {
      const result = await mcpClient.invokeTool(action.action, action.parameters);
      return result;
    }
  } catch (error) {
    console.error("Error processing AI response:", error);
  }
}
```

### 2. Function Calling

If your AI model supports function calling (like Claude or GPT-4), you can define functions that map to MCP tools:

```javascript
// Define functions that map to MCP tools
const functions = [
  {
    name: "runShellCommand",
    description: "Run a terminal command in the system shell",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute"
        }
      },
      required: ["command"]
    }
  },
  // More function definitions...
];

// When calling the AI model
const response = await aiModel.generateContent({
  messages: [{ role: "user", content: userInput }],
  tools: functions
});

// Process the function call
if (response.functionCall) {
  const result = await mcpClient.invokeTool(
    response.functionCall.name,
    response.functionCall.arguments
  );
  // Feed result back to AI...
}
```

### 3. Pattern Matching

For simpler integrations, use pattern matching to detect tool invocation in AI output:

```javascript
function detectToolInvocation(aiOutput) {
  const toolPattern = /\[TOOL:(.*?)\]\s*\{(.*?)\}/g;
  const matches = [...aiOutput.matchAll(toolPattern)];

  return matches.map(match => {
    const toolName = match[1].trim();
    const paramsJson = match[2].trim();
    try {
      const params = JSON.parse(paramsJson);
      return { toolName, params };
    } catch (error) {
      console.error(`Invalid tool parameters: ${paramsJson}`);
      return null;
    }
  }).filter(Boolean);
}
```

## Handling Tool Results in AI Applications

Once a tool has been invoked, the results need to be processed and fed back to the AI:

1. **Format Results**: Convert raw tool output to a format suitable for the AI
2. **Provide Context**: Include information about which tool was called and why
3. **Handle Errors**: Gracefully handle and explain any errors that occurred
4. **Maintain Conversation History**: Include previous interactions for context

Example:

```javascript
async function executeToolAndUpdateAI(aiClient, mcpClient, toolName, params) {
  try {
    // Invoke the tool
    const result = await mcpClient.invokeTool(toolName, params);

    // Format the result for the AI
    const formattedResult = formatToolResult(toolName, params, result);

    // Update the AI with the result
    return await aiClient.continueConversation({
      message: `I executed the ${toolName} tool with the parameters you specified. Here's the result:\n\n${formattedResult}`
    });
  } catch (error) {
    // Handle errors
    return await aiClient.continueConversation({
      message: `I tried to execute the ${toolName} tool, but encountered an error: ${error.message}`
    });
  }
}

function formatToolResult(toolName, params, result) {
  // Different formatting based on tool type
  switch (toolName) {
    case 'readFile':
      return `Content of file ${params.filePath}:\n\`\`\`\n${result.content[0].text}\n\`\`\``;
    case 'runShellCommand':
      return `Command output:\n\`\`\`\n${result.content[0].text}\n\`\`\``;
    // Handle other tools...
    default:
      return JSON.stringify(result, null, 2);
  }
}
```

## Security Considerations

When integrating AI with system tools, security is paramount:

1. **Input Validation**: Validate all parameters before passing them to MCP tools
2. **Permission Boundaries**: Limit the tools available to the AI based on required permissions
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Audit Logging**: Log all tool invocations for security auditing
5. **Sandboxing**: Consider running the MCP server in a sandboxed environment
6. **User Confirmation**: For destructive operations, require explicit user confirmation

Example security wrapper:

```javascript
class SecureMcpClient {
  constructor(mcpClient, securityOptions) {
    this.mcpClient = mcpClient;
    this.allowedTools = securityOptions.allowedTools || [];
    this.maxInvocationsPerMinute = securityOptions.maxInvocationsPerMinute || 10;
    this.requireConfirmation = securityOptions.requireConfirmation || [];
    this.invocationCount = 0;
    this.resetTime = Date.now();
  }

  async invokeTool(toolName, parameters) {
    // Check if tool is allowed
    if (!this.allowedTools.includes(toolName)) {
      throw new Error(`Tool '${toolName}' is not allowed in this context`);
    }

    // Rate limiting
    if (this.invocationCount >= this.maxInvocationsPerMinute) {
      const now = Date.now();
      if (now - this.resetTime < 60000) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      this.invocationCount = 0;
      this.resetTime = now;
    }

    // Require confirmation for destructive operations
    if (this.requireConfirmation.includes(toolName)) {
      const confirmed = await this.getConfirmation(toolName, parameters);
      if (!confirmed) {
        throw new Error('Operation not confirmed by user');
      }
    }

    // Log the invocation
    console.log(`[AUDIT] Tool invocation: ${toolName}`, parameters);

    // Increment counter and invoke the tool
    this.invocationCount++;
    return await this.mcpClient.invokeTool(toolName, parameters);
  }

  async getConfirmation(toolName, parameters) {
    // Implementation depends on your UI framework
    // This is just a placeholder
    return confirm(`Allow AI to execute ${toolName} with parameters: ${JSON.stringify(parameters)}?`);
  }
}
```

## Advanced Integration Patterns

### Tool Discovery and Adaptation

For more flexible AI integrations, implement dynamic tool discovery:

```javascript
async function initializeAIWithTools(aiClient, mcpClient) {
  // Fetch available tools from the MCP server
  const toolsInfo = await mcpClient.getTools();

  // Format tools information for the AI
  const toolsDescription = formatToolsForAI(toolsInfo);

  // Initialize the AI with tools information
  await aiClient.initializeSession({
    systemPrompt: `You have access to the following system tools:\n\n${toolsDescription}\n\nWhen you need to use a tool, format your response as [TOOL:tool_name] {parameters_json}`
  });
}

function formatToolsForAI(toolsInfo) {
  return toolsInfo.tools.map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([name, info]) => `  - ${name}: ${info.type} ${info.required ? '(required)' : '(optional)'} - ${info.description}`)
      .join('\n');

    return `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters:\n${params}\nExample: ${tool.examples[0]}\n`;
  }).join('\n---\n');
}
```

### Stateful Tool Execution

For complex workflows, implement stateful tool execution:

```javascript
class WorkflowExecutor {
  constructor(mcpClient) {
    this.mcpClient = mcpClient;
    this.workflowState = {};
  }

  async executeWorkflow(steps) {
    const results = [];

    for (const step of steps) {
      // Replace variables in parameters with values from previous steps
      const processedParams = this.processParameters(step.parameters);

      // Execute the tool
      const result = await this.mcpClient.invokeTool(step.tool, processedParams);

      // Store the result in the workflow state
      this.workflowState[step.id] = result;

      // Add to results array
      results.push({
        stepId: step.id,
        tool: step.tool,
        parameters: processedParams,
        result
      });

      // Check for conditional execution
      if (step.condition && !this.evaluateCondition(step.condition, result)) {
        break;
      }
    }

    return results;
  }

  processParameters(parameters) {
    // Deep clone the parameters
    const processed = JSON.parse(JSON.stringify(parameters));

    // Replace variables with values from workflow state
    const replaceVariables = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string' && obj[key].startsWith('$')) {
          const varPath = obj[key].substring(1).split('.');
          let value = this.workflowState;

          for (const pathPart of varPath) {
            value = value[pathPart];
            if (value === undefined) break;
          }

          if (value !== undefined) {
            obj[key] = value;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceVariables(obj[key]);
        }
      }
    };

    replaceVariables(processed);
    return processed;
  }

  evaluateCondition(condition, result) {
    // Simple condition evaluation
    try {
      // This is a simplified example - in production, use a proper expression evaluator
      return new Function('result', `return ${condition}`)(result);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }
}
```

## Example: Integrating with Claude

Here's how to integrate the MCP server with Claude:

1. **Setup Claude Configuration**:

```json
{
  "mcpServers": {
    "local-tools": {
      "url": "http://localhost:8080/sse",
      "command": "local-tools"
    }
  }
}
```

2. **Prompt Claude to Use the MCP Server**:

```
I have an MCP server running locally at http://localhost:8080. Please use this server to help me manage my files and execute commands. You can use tools like runShellCommand, readFile, and createFile.
```

3. **Claude Will Connect and Discover Tools**:
   - Claude establishes an SSE connection to the MCP server
   - It receives a client ID and discovers available tools
   - It can now invoke tools based on your requests

4. **Example Interaction**:

User: "Can you list the files in my current directory and then create a new text file called notes.txt with today's date as content?"

Claude: "I'll help you with that. First, let me list the files in your current directory."

[Claude invokes `runShellCommand` with `ls -la`]

Claude: "Here are the files in your current directory:
[file listing output]

Now, I'll create a new text file called notes.txt with today's date."

[Claude invokes `createFile` with appropriate parameters]

Claude: "I've created the file notes.txt with today's date as content. You can now edit it or view it as needed."

## Example: Integrating with Custom AI Applications

For custom AI applications, you'll need to implement the MCP client and integration logic:

```javascript
import { OpenAI } from 'openai';
import { McpClient } from './mcp-client.js';

class AIToolsIntegration {
  constructor(apiKey, mcpServerUrl) {
    this.ai = new OpenAI({ apiKey });
    this.mcpClient = new McpClient(mcpServerUrl);
    this.conversationHistory = [];
  }

  async initialize() {
    // Connect to MCP server
    await this.mcpClient.connect();
    console.log(`Connected to MCP server with client ID: ${this.mcpClient.clientId}`);

    // Get available tools
    const toolsInfo = await this.mcpClient.getTools();
    this.availableTools = toolsInfo.tools;

    // Format tools as OpenAI functions
    this.functions = this.availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: Object.entries(tool.parameters).reduce((acc, [name, info]) => {
          acc[name] = {
            type: info.type,
            description: info.description
          };
          return acc;
        }, {}),
        required: Object.entries(tool.parameters)
          .filter(([_, info]) => info.required)
          .map(([name, _]) => name)
      }
    }));
  }

  async processUserInput(userInput) {
    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: userInput });

    // Get AI response with function calling
    const response = await this.ai.chat.completions.create({
      model: 'gpt-4',
      messages: this.conversationHistory,
      functions: this.functions,
      function_call: 'auto'
    });

    const aiMessage = response.choices[0].message;

    // Check if the AI wants to call a function
    if (aiMessage.function_call) {
      const { name, arguments: argsString } = aiMessage.function_call;
      const args = JSON.parse(argsString);

      console.log(`AI is calling function: ${name} with args:`, args);

      // Execute the tool via MCP
      try {
        const result = await this.mcpClient.invokeTool(name, args);

        // Add function result to conversation
        this.conversationHistory.push({
          role: 'function',
          name,
          content: JSON.stringify(result)
        });

        // Get AI's interpretation of the result
        return this.processToolResult(aiMessage, name, result);
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);

        // Add error to conversation
        this.conversationHistory.push({
          role: 'function',
          name,
          content: JSON.stringify({ error: error.message })
        });

        // Get AI's response to the error
        return this.processToolError(aiMessage, name, error);
      }
    } else {
      // Regular response without function call
      this.conversationHistory.push(aiMessage);
      return aiMessage.content;
    }
  }

  async processToolResult(aiMessage, toolName, result) {
    // Get AI's interpretation of the tool result
    const response = await this.ai.chat.completions.create({
      model: 'gpt-4',
      messages: this.conversationHistory
    });

    const resultMessage = response.choices[0].message;
    this.conversationHistory.push(resultMessage);

    return resultMessage.content;
  }

  async processToolError(aiMessage, toolName, error) {
    // Get AI's response to the tool error
    const response = await this.ai.chat.completions.create({
      model: 'gpt-4',
      messages: this.conversationHistory
    });

    const errorMessage = response.choices[0].message;
    this.conversationHistory.push(errorMessage);

    return errorMessage.content;
  }
}
```