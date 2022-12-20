import { createContext, useState } from "react";


const AuthContext = createContext();

export const AuthContextProvidor = ({children})=>
{
    const [accessToken, setAccessToekn] = useState(localStorage.getItem("token") ? localStorage.getItem("token"): "")
       
    const authenticate = token => {
        // console.log("authenticate in context")
        localStorage.setItem("token",token)
        setAccessToekn(token)
    }
    return (
        <AuthContext.Provider value={{accessToken,authenticate}}>
            {children}
        </AuthContext.Provider>
    )
}
export default AuthContext;