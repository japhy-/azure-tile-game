import React, { createContext, useEffect, useState } from 'react';
import * as Realm from 'realm-web';

export const RealmContext = createContext();

export const RealmProvider = ({ client='mongodb-atlas', appId, login, children }) => {
    const app = useRef(new Realm.App({ id: appId }));
    const [ user, setUser ] = useState(app && app.currentUser);
    const mongo = user && user.mongoClient(client);
    const [ credentials, setCredentialsActual ] = useState();
    const [ remember, setRemember ] = useState(false);

    const setCredentials = (credentials, remember=false) => {
        setRemember(remember);
        setCredentialsActual(credentials);
    };

    const newUser = (credentials) => {
        app.emailPasswordAuth.registerUser(credentials.username, credentials.password).then((res) => {
            setCredentials(credentials);
        }).catch((err) => {
            console.log(`error registering: ${err}`);
        });
    };

    const logout = () => {
        user && user.isLoggedIn && user.logOut().then(() => {
            console.log(`successfully logged out`);
            setUser(null);
        }).catch((err) => {
            console.log(`error logging out: ${err}`, user);
        });
    };

    useEffect(() => {
        if (credentials) {
            app.logIn(Realm.Credentials.emailPassword(credentials.username, credentials.password)).then((res) => {
                console.log(`successfully logged in`, res);
                setUser(res);
            }).catch((err) => {
                console.log(`error logging in: ${err}`);
            });
        }
    }, [credentials]);

    useEffect(() => {
        if (user && user.isLoggedIn) {
            console.log(`already logged in`, user);
        }

        return () => {
            console.log(`remember me = ${remember}`);
            if (!remember && user && user.isLoggedIn) {
                console.log(`logging out`, user);
                user.logOut();
            }
        };
    }, []);

    if (! user) return (
        <RealmContext.Provider value={{setCredentials, newUser}}>
            {login}
        </RealmContext.Provider>
    );

    return (
        <RealmContext.Provider value={{user, mongo, logout}}>
            {children}
        </RealmContext.Provider>
    );
};
