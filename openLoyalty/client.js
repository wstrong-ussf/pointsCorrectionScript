import fetch from 'node-fetch';
import config from '../config.js';

export const openLoyalty = {
    get: async (url, options) => {
        try {
            return await fetch(`${config.OPENLOYALTY_URL}${url}`, {
                ...options,
                method: "get",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-AUTH-TOKEN": config.OPENLOYALTY_API_KEY
                }
            });
        } catch(e) {
            throw {
                statusCode: 500,
                body: {
                    message: "OpenLoyalty GET returned unexpected response",
                    errors: e.issues
                }
            }
        }
    },
    post: async (url, options) => {
        try{
            console.log("hitting Open Loyalty POST...");
            return await fetch(`${config.OPENLOYALTY_URL}${url}`, {
                ...options,
                method: "post",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-AUTH-TOKEN": config.OPENLOYALTY_API_KEY
                }
            });
        } catch(e) {
            throw {
                statusCode: 500,
                body: {
                    message: "OpenLoyalty POST returned unexpected response",
                    errors: e.issues
                }
            }
        }
    }
}
