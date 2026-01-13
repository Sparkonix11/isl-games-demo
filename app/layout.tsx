import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Alphabet Fishing - ISL Edition",
    description: "Learn alphabet letters by fishing with Indian Sign Language gestures!",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
