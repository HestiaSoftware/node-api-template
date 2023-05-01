import createError, { HttpError } from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { getRoutes } from "./middleware/routing.js";
import path from "path";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req: Request, res: Response, next: NextFunction) {
    const reqId = crypto.randomUUID(); // Generate a unique ID for each request
    res.setHeader("X-Request-Id", reqId);
    next();
});

const routes = getRoutes(path.join(__dirname, "routes"));
for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app.use(route.route, require(route.file).default);
}


// catch 404 and forward to error handler
app.use(function(req: Request , res: Response, next: NextFunction) {
    return next(createError(404));
});

// error handler
// this disables the next is unused warning, for some reason its required
// or else the error handler just straight up stops working
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
    // render the error page
    res.status(err.status || 500);
    res.json({"code": err.status, "error.message":err.message});
});

export default app;