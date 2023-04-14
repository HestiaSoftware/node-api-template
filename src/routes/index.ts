import express, { Request, Response } from "express";
const router = express.Router();

router.all("/", function(req: Request, res: Response) {
    res.json({
        "poluino": {
            "version": "0.1alpha",
            "codename": "salmon"
        },
        "author": "@openthingy",
        "request": {
            "ip": req.ip,
            "id": res.getHeader("X-Request-Id")
        }
    });
});

module.exports = router;