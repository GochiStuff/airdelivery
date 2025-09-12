"use client"
import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
    socket: Socket | null;
    reconnect: () => void;
    user : User ;
};

type User = { 
    id ? : string , 
    name ?: string 
}



const SocketContext = createContext<SocketContextType>({
    socket:null,
    user  : { id : ''},
    reconnect: () => {}
});

type SocketProviderProps = {
    children: ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
   const [socket, setSocket] = useState<Socket | null>(null);
   
   const [ user , setuser ] = useState<User>( { id : "Unkown" , name: "Unkown"});

    useEffect(() => {
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET || "http://localhost:5500", {
        transports: ['websocket'], 
        withCredentials: true 
        });
        setSocket(newSocket);

        newSocket.on("yourName", (user: User) => {
            setuser(user);
        });


        return () => {
            newSocket.disconnect();
        };
    }, []);

    const reconnect = () => {
    socket?.disconnect();

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET || "http://locahost:5500", {
        transports: ['websocket'],
        withCredentials: true
    });

    newSocket.on("yourName", (user: User) => {
        setuser(user);
    });

    

    setSocket(newSocket);
    };


    return (
        <SocketContext.Provider value={  {socket , user , reconnect}} >
            {children}
        </SocketContext.Provider>
    );
};


export const useSocket = () => useContext(SocketContext);
