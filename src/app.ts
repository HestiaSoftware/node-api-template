import createError, { HttpError } from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import walkSync from "walk-sync";
import crypto from "crypto";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(function (req: Request, res: Response, next: NextFunction) {
    const reqId = crypto.randomUUID(); // Generate a unique ID for each request
    res.setHeader("X-Request-Id", reqId);
    next();
});

// At some point we've gotta change this
const dir = "./routes/";
const paths = walkSync(dir, { directories: false });
paths.forEach(function (value: string) {
    const value_nojs = value.slice(0, -3); //removes .js, assuming all files are .js
    if (value.endsWith("index.js")) {
        const value_index = value.slice(0, -8);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        app.use("/" + value_index, require(dir + value_nojs)); // Route: /test
    } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        app.use("/" + value_nojs, require(dir + value_nojs));
    }
});

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