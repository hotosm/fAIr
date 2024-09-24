import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
import './button.css'

type ButtonVariant = 'primary' | 'secondary'


type ButtonProps = {
  children: React.ReactNode
  variant: ButtonVariant,
  className?: string
  onClick?: () => void
}
const Button: React.FC<ButtonProps> = ({
  children,
  variant,
  className,
  onClick,

}) => {
  return (
    <SlButton variant='primary' size='large' className={`button ${variant} ${className}`} style={{ width: '100%' }} onClick={onClick} >
      {children}
    </SlButton>
  )
}

export default Button
