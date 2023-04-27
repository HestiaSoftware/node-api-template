import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface Route {
    route: string;
    file: string;
}

interface OpenAPI { //thanks chat-gpt
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

export async function getRoutes(dirPath: string, result: Route[] = []) {
    try {
        const files = await fs.promises.readdir(dirPath);
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fullPath = path.join(dirPath, file);
            const stats = await fs.promises.stat(fullPath);
  
            if (stats.isDirectory()) {
                // Recursively walk through subdirectory
                await getRoutes(fullPath, result);
            } else {
                // Add file path to result array
                const extension = path.extname(fullPath);
                if (extension == ".js" || extension == ".ts") {
                    //remove the file directory and switch to / (\\..\\routes\\a.ts -> /../routes/a.ts -> /a.ts)
                    dirPath = dirPath.replace("\\", "/");
                    let route = "/" + fullPath.replaceAll("\\", "/").replace(dirPath, "").replace(extension, "");
                    if (route.endsWith("index")) {
                        route = route.replace("/index", "/");
                    }
                    const object: Route = {
                        "route": route,
                        "file": fullPath
                    };
                    result.push(object);
                }
            }
        }
  
        return result;
    } catch (err) {
        console.error("Error walking directory:", err);
        return result;
    }
}

export async function getOpenAPIRoutes(yamlPath: string) {
    const file = fs.readFileSync(yamlPath, "utf8");
    const openapi = (yaml.load(file) as OpenAPI)["paths"];
    const routes = [];
    for (const route in openapi) {
        routes.push(route);
    }
    return routes;
}

function checkDuplicateRoutes(routes: Route[]) {
    // route 1 -> /a/ (/a/index.ts)
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


async function main() {
    console.log(await getRoutes("../routes"));

}

main();