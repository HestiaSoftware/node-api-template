import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface Route {
    route: string;
    file: string;
}

//Thanks ChatGPT
interface OpenAPI { 
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
      termsOfService?: string;
      contact?: {
        name?: string;
        url?: string;
        email?: string;
      };
      license?: {
        name: string;
        url?: string;
      };
    };
    paths: {
      [path: string]: {
        [method: string]: {
          summary?: string;
          description?: string;
          operationId?: string;
          responses?: {
            [statusCode: string]: {
              description?: string;
              content?: {
                [mimeType: string]: {
                  schema?: {
                    $ref?: string;
                    type?: string;
                    properties?: {
                      [propertyName: string]: {
                        $ref?: string;
                        type?: string;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    components?: {
      schemas?: {
        [schemaName: string]: {
          $ref?: string;
          type?: string;
          properties?: {
            [propertyName: string]: {
              $ref?: string;
              type?: string;
            };
          };
        };
      };
    };
}

export function walkDir(dirPath: string, result: string[] = []) {
    try {
        const files = fs.readdirSync(dirPath);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fullPath = path.join(dirPath, file);
            const stats =  fs.statSync(fullPath);
  
            if (stats.isDirectory()) {
                // Recursively walk through subdirectory
                walkDir(fullPath, result);
            } else {
                // Add file path to result array
                const extension = path.extname(fullPath);
                if (extension == ".js" || extension == ".ts") {
                    result.push(fullPath);
                }
            }
        }
  
        return result;
    } catch (err) {
        console.error("Error walking directory:", err);
        return result;
    }
}

export function getRoutes(dirPath: string) {
    const files = walkDir(dirPath);
    const routes: Route[] = [];

    for (const file of files) {
        const extension = path.extname(file);
        // /routes/a/b/c.ts -> /a/b/c
        let route = file.replace(dirPath, "").replace(/\\/g, "/").replace(extension, "");
        // /routes/index.ts -> /
        if (route == "/index") { route = route.replace("/index", "/"); }
        // /routes/a/b/index.ts -> /a/b
        else if (route.endsWith("/index")) { route = route.replace("/index", ""); }
        routes.push({
            route,
            file
        });
    }

    checkDuplicateRoutes(routes);
    return routes;
}

export function getOpenAPIRoutes(specPath: string) {
    const file = fs.readFileSync(specPath, "utf8");
    const openapi = (yaml.load(file) as OpenAPI)["paths"];
    const routes = [];
    for (const route in openapi) {
        routes.push(route);
    }
    return routes;
}

function checkDuplicateRoutes(routes: Route[]) {
    // route 1 -> /a (/a/index.ts)
    // route 2 -> /a  (/a.ts)
    // This is a duplicate route
    const routeSet = new Set<string>();

    for (const { route } of routes) {
        if (routeSet.has(route)) {
            throw new Error(`Duplicate route found: ${route}`);
        }
        routeSet.add(route);
    }
}

function checkSpecRoutes(routes: Route[], specRoutes: string[]) {
    if (routes.length !== specRoutes.length) {
        if (process.env.NODE_ENV == "development" || process.env.NODE_ENV == undefined) {
            console.warn("Not the exact same number of routes"); 
        } else { 
            throw new Error("Not the exact same number of routes"); 
        }
    }
    
    for (const { route } of routes) {
        if (!specRoutes.includes(route)) {
            if (process.env.NODE_ENV == "development" || process.env.NODE_ENV == undefined) {
                console.warn(`Route not found in spec: ${route}`);
            } else { 
                throw new Error(`Route not found in spec: ${route}`); 
            }
        }
    }
    
}

// If this file is run directly, run the following code
if (require.main === module) {
    console.log(getRoutes(path.join(__dirname, "..", "routes")));
    checkSpecRoutes(getRoutes(path.join(__dirname, "..", "routes")), getOpenAPIRoutes(path.join(__dirname, "..", "..", "openapi.yml")));
}