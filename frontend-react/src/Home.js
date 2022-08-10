import {useState} from 'react';
import {Box, Button, TextField} from '@mui/material';

import {
    initLogin as commInitLogin,
    logout as commLogout,
    whoami as commWhoAmI,
} from './communicator';

export default function Home({}) {
    const defaultUri = 'https://harmony.one';
    const [redirectUri, setRedirectUri] = useState(defaultUri);

    function onChangeRedirectUri(evt) {
        setRedirectUri(evt.target.value.toString());
    }

    function initLogin() {
        commInitLogin({redirect: redirectUri})
            .then(({callback, message, caller}) => {
                // The API server has already encoded the params, send directly.
                const params = `callback=${callback}&message=${message}&caller=${caller}`;
                window.location.href = `${process.env.REACT_APP_SMS_WALLET_SIGN_URI}?${params}`;
            }).catch((err) => console.error(err));
    }
    function logout() {
        commLogout().then(window.location.reload).catch((e) => {
            console.error(e);
            alert("Failed to logout, check the console");
        });
    }
    function whoami() {
        commWhoAmI().then((obj) => {
            console.log(obj);
            if (obj.isAuthenticated) {
                alert(`You are ${obj.address}`);
            } else {
                alert('I have no idea, try logging in.');
            }
        })
    }

    return (
        <Box>
            <TextField onChange={onChangeRedirectUri}
                       defaultValue={defaultUri}
                       helperText='After a successful login, where should the user be redirected?' />
            <Button onClick={initLogin}>Initialize Login</Button>
            <Button onClick={logout}>Logout</Button>
            <Button onClick={whoami}>Who Am I?</Button>
        </Box>
    );
}