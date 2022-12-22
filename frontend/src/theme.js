import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#2c3038',
    },
    secondary: {
      main: '#19857b',
    },
    hot: {
      main: '#D63F40',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;