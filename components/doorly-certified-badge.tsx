import Image from "next/image";

interface DoorlyCertifiedBadgeProps {
  size?: "sm" | "md" | "lg";
}

export function DoorlyCertifiedBadge({ size = "md" }: DoorlyCertifiedBadgeProps) {
  const sizes = {
    sm: { container: "px-2 py-1 gap-1.5", logo: 16, text: "text-xs" },
    md: { container: "px-3 py-1.5 gap-2", logo: 22, text: "text-sm" },
    lg: { container: "px-4 py-2 gap-2.5", logo: 28, text: "text-base" },
  };

  const s = sizes[size];

  return (
    <div
      className={`inline-flex items-center ${s.container} rounded-full font-semibold
                  bg-white border border-primary/20 shadow-sm`}
    >
      <Image
        src="/logo-d.png"
        alt="Doorly"
        width={s.logo}
        height={s.logo}
        className="object-contain shrink-0"
      />
      <span className={`${s.text} text-primary font-bold tracking-wide`}>
        Certificado
      </span>
    </div>
  );
}