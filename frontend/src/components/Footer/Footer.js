
import React from 'react'
import { Container, Grid } from '@mui/material';
const Footer = props =>{

    return <>
       <Grid className='footer' container padding={5} spacing={0} wrap={'wrap'}>
        <Grid item xs={12} md={6}>
            <h3>
            We pursue Just tech to amplify connections between human[itarian] needs and open map data.
            </h3>
        </Grid>
        <Grid item xs={12} md={6} paddingLeft={2} >
            links
        </Grid>

        <Grid item xs={12} md={6} >
            <a target={'_blank'} rel="noreferrer" href={"https://creativecommons.org/licenses/by-sa/4.0/"}>
                  <img className="mb1" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" alt="Creative Commons License" />
        <br/>
        Images and screenshots of the fAIr may be shared under a Creative Commons Attribution-Sharealike 4.0 International License
Free and Open Source Software brought to you by the Humanitarian OpenStreetMap Team.
      </a>
        </Grid>
        <Grid item xs={12} md={6}  paddingLeft={2} >
            Media and communication
        </Grid>
        </Grid>

    
    </>
}
export default Footer;