import util from "util";
import * as child from "child_process";

const exec = util.promisify(child.exec);


/**
 * If this method is invoked as its util.promisify()ed version,
 * it returns a Promise for an Object with stdout and stderr properties.
 * In case of an error (including any error resulting in an exit code other than 0),
 * a rejected promise is returned, with the same error object given in the callback,
 * but with an additional two properties stdout and stderr.
 */

/**
 * If timeout is greater than 0, the parent will send the signal
 * identified by the killSignal property (the default is 'SIGTERM')
 * if the child runs longer than timeout milliseconds.
 */
const defaultTimeout = 15 * 60 * 1000; // ms

/**
 * Run arbitrary commands in a shell in the DAPPMANAGER container
 */
export default async function shell(
    cmd: string,
    options?: { timeout?: number; maxBuffer?: number }
): Promise<string> {
    const timeout = options && options.timeout ? options.timeout : defaultTimeout;
    const maxBuffer = options && options.maxBuffer;
    return exec(cmd, { timeout, maxBuffer })
        .then(res => (res.stdout || "").trim())
        .catch(err => {
            if (err.signal === "SIGTERM") {
                throw Error(`cmd "${err.cmd}" timed out (${timeout} ms)`);
            }
            throw err;
        });
}

