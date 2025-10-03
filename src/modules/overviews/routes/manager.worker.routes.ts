import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "@middlewares/requireAuth.middleware";
import { requireRole } from "@middlewares/requireRole.middleware";
import { Types } from "mongoose";

import { User } from "@modules/users/user.model";
import { Ticket } from "@modules/tickets/ticket.model";
import { cldThumb, cldLarge } from "@lib/cloudinary.url";

const r = Router();

type WorkerItem = {
  userId: string;
  username: string;
  email: string;
  thumbnailUrl?: string;
};

type LastImgAgg = { _id: Types.ObjectId; publicId?: string };

r.get(
  "/workers",
  requireAuth,
  requireRole("manager"),
  async (req, res, next) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId)
        return res.status(400).json({ error: "MANAGER_WITHOUT_COMPANY" });

      const q = z
        .object({
          q: z.string().optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          include: z.string().optional(), 
        })
        .parse(req.query);

      const include = new Set((q.include ?? "").split(",").filter(Boolean));

      const filter: Record<string, unknown> = { role: "user", companyId };
      if (q.q) {
        filter.$or = [
          { usernameLower: { $regex: q.q.toLowerCase(), $options: "i" } },
          { email: { $regex: q.q, $options: "i" } },
        ];
      }

      const skip = (q.page - 1) * q.limit;
      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ usernameLower: 1 })
          .skip(skip)
          .limit(q.limit)
          .lean<{ _id: Types.ObjectId; username: string; email: string }[]>(),
        User.countDocuments(filter),
      ]);

      const items: WorkerItem[] = users.map((u) => ({
        userId: String(u._id),
        username: u.username,
        email: u.email,
      }));

      if (include.has("thumbnail") && items.length) {
        const userObjIds = items.map((x) => new Types.ObjectId(x.userId));
        const lastImgs = await Ticket.aggregate<LastImgAgg>([
          {
            $match: {
              companyId: new Types.ObjectId(String(companyId)),
              userId: { $in: userObjIds },
            },
          },
          { $sort: { fecha: -1 } },
          {
            $group: { _id: "$userId", publicId: { $first: "$image.publicId" } },
          },
        ]);

        const byUser = new Map<string, string | undefined>(
          lastImgs.map((x) => [String(x._id), x.publicId])
        );

        for (const it of items) {
          it.thumbnailUrl = cldThumb(byUser.get(it.userId));
        }
      }

      res.json({ page: q.page, limit: q.limit, total, items });
    } catch (e) {
      next(e);
    }
  }
);

r.get(
  "/workers/:userId/tickets",
  requireAuth,
  requireRole("manager"),
  async (req, res, next) => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId)
        return res.status(400).json({ error: "MANAGER_WITHOUT_COMPANY" });

      const params = z.object({ userId: z.string().min(1) }).parse(req.params);
      const q = z
        .object({
          month: z
            .string()
            .regex(/^\d{4}-\d{2}$/)
            .optional(), 
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          domain: z.enum(["combustible", "ev", "peaje"]).optional(),
        })
        .parse(req.query);

      const companyObj = new Types.ObjectId(String(companyId));
      const userObj = new Types.ObjectId(params.userId);

      const exists = await User.exists({
        _id: userObj,
        companyId: companyObj,
        role: "user",
      });
      if (!exists)
        return res.status(404).json({ error: "WORKER_NOT_FOUND_IN_COMPANY" });

      const find: Record<string, unknown> = {
        companyId: companyObj,
        userId: userObj,
      };

      if (q.month) {
        const [y, mm] = q.month.split("-").map(Number);
        const from = new Date(y, mm - 1, 1);
        const to = new Date(y, mm, 1);
        find.fecha = { $gte: from, $lt: to };
      }
      if (q.domain) find.domain = q.domain;

      const skip = (q.page - 1) * q.limit;

      const [docs, total] = await Promise.all([
        Ticket.find(find)
          .sort({ fecha: -1, _id: -1 })
          .skip(skip)
          .limit(q.limit)
          .lean()
          .exec(),
        Ticket.countDocuments(find),
      ]);

      const items = docs.map((t) => {
        const amount =
          t.domain === "peaje"
            ? (t as any).importe ?? 0
            : (t as any).total ?? 0;
        const pid = t.image?.publicId;
        return {
          ticketId: String(t._id),
          domain: t.domain,
          fecha: t.fecha,
          amount,
          empresaNombre: t.empresaNombre ?? null,
          image: {
            url: t.image?.url ?? null,
            previewUrl: cldLarge(pid),
            thumbnailUrl: cldThumb(pid),
          },
        };
      });

      res.json({ page: q.page, limit: q.limit, total, items });
    } catch (e) {
      next(e);
    }
  }
);

export default r;
