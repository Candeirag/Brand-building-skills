import { brand } from '../config/siteConfig';

interface LogoProps {
  size?: 'md' | 'lg';
}

/** Marca: símbolo (ou a imagem do logo, quando existe) + logotipo tipográfico. */
export function Logo({ size = 'md' }: LogoProps) {
  const large = size === 'lg';
  return (
    <span className="flex items-center gap-3">
      {brand.logoImage ? (
        <img
          src={brand.logoImage}
          alt=""
          width={large ? 72 : 42}
          height={large ? 72 : 42}
          className={large ? 'h-[72px] w-[72px]' : 'h-[42px] w-[42px]'}
        />
      ) : (
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className={large ? 'h-12 w-12' : 'h-8 w-8'}
        >
          <path
            d="M3 24 L9.5 5 H20 a8 9.5 0 0 1 0 19 Z M11.2 19.6 H19.4 a3.6 5 0 0 0 0-10.2 H14.6 Z"
            fill="currentColor"
            fillRule="evenodd"
          />
          <rect x="2" y="27" width="28" height="2.6" fill="var(--brand-accent)" />
        </svg>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={`display !leading-none ${large ? 'text-[34px]' : 'text-[19px]'}`}
        >
          {brand.wordmark.primary}
        </span>
        <span
          className={`mt-[5px] font-display font-medium ${brand.logoImage ? 'text-accent' : 'text-ink/70'} ${
            large ? 'text-[13px] tracking-[0.52em]' : 'text-[8.5px] tracking-[0.47em]'
          }`}
        >
          {brand.wordmark.secondary}
        </span>
      </span>
    </span>
  );
}
