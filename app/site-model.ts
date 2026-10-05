import { z } from "zod";
const image = z
  .string()
  .max(200)
  .refine(
    (v) =>
      v === "" ||
      v === "/images/main-background.png" ||
      /^\/api\/assets\/[a-zA-Z0-9.-]+$/.test(v),
  );
const link = z
  .string()
  .max(1000)
  .refine((v) => v === "" || /^https:\/\//.test(v));
export const configSchema = z.object({
  name: z.string().min(1).max(40),
  bio: z.string().max(200),
  about: z.string().max(5000),
  background: image,
  mobileBackground: image,
  avatar: image,
  position: z.enum(["left", "center", "right"]),
  mobilePosition: z.enum(["left", "center", "right", "72%"]),
  overlay: z.number().min(0).max(70),
  zoom: z.number().min(100).max(150),
  soop: link,
  youtube: link,
  cafe: link,
  vods: z
    .array(
      z.object({
        id: z.string().max(80),
        title: z.string().min(1).max(150),
        url: link.refine((v) => v.length > 0),
        thumbnail: image,
      }),
    )
    .max(100),
  events: z
    .array(
      z.object({
        id: z.string().max(80),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        title: z.string().min(1).max(150),
        kind: z.enum(["방송", "게임", "합방", "휴방"]),
      }),
    )
    .max(500),
});
export type Config = z.infer<typeof configSchema>;
export const defaults: Config = {
  name: "또오냥",
  bio: "또오냥과 함께하는 작은 공간",
  about: "",
  background: "/images/main-background.png",
  mobileBackground: "",
  avatar: "",
  position: "center",
  mobilePosition: "72%",
  overlay: 8,
  zoom: 100,
  soop: "",
  youtube: "",
  cafe: "",
  vods: [],
  events: [],
};
