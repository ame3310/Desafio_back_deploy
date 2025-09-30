import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { uploadTicketFile } from "@lib/multer";
import * as ctrl from "@modules/tickets/ticket.controller";

const r = Router();

r.post(
  "/gasolineras",
  (req, _res, next) => {
    console.log("CT:", req.headers["content-type"]); //multipart/form-data
    next();
  },
  requireAuth,
  uploadTicketFile.single("file"),
  ctrl.createFromGasolineras
);

r.post(
  "/peaje",
  (req, _res, next) => {
    console.log("CT:", req.headers["content-type"]); //multipart/form-data
    next();
  },
  requireAuth,
  uploadTicketFile.single("file"),
  ctrl.createFromPeaje
);

export default r;
