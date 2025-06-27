import Image from 'next/image';

export default function Avatar({ src, alt = 'Avatar', size = 48, style = {}, ...props }) {
    return (
        <Image
            src={src}
            alt={alt}
            width={size}
            height={size}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'inline-block',
                ...style
            }}
            {...props}
        />
    );
}