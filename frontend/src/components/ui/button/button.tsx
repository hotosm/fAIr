import SlButton from '@shoelace-style/shoelace/dist/react/button/index.js'
import './styles.css'

type ButtonVariant = 'primary' | 'secondary'

// todo - link buttons, action buttons etc

const Button = ({
  children,
  variant
}: {
  children: React.ReactNode
  variant: ButtonVariant
}) => {
  return (
    <SlButton variant='primary' size='large' className={`button ${variant}`}>
      {children}
    </SlButton>
  )
}

export default Button
