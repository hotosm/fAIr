import { Avatar, IconButton, Typography } from '@mui/material'
import React, { useContext, useEffect } from 'react'
import AuthContext from '../../Context/AuthContext'
import axios from '../../axios'
import { useQuery } from 'react-query'
const UserProfile = props => {

    const { accessToken } = useContext(AuthContext);

    const authMe = async () => {

        if (!accessToken) return;
        try {
            const headers = {
                "access-token": accessToken
            }
            const res = await axios.get(`/auth/me/`, { headers });

            if (res.error) {
                // setMapError(res.error.response.statusText);
                console.log(res);
            }
            else {
                console.log('Auth me ', res.data)
                return res.data;
            }

        } catch (e) {
            console.log("isError", e);

        } finally {

        }
    };
    const { data, refetch } = useQuery("authMe" + props.aoiId, authMe, { refetchInterval: 120000 });

    useEffect(() => {
        if (accessToken)
            refetch()

        return () => {

        }
    }, [accessToken, refetch])

    return (

        <div>
            <IconButton onClick={props.handleOpenUserMenu} sx={{ p: 0 }} >
                <Avatar alt="Remy Sharp" src={accessToken && data && data.img_url} />
            </IconButton>
            <Typography variant="caption" display="block" textAlign="center" gutterBottom>{accessToken && data ? data.username : "Login here"}</Typography>
        </div>
    )
}

export default UserProfile