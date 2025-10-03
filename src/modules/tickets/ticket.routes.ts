import { Router } from "express";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { uploadTicketFile } from "@lib/multer";
import * as ctrl from "@modules/tickets/ticket.controller";

import { Ticket } from "@modules/tickets/ticket.model";
import { cldThumb, cldLarge } from "@lib/cloudinary.url";
import { Types } from "mongoose";

const r = Router();


r.post(
  "/gasolineras",
  (req, _res, next) => {
    console.log("CT:", req.headers["content-type"]);
    next();
  },
  requireAuth,
  uploadTicketFile.single("file"),
  ctrl.createFromGasolineras
);

r.post(
  "/peaje",
  (req, _res, next) => {
    console.log("CT:", req.headers["content-type"]);
    next();
  },
  requireAuth,
  uploadTicketFile.single("file"),
  ctrl.createFromPeaje
);


type Domain = "combustible" | "ev" | "peaje";

type TicketLean = {
  _id: Types.ObjectId;
  fecha: Date;
  domain: Domain;
  total?: number;
  importe?: number;
  empresaNombre?: string;
  status?: string;
  image?: { publicId?: string; url?: string };
  lineas?: unknown;
  estacion?: unknown;
  autopista?: string;
  formaPago?: string;
  referencia?: string | null;
  provincia?: string;
};

r.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: any = { userId };
    if (req.query.domain) filter.domain = String(req.query.domain);
    if (req.query.from || req.query.to) {
      filter.fecha = {};
      if (req.query.from) filter.fecha.$gte = new Date(String(req.query.from));
      if (req.query.to)   filter.fecha.$lt  = new Date(String(req.query.to));
    }

    const [items, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          fecha: 1,
          domain: 1,
          total: 1,
          importe: 1,
          empresaNombre: 1,
          status: 1,
          "image.publicId": 1,
          "image.url": 1,
        })
        .lean<TicketLean[]>(),
      Ticket.countDocuments(filter),
    ]);

    const mapped = items.map(t => ({
      id: String(t._id),
      fecha: t.fecha,
      domain: t.domain,
      total: t.total,
      importe: t.importe,
      empresaNombre: t.empresaNombre,
      status: t.status,
      imageUrl: t.image?.url,
      thumbnailUrl: cldThumb(t.image?.publicId),
    }));

    res.json({ page, limit, total, items: mapped });
  } catch (e) {
    next(e);
  }
});

r.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const t = await Ticket.findOne({ _id: req.params.id, userId: req.user!.id })
      .select({
        fecha: 1,
        domain: 1,
        total: 1,
        importe: 1,
        empresaNombre: 1,
        status: 1,
        lineas: 1,
        estacion: 1,
        autopista: 1,
        formaPago: 1,
        referencia: 1,
        provincia: 1,
        "image.publicId": 1,
        "image.url": 1,
      })
      .lean<TicketLean | null>();

    if (!t) return res.status(404).json({ error: "NOT_FOUND" });

    res.json({
      ...t,
      previewUrl: cldLarge(t.image?.publicId),
    });
  } catch (e) {
    next(e);
  }
});

export default r;
