import express, { Request, Response } from "express";
const router = express.Router();

router.all("/", function(req: Request, res: Response) {
    res.json({
        "author": "@openthingy",
        "request": {
            "ip": req.ip,
            "id": res.getHeader("X-Request-Id")
        }
    });
});

export default router;