"use client";
import { Suspense } from "react";
import ListProductInner from "./ListProductInner";

export default function ListProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "var(--text3)" }}>Loading…</div>}>
      <ListProductInner />
    </Suspense>
  );
}
