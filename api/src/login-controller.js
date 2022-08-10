import URLSearchParams from '@ungap/url-search-params';
import { v4 as uuidv4 } from 'uuid';
import web3 from 'web3';
import ethers from 'ethers';

export default class LoginController {
    constructor({store, lookup, remove, appName, messagePrefix}) {
        this.appName = appName;
        this.store = store;
        this.lookup = lookup;
        this.remove = remove;
        this.messagePrefix = messagePrefix || '';
    }

    initLogin({callbackUrl, callbackParams}) {
        const callback = LoginController.base64UrlEncode(`${callbackUrl}?${LoginController._getQueryStringFromObject(callbackParams)}`);
        const message = LoginController.urlEncode(this.generateMessage());
        const caller = LoginController.urlEncode(this.appName);

        return {
            callback,
            message,
            caller,
        }
    }

    verifyLogin({signature, messageHash, address, error, cancelled}) {
        if (error || cancelled) return false;
        // 1. Verify this is a message we sent
        const originalMessage = this.lookup(messageHash);
        console.log('original message', originalMessage);
        if (!originalMessage) return false;

        // 2. Only the address returned based on signature should matter,
        // but we'll check against address provided as sanity check
        const sigAddress = ethers.utils.verifyMessage(originalMessage, signature);
        console.log('sigAddress', sigAddress);
        if (sigAddress !== address) return false;

        return true;
    }

    generateMessage() {
        const otc = LoginController.generateOneTimeCode();
        const msg = `${this.messagePrefix}${new Date().toISOString()} -- ${otc}.`;
        // web3 accounts that SMS wallet uses envelopes the message. We'll need to modify it to match.
        const envelopeMsg = "\x19Ethereum Signed Message:\n" + msg.length + msg;
        const msgHash = web3.utils.soliditySha3(envelopeMsg);
        console.log('messageHash', msgHash);
        this.store(msgHash, msg);
        return msg;
    }

    static _getQueryStringFromObject(obj) {
        if (!obj || Object.keys(obj).length === 0) return '';

        const params = new URLSearchParams();
        for (let k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            params.set(k, obj[k]);
        }
        console.log(params.toString());
        return params.toString();
    }

    static base64Encode(s) {
        return Buffer.from(s).toString('base64');
    }
    static urlEncode(s) {
        return encodeURIComponent(s);
    }
    static base64UrlEncode(s) {
        const b64 = LoginController.base64Encode(s);
        return LoginController.urlEncode(b64);
    }
    static generateOneTimeCode() {
        return uuidv4();
    }
}