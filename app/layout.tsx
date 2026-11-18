import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIP Studio — Digital Image Processing Preparation",
  description: "A Digital Image Processing preparation workspace with five modules of study notes, worked formulas, quizzes, flashcards, a study planner, method comparisons and Python/OpenCV code examples.",
  keywords: ["Digital Image Processing", "DIP preparation", "DIP notes", "OpenCV practicals", "image enhancement", "image restoration", "image compression", "image segmentation", "DFT", "DCT", "GLCM"],
  openGraph: {
    title: "DIP Studio — Learn, Practise, Master",
    description: "Study notes, quizzes, flashcards, preparation planning and Python/OpenCV code for Digital Image Processing.",
    type: "website"
  },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
