import express, { Request, Response } from "express";
const router = express.Router();

router.all("/", function(req: Request, res: Response) {
    res.json({"hello": "world"});
});

module.exports =  router;