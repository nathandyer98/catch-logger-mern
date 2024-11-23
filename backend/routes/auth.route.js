import express from "express";

const router = express.Router();

router.post("/signup", (req, res) => {
    res.send("Signup route");
})

router.post("/login", (req, res) => {
    res.send("login route");
})

router.post("/loguout", (req, res) => {
    res.send("loguout route");
})

export default router;