import * as process from 'process';
import {spawn} from './spawn';

it('node -v', async () => {
    expect(await spawn('node -v')).toMatchObject({
        stderr: '',
        stdout: process.version,
    });
});
