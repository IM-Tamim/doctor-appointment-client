"use client";
import { useState } from "react";
import Image from "next/image";

const SIZE_CLASSES = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-20 h-20 text-2xl",
};

const Avatar = ({ src, name, size = "md", className = "" }) => {
    const [failed, setFailed] = useState(false);
    const initial = name?.charAt(0)?.toUpperCase() || "U";
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const pixelSize = { sm: 32, md: 36, lg: 48, xl: 80 }[size] || 36;
    const showImage = src && !failed;

    return (
        <div
            className={`relative rounded-full overflow-hidden shrink-0 border-2 border-primary/30 bg-primary/10 flex items-center justify-center ${sizeClass} ${className}`}
        >
            {showImage ? (
                <Image
                    src={src}
                    alt={name || "User"}
                    fill
                    sizes={`${pixelSize}px`}
                    className="object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="font-bold text-primary">{initial}</span>
            )}
        </div>
    );
};

export default Avatar;
