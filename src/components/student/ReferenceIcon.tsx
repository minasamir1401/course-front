import Image from 'next/image';
export default function ReferenceIcon({ name, size = 20, variant = 'outline', className = '' }: {
  name: string; size?: number; variant?: 'outline' | 'duotone'; className?: string;
}) {
  return <Image data-reference-icon={name} src={`/klevro/icons/${variant}/${name}.svg`} alt="" aria-hidden="true" width={size} height={size} className={className}/>;
}
