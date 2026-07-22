"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BRAND_TEXTS = ["tadi", "업무를 나누다", "task divide"];
const ROTATE_INTERVAL_MS = 8000;

export default function BrandLogo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % BRAND_TEXTS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/" className="text-xl font-bold tracking-tight text-blue-600">
      {BRAND_TEXTS[index]}
    </Link>
  );
}
