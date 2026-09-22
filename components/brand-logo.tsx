import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  size?: number;
};

export function BrandLogo({
  className = "",
  imageClassName = "",
  nameClassName = "",
  showName = false,
  size = 44,
}: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        alt="Trinity-AI logo"
        className={`shrink-0 rounded-lg object-cover ${imageClassName}`}
        height={size}
        src="/trinity-logo.png"
        width={size}
      />
      {showName ? (
        <span className={nameClassName}>Trinity-AI</span>
      ) : null}
    </span>
  );
}
