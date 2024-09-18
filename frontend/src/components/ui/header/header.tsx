import Button from '../button/button'
import NavBar from './navbar'
import './styles.css'

const Header = () => {
  return (
    <header>
      <NavBar />
      <main className='main'>
        <div className='main-content'>
          <h1>Your AI Mapping Partner</h1>
          <p>
            AI-powered assistant that replicates your mapping samples
            intelligently and quickly, helping you map smarter and faster.
          </p>
          <div className='buttons'>
            <Button variant='primary'>Create Model</Button>
            <Button variant='secondary'>Start Mapping</Button>
          </div>
        </div>
      </main>
    </header>
  )
}

export default Header
