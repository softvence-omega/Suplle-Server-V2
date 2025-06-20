import express from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { ownerController } from "./owner.controller";
import { ownerPostValidation, ownerUpdateValidation } from "./owner.validation";

import { ROLE } from "../user/users.constant";
import { authenticate } from "../../../middlewares/authGuard";

const router = express.Router();

router.post(
  "/post_owner",
  validateRequest(ownerPostValidation),
  ownerController.postOwner
);

router.get("/get_all_owner", ownerController.getAllOwner);
router.get("/get-single-owner/:id", authenticate(ROLE.ADMIN, ROLE.RESTAURANT_OWNER), ownerController.getSingleOwner);
router.put(
  "/update-owner", authenticate(ROLE.ADMIN, ROLE.RESTAURANT_OWNER),
  validateRequest(ownerUpdateValidation),
  ownerController.updateOwner
);
router.delete("/delete_owner/:id", ownerController.deleteOwner);

export const ownerRoutes = router;
