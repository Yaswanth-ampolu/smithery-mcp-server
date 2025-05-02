import express, { Router } from "express";
/**
 * Generate example usage for a tool based on its parameters
 */
export function generateExamples(toolName, parameters) {
    const examples = [];
    // Create a basic example with required parameters
    const requiredParams = Object.entries(parameters)
        .filter(([_, info]) => info.required)
        .reduce((acc, [name, _]) => {
        // Generate appropriate example values based on parameter name
        let exampleValue = '';
        if (name.toLowerCase().includes('path')) {
            exampleValue = name.toLowerCase().includes('source') ?
                '"file.txt"' :
                name.toLowerCase().includes('dir') ?
                    '"directory"' :
                    '"newfile.txt"';
        }
        else if (name.toLowerCase().includes('content')) {
            exampleValue = '"Sample content"';
        }
        else if (name.toLowerCase().includes('command')) {
            exampleValue = '"ls -la"';
        }
        else if (name.toLowerCase() === 'pattern') {
            exampleValue = '"search term"';
        }
        else {
            exampleValue = '""';
        }
        acc[name] = exampleValue;
        return acc;
    }, {});
    examples.push(`${toolName}(${JSON.stringify(requiredParams, null, 2)})`);
    return examples;
}
/**
 * Create a router for the tools endpoints
 */
export function createToolsRouter(server) {
    const router = express.Router();
    // Tools discovery endpoint
    router.get('/', function (_req, res) {
        try {
            // Extract tool information from the MCP server
            // @ts-ignore - Accessing private property for tool discovery
            const toolsMap = server['_registeredTools'];
            if (!toolsMap) {
                return res.status(500).json({
                    error: 'Failed to access tools information',
                    message: 'Could not extract tools from the MCP server instance'
                });
            }
            // Convert the tools map to an array of tool information objects
            const tools = [];
            // Iterate through the tools object
            for (const name of Object.keys(toolsMap)) {
                try {
                    // @ts-ignore - Accessing tool properties
                    const toolInfo = toolsMap[name];
                    // @ts-ignore - Accessing tool properties
                    const description = toolInfo.description || 'No description available';
                    // @ts-ignore - Accessing tool properties
                    const inputSchema = toolInfo.inputSchema || {};
                    // Convert Zod schema to a more readable format
                    const paramSchema = {};
                    // Extract parameter information from the inputSchema
                    // @ts-ignore - Accessing Zod schema properties
                    if (inputSchema.shape) {
                        // @ts-ignore - Accessing Zod schema properties
                        for (const paramName of Object.keys(inputSchema.shape)) {
                            try {
                                // @ts-ignore - Accessing Zod schema properties
                                const schema = inputSchema.shape[paramName];
                                const paramInfo = {
                                    // @ts-ignore - Accessing Zod schema properties
                                    type: schema._def?.typeName || 'unknown',
                                    // @ts-ignore - Accessing Zod schema properties
                                    description: schema._def?.description || '',
                                    // @ts-ignore - Accessing Zod schema properties
                                    required: !schema._def?.isOptional
                                };
                                // Add enum values if available
                                // @ts-ignore - Accessing Zod schema properties
                                if (schema._def?.values) {
                                    // @ts-ignore - Accessing Zod schema properties
                                    paramInfo.enum = schema._def.values;
                                }
                                paramSchema[paramName] = paramInfo;
                            }
                            catch (paramError) {
                                console.error(`Error processing parameter ${paramName}:`, paramError);
                                paramSchema[paramName] = { type: 'unknown', description: 'Error processing parameter' };
                            }
                        }
                    }
                    else {
                        // If no shape property, use an empty parameter schema
                        // This shouldn't happen with properly defined tools
                    }
                    tools.push({
                        name,
                        description,
                        parameters: paramSchema,
                        examples: generateExamples(name, paramSchema)
                    });
                }
                catch (toolError) {
                    console.error(`Error processing tool ${name}:`, toolError);
                }
            }
            return res.status(200).json({
                count: tools.length,
                tools
            });
        }
        catch (error) {
            console.error('Error generating tools documentation:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : String(error)
            });
        }
    });
    return router;
}
//# sourceMappingURL=tools-endpoint.js.map