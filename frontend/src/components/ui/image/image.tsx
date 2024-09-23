

type ImageProps = {
    src: string
    alt: string
    title?: string
    width?: string
    height?: string
    className?: string
}

const Image: React.FC<ImageProps> = ({ src, alt, title, width, height, className }) => {
    return (
        <img src={src} alt={alt} title={title || alt} width={width} height={height} className={className}></img>
    )
}

export default Image 