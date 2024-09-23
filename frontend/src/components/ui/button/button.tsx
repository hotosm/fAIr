import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
import './button.css'

type ButtonVariant = 'primary' | 'secondary'



const Button = ({
  children,
  variant,
  className
}: {
  children: React.ReactNode
  variant: ButtonVariant,
  className?: string
}) => {
  return (
    <SlButton variant='primary' size='large' className={`button ${variant} ${className}`} style={{ width: '100%' }}>
      {children}
    </SlButton>
  )
}

export default Button
