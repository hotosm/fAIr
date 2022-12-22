import React, { useContext } from 'react'
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Icon } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import Login from '../Login/Login';
import authContext from '../../Context/AuthContext';
import UserProfile from './UserProfile';

const pages = [
  { name: 'Get Started', path: "/get-started" },
  { name: 'Why fAIr?', path: "/why-fair" },
  { name: 'Training Datasets', path: "/training-datasets" },
  { name: 'AI Models', path: "/ai-models" },
  { name: 'Start Mapping', path: "/start-mapping" },
  { name: 'Documentation', path: "/documentation" }];

const settings = ['Log in with OSM Account', 'Logout'];

function Header() {
  const { accessToken,authenticate } = useContext(authContext)
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = (e) => {
    setAnchorElNav(null);
    if (e && e !== '')
      navigate(e)
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);

  };

  const logOut = () =>
  {
    handleCloseUserMenu();
    localStorage.removeItem("token")
    authenticate("")

  }

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Icon className={"logo"} onClick={() => navigate("/")}>
            <img className={""} src="/hotosm_logo.svg" alt='HOTOSM logo' />
          </Icon>
          <Icon className={"logo MuiIcon-root2"} onClick={() => navigate("/")}>
            <img className={""} src="/tech_out_logo.svg" alt='tech out logo' />
          </Icon>
          <Typography
            variant="span"
            component="a"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'primary',
              textDecoration: 'none',
            }}
          >
            <h2> fAIr</h2>
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => handleCloseNavMenu(page.path)}>
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Typography
            variant="span"
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '.2rem',
              color: 'primary',
              textDecoration: 'none',
            }}
          >
            <h2> fAIr</h2>
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.path}
                onClick={() => handleCloseNavMenu(page.path)}
                sx={{ my: 2, 
                  color: 'primary', 
                  display: 'block', 
                  margin: "0px 0px", 
                  backgroundColor: "transparent  !important",
                }}
                
              >
                {page.name}
              </Button>
            ))}
          </Box>

          <Box sx={
            { flexGrow: 0, textAlign: "center", marginRight: '-20px', marginTop: '10px' } 
            }>
                 <UserProfile handleOpenUserMenu={handleOpenUserMenu}></UserProfile>                          
            <Menu
              sx={{ mt: '35px',  }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {!accessToken && <Login handleCloseUserMenu={handleCloseUserMenu}>
              </Login>}
             {accessToken && <MenuItem onClick={logOut}>
                <Typography textAlign="center">Log out </Typography>
              </MenuItem>}

            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>

  );
}
export default Header;