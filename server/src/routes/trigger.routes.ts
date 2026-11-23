import { Router } from "express";

import { receiveWebhookTrigger } from "../controllers/trigger.controller";

const router = Router();

// Public endpoint secured by workflow webhook secret and active-status checks.
router.post("/webhook/:id", receiveWebhookTrigger);

export default router;