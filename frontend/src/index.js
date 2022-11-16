import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import reportWebVitals from "./reportWebVitals";
import theme from "./theme";
import { QueryClient, QueryClientProvider } from "react-query";
import Fair from "./Fair/Fair";
import { BrowserRouter } from "react-router-dom";

const queryClient = new QueryClient();
if (process.env.REACT_APP_ENV === "Production") console.log = (args) => {};
// console.log = (args) => {};
ReactDOM.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    <QueryClientProvider client={queryClient}>
      <React.StrictMode>
      <BrowserRouter>
        <Fair />
      </BrowserRouter>
        
      </React.StrictMode>
    </QueryClientProvider>
  </ThemeProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
