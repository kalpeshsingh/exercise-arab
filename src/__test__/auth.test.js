import {authenticated as mockAuthenticated} from '../auth';

test('should return true for authenticated function', () => {

    jest.spyOn(Storage.prototype, 'getItem');

    Storage.prototype.getItem = jest.fn(() => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNTE2MjQwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.ervjmmR5MAjz-ZJpEO8nhQpptXclhoJJn1-iDMw6ULA');

    const mockDate = new Date(1516239020);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    expect(mockAuthenticated()).toBe(true);
});

