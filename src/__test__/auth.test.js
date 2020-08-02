import {authenticated as mockAuthenticated} from '../auth';
import {parseJwt} from '../utils';

jest.mock('../utils');

test('should return true for authenticated function', () => {

    jest.spyOn(Storage.prototype, 'getItem');
    Storage.prototype.getItem = jest.fn(() => 'abc');

    parseJwt.mockImplementation(() => {
        return {
            exp: 1516240
        }
    });

    const mockDate = new Date(1516239020);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    expect(mockAuthenticated()).toBeTruthy();
});

