"use client";
import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import LivePlayer from "./live-player";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import {
  Cat,
  UserRound,
  Play,
  CalendarDays,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  RotateCcw,
  Check,
  LockKeyhole,
  MessageCircleQuestion,
  X,
} from "lucide-react";
import type { Config } from "./site-model";
const menus = [
  { key: "profile", label: "프로필", Icon: UserRound },
  { key: "vod", label: "VOD", Icon: Play },
  { key: "calendar", label: "캘린더", Icon: CalendarDays },
  { key: "minigame", label: "미니게임", Icon: Gamepad2 },
  { key: "qna", label: "Q&A", Icon: MessageCircleQuestion },
];
type AutoVod = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  platform: "soop" | "youtube";
};

type VodView =
  | "overview"
  | "soop"
  | "youtube";
export function Backdrop({
  data,
  background,
}: {
  data: Config;
  background?: string;
}) {
  const selectedBackground =
    background || data.background;

  return (
    <div
      className="backdrop"
      aria-hidden="true"
      style={
        {
          "--pc-bg": selectedBackground
            ? `url("${selectedBackground}")`
            : "none",

          "--mobile-bg":
            data.mobileBackground || selectedBackground
              ? `url("${
                  data.mobileBackground ||
                  selectedBackground
                }")`
              : "none",

          "--bg-position": data.position,
          "--mobile-position":
            data.mobilePosition,
          "--bg-scale": data.zoom / 100,
          "--shade": data.overlay / 100,
        } as React.CSSProperties
      }
    >
      <div className="backdrop-image" />
      <div className="backdrop-shade" />
    </div>
  );
}
export function ProfileCard({
  data,
  showLive = false,
}: {
  data: Config;
  showLive?: boolean;
}) {
  return (
    <article className="profile-card">
      <div className="card-eyebrow">
        <span>SOOP STREAMER</span>
        <Heart size={15} />
      </div>
      <div className="avatar">
        {data.avatar ? (
          <img src={data.avatar} alt={`${data.name} 프로필`} />
        ) : (
          <Cat size={56} strokeWidth={1} />
        )}
      </div>
      <h1>
        {data.name}
        <span className="name-mark">✦</span>
      </h1>
      <p className="profile-bio">{data.bio}</p>
      {showLive && <LivePlayer />}
      <div className="profile-divider" />
      <div className="socials">
        {data.soop ? (
          <a
            className="primary-link"
            href={data.soop}
            target="_blank"
            rel="noopener noreferrer"
          >
            SOOP 방송국 <ExternalLink size={16} />
          </a>
        ) : (
          <span className="unlinked">SOOP 링크 준비 중</span>
        )}
        {data.youtube && (
          <a
            className="secondary-link"
            href={data.youtube}