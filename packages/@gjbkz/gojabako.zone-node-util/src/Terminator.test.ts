import {Buffer} from 'buffer';
import {Terminator} from './Terminator';

test('keep chunks and return a concatenated buffer', () => {
    const terminator = new Terminator();
    terminator.write(' foo');
    terminator.write('bar ');
    expect(terminator.flush()).toEqual(Buffer.from(' foobar '));
});

test('keep chunks and return a concatenated string', () => {
    const terminator = new Terminator();
    terminator.write(' foo');
    terminator.write('bar ');
    expect(terminator.flushAsString()).toBe('foobar');
});
