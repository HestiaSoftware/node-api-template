import path from "path";
import { checkSpecRoutes, getOpenAPIRoutes, getRoutes } from "../middleware/routing";

const routes = getRoutes(path.join(__dirname, "..", "routes"));
const specRoutes = getOpenAPIRoutes(path.join(__dirname, "..", "openapi.yml"));
checkSpecRoutes(routes, specRoutes);
