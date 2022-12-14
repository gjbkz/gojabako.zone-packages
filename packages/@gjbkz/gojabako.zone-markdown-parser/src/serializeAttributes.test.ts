import {serializeAttributes} from './serializeAttributes';

test('serialize attributes', () => {
    const input = {class: '<value>', bool: true, empty: ''};
    const expected = ' class="&#60;value&#62;" bool="" empty=""';
    expect([...serializeAttributes(input, {jsx: false})].join('')).toBe(expected);
});

test('serialize attributes for jsx', () => {
    const input = {class: '<value>', bool: true, empty: ''};
    const expected = ' className="&#60;value&#62;" bool="" empty=""';
    expect([...serializeAttributes(input, {jsx: true})].join('')).toBe(expected);
});

test('serialize style attributes for jsx', () => {
    const input = {style: 'margin-block-start:1em'};
    const expected = ' style={{marginBlockStart:\'1em\'}}';
    expect([...serializeAttributes(input, {jsx: true})].join('')).toBe(expected);
});
