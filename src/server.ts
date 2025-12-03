import { Server } from 'http';
import app from './app';
import config from './config';

let server: Server;

async function main() {
    try {
        const port = Number(config.port) || 5000;
        server = app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.log(err);
    }
}

main();
